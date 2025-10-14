import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for property field updates
const propertyFillSchema = z.object({
  // Location fields
  wojewodztwo: z.string().min(1).max(100).optional(),
  powiat: z.string().min(1).max(100).optional(),
  gmina: z.string().min(1).max(100).optional(),
  miejscowosc: z.string().min(1).max(100).optional(),
  ulica: z.string().min(1).max(200).optional(),
  numer_nieruchomosci: z.string().min(1).max(50).optional(),
  kod_pocztowy: z.string().regex(/^[0-9]{2}-[0-9]{3}$/, 'Kod pocztowy musi być w formacie XX-XXX').optional(),

  // Price fields
  cena_za_m2_aktualna: z.number().min(0).optional(),
  cena_finalna_aktualna: z.number().min(0).optional(),
  cena_bazowa_aktualna: z.number().min(0).optional(),

  // Area fields
  powierzchnia_uzytkowa: z.number().min(0).optional(),
  powierzchnia_calkowita: z.number().min(0).optional(),

  // Date fields
  data_pierwszej_oferty: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data_obowiazywania_ceny_od: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Property details
  liczba_pokoi: z.number().int().min(1).max(20).optional(),
  kondygnacja: z.number().int().min(-2).max(100).optional(),
  liczba_kondygnacji: z.number().int().min(1).max(100).optional(),

  // Status and ownership
  status_sprzedazy: z.enum(['dostępne', 'zarezerwowane', 'sprzedane']).optional(),
  forma_wlasnosci: z.enum(['pełna własność', 'spółdzielcze własnościowe', 'spółdzielcze lokatorskie', 'TBS']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Przynajmniej jedno pole musi być wypełnione' }
)

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get property ID from route params
    const { id: propertyId } = await context.params

    // Verify property belongs to this developer
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, developer_id, property_number')
      .eq('id', propertyId)
      .eq('developer_id', developer.id)
      .single()

    if (propError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 404 }
      )
    }

    // Check if property has raw CSV data (to ensure we're not overwriting CSV values)
    const { data: rawCsvData } = await supabase
      .from('raw_csv_data')
      .select('raw_data')
      .eq('property_id', propertyId)
      .maybeSingle()

    const csvFields = rawCsvData?.raw_data || {}

    // Parse and validate request body
    const body = await request.json()
    const validatedData = propertyFillSchema.parse(body)

    // Filter out fields that already exist in raw CSV data (never overwrite CSV values)
    const fieldsToUpdate: Record<string, unknown> = {}
    const skippedFields: string[] = []

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Check if field exists in raw CSV data
        if (csvFields[key] !== undefined && csvFields[key] !== null && csvFields[key] !== '') {
          skippedFields.push(key)
          console.log(`⚠️ Skipping field ${key} - already exists in CSV data:`, csvFields[key])
        } else {
          fieldsToUpdate[key] = value
        }
      }
    })

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Wszystkie pola już istnieją w danych CSV',
          skippedFields
        },
        { status: 400 }
      )
    }

    console.log(`📝 Updating property ${property.property_number} with manual fills:`, fieldsToUpdate)

    // Update property with manual fills
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        ...fieldsToUpdate,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .eq('developer_id', developer.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating property:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Property updated successfully')

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      updatedFields: Object.keys(fieldsToUpdate),
      skippedFields: skippedFields.length > 0 ? skippedFields : undefined
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nieprawidłowe dane',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('💥 Error in property fill API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
