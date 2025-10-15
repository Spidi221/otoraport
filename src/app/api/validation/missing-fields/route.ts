/**
 * VALIDATION API - Ministry Compliance Missing Fields Detection
 * Task #90.2 - Implement API endpoint using ministry-validation service
 *
 * GET /api/validation/missing-fields?developerId={uuid}
 *
 * Analyzes developer's properties for missing required/recommended ministerial fields
 * and format errors. Returns comprehensive validation summary with actionable warnings.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateProperties } from '@/lib/ministry-validation'
import type { ParsedProperty } from '@/lib/api-schemas'
import type {
  ValidationMissingFieldsResponse,
  MissingFieldSummaryEntry,
  PropertyValidationItem,
} from '@/lib/api-schemas'
import { REQUIRED_FIELDS, RECOMMENDED_FIELDS } from '@/lib/ministry-validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ========================================================================
    // DEVELOPER IDENTIFICATION
    // ========================================================================

    // Get developerId from query param (for admin access) or use authenticated user's developer
    const searchParams = request.nextUrl.searchParams
    const requestedDeveloperId = searchParams.get('developerId')

    let developerId: string

    if (requestedDeveloperId) {
      // TODO: Add admin role check here when admin roles are implemented
      // For now, only allow users to query their own developer profile
      const { data: developer, error: devError } = await supabase
        .from('developers')
        .select('id, user_id')
        .eq('id', requestedDeveloperId)
        .single()

      if (devError || !developer) {
        return NextResponse.json(
          { success: false, error: 'Developer not found' },
          { status: 404 }
        )
      }

      // Security check: Ensure user owns this developer profile
      if (developer.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - not your developer profile' },
          { status: 403 }
        )
      }

      developerId = developer.id
    } else {
      // Use authenticated user's developer profile
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

      developerId = developer.id
    }

    // ========================================================================
    // FETCH PROPERTIES WITH RAW CSV DATA
    // ========================================================================

    const { data: dbProperties, error: propsError } = await supabase
      .from('properties')
      .select(`
        id,
        developer_id,
        apartment_number,
        property_type,
        wojewodztwo,
        powiat,
        gmina,
        miejscowosc,
        ulica,
        numer_nieruchomosci,
        kod_pocztowy,
        cena_za_m2_aktualna,
        cena_bazowa,
        cena_finalna_aktualna,
        powierzchnia_uzytkowa,
        data_pierwszej_oferty,
        liczba_pokoi,
        kondygnacja,
        liczba_kondygnacji,
        rok_budowy,
        status_sprzedazy,
        forma_wlasnosci,
        raw_csv_data(raw_data)
      `)
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })

    if (propsError) {
      console.error('❌ VALIDATION API: Error fetching properties:', propsError)
      return NextResponse.json(
        { success: false, error: propsError.message },
        { status: 500 }
      )
    }

    // Handle empty properties list
    if (!dbProperties || dbProperties.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalProperties: 0,
            propertiesWithIssues: 0,
            propertiesValid: 0,
            complianceScore: 100, // No properties = 100% compliant
          },
          missingFieldsSummary: {},
          properties: [],
        },
      } as ValidationMissingFieldsResponse)
    }

    // ========================================================================
    // CONVERT DATABASE PROPERTIES TO PARSED PROPERTY FORMAT
    // ========================================================================

    const parsedProperties: ParsedProperty[] = dbProperties.map((dbProp) => {
      // Extract raw CSV data (from raw_csv_data relation)
      const rawCsvData = Array.isArray(dbProp.raw_csv_data) && dbProp.raw_csv_data.length > 0
        ? (dbProp.raw_csv_data[0] as { raw_data?: Record<string, unknown> })?.raw_data || {}
        : {}

      return {
        // Basic identification
        property_number: dbProp.apartment_number || undefined,
        property_type: dbProp.property_type || undefined,

        // Location (from database columns)
        wojewodztwo: dbProp.wojewodztwo || undefined,
        powiat: dbProp.powiat || undefined,
        gmina: dbProp.gmina || undefined,
        miejscowosc: dbProp.miejscowosc || undefined,
        ulica: dbProp.ulica || undefined,
        numer_nieruchomosci: dbProp.numer_nieruchomosci || undefined,
        kod_pocztowy: dbProp.kod_pocztowy || undefined,

        // Pricing (from database columns)
        price_per_m2: dbProp.cena_za_m2_aktualna || undefined,
        base_price: dbProp.cena_bazowa || undefined,
        total_price: dbProp.cena_finalna_aktualna || undefined,
        area: dbProp.powierzchnia_uzytkowa || undefined,

        // Additional fields
        liczba_pokoi: dbProp.liczba_pokoi || undefined,
        kondygnacja: dbProp.kondygnacja || undefined,
        construction_year: dbProp.rok_budowy || undefined,

        // Raw CSV data (contains ALL ministry fields including developer info)
        raw_data: rawCsvData as Record<string, unknown>,
      }
    })

    // ========================================================================
    // VALIDATE PROPERTIES USING MINISTRY VALIDATION SERVICE
    // ========================================================================

    const validationResult = validateProperties(parsedProperties)

    // ========================================================================
    // BUILD MISSING FIELDS SUMMARY
    // ========================================================================

    const missingFieldsSummary: Record<string, MissingFieldSummaryEntry> = {}

    // Count how many properties are missing each field
    const fieldCounts: Record<string, { count: number; severity: 'critical' | 'warning' | 'info' }> = {}

    validationResult.propertyResults.forEach((propResult) => {
      // Count required fields
      propResult.missingRequired.forEach((field) => {
        if (!fieldCounts[field]) {
          fieldCounts[field] = { count: 0, severity: 'critical' }
        }
        fieldCounts[field].count++
      })

      // Count recommended fields
      propResult.missingRecommended.forEach((field) => {
        if (!fieldCounts[field]) {
          fieldCounts[field] = { count: 0, severity: 'info' }
        }
        fieldCounts[field].count++
      })
    })

    // Build summary entries with percentages and labels
    Object.entries(fieldCounts).forEach(([fieldName, { count, severity }]) => {
      const percentage = Math.round((count / dbProperties.length) * 100)

      // Get human-readable field label
      let fieldLabel = fieldName
      if (REQUIRED_FIELDS[fieldName as keyof typeof REQUIRED_FIELDS]) {
        fieldLabel = REQUIRED_FIELDS[fieldName as keyof typeof REQUIRED_FIELDS]
      } else if (RECOMMENDED_FIELDS[fieldName as keyof typeof RECOMMENDED_FIELDS]) {
        fieldLabel = RECOMMENDED_FIELDS[fieldName as keyof typeof RECOMMENDED_FIELDS]
      }

      missingFieldsSummary[fieldName] = {
        count,
        percentage,
        severity,
        fieldLabel,
      }
    })

    // ========================================================================
    // BUILD PROPERTIES RESPONSE
    // ========================================================================

    const properties: PropertyValidationItem[] = validationResult.propertyResults.map((propResult, index) => {
      const dbProp = dbProperties[index]

      // Format address for display
      const addressParts = [
        dbProp.miejscowosc,
        dbProp.ulica,
        dbProp.numer_nieruchomosci,
      ].filter(Boolean)

      const address = addressParts.length > 0
        ? addressParts.join(', ')
        : `Nieruchomość ${propResult.propertyNumber}`

      return {
        id: dbProp.id,
        propertyNumber: propResult.propertyNumber,
        address,
        status: propResult.valid ? 'valid' : 'invalid',
        errors: propResult.errors,
        warnings: propResult.warnings,
        missingRequired: propResult.missingRequired,
        missingRecommended: propResult.missingRecommended,
        invalidFormats: propResult.invalidFormats,
      }
    })

    // ========================================================================
    // BUILD FINAL RESPONSE
    // ========================================================================

    const response: ValidationMissingFieldsResponse = {
      success: true,
      data: {
        summary: {
          totalProperties: validationResult.totalProperties,
          propertiesWithIssues: validationResult.invalidProperties,
          propertiesValid: validationResult.validProperties,
          complianceScore: validationResult.complianceScore,
        },
        missingFieldsSummary,
        properties,
      },
    }

    console.log(`✅ VALIDATION API: Analyzed ${validationResult.totalProperties} properties, compliance: ${validationResult.complianceScore}%`)

    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('❌ VALIDATION API: Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
