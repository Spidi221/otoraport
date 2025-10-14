import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { REQUIRED_FIELDS, RECOMMENDED_FIELDS } from '@/lib/ministry-field-definitions'

// Ministry-required fields mapping
const MINISTRY_FIELDS = {
  required: REQUIRED_FIELDS,
  recommended: RECOMMENDED_FIELDS
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json(
        { success: false, error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // Fetch all properties for this developer with their raw CSV data
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select(`
        id,
        property_number,
        property_type,
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        numer_nieruchomosci,
        kod_pocztowy,
        cena_za_m2_aktualna,
        cena_finalna_aktualna,
        powierzchnia_uzytkowa,
        data_pierwszej_oferty,
        data_obowiazywania_ceny_od,
        liczba_pokoi,
        kondygnacja,
        liczba_kondygnacji,
        status_sprzedazy,
        forma_wlasnosci,
        raw_csv_data!inner(raw_data)
      `)
      .eq('developer_id', developer.id)
      .order('created_at', { ascending: false })

    if (propsError) {
      console.error('Error fetching properties:', propsError)
      return NextResponse.json(
        { success: false, error: propsError.message },
        { status: 500 }
      )
    }

    // Process each property to find missing fields
    const propertiesWithMissingFields = properties
      .map(property => {
        // Get raw CSV data (if exists)
        const rawCsvData = Array.isArray(property.raw_csv_data) && property.raw_csv_data.length > 0
          ? property.raw_csv_data[0]?.raw_data || {}
          : {}

        const missingRequiredFields = MINISTRY_FIELDS.required.filter(fieldDef => {
          const currentValue = property[fieldDef.field as keyof typeof property]
          const rawValue = rawCsvData[fieldDef.field]

          // Field is missing if:
          // 1. No value in properties table AND
          // 2. No value in raw CSV data (so it wasn't in original upload)
          return !currentValue && !rawValue
        })

        const missingRecommendedFields = MINISTRY_FIELDS.recommended.filter(fieldDef => {
          const currentValue = property[fieldDef.field as keyof typeof property]
          const rawValue = rawCsvData[fieldDef.field]

          return !currentValue && !rawValue
        })

        // Format address for display
        const addressParts = [
          property.miejscowosc,
          property.ulica,
          property.numer_nieruchomosci
        ].filter(Boolean)

        const address = addressParts.length > 0
          ? addressParts.join(', ')
          : `Nieruchomość ${property.property_number}`

        return {
          id: property.id,
          property_number: property.property_number,
          property_type: property.property_type || 'mieszkanie',
          address,
          missingRequiredFields,
          missingRecommendedFields
        }
      })
      .filter(prop =>
        // Only include properties that have at least one missing field
        prop.missingRequiredFields.length > 0 || prop.missingRecommendedFields.length > 0
      )

    return NextResponse.json({
      success: true,
      properties: propertiesWithMissingFields,
      summary: {
        total: properties.length,
        withMissingFields: propertiesWithMissingFields.length,
        complete: properties.length - propertiesWithMissingFields.length
      }
    })

  } catch (error) {
    console.error('Error in missing-fields API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
