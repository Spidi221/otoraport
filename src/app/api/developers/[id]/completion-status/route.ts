/**
 * DEVELOPER COMPLETION STATUS API
 * Task #101.3 - Get developer profile completion status
 *
 * GET /api/developers/{id}/completion-status
 *
 * Returns detailed completion status for a developer profile including:
 * - Overall completion percentage
 * - Section-by-section breakdown
 * - Missing critical and recommended fields
 * - Actionable next steps for completing profile
 *
 * Response:
 * {
 *   success: boolean
 *   data: {
 *     developerId: string
 *     companyName: string
 *     overallCompletion: number  // 0-100
 *     sectionCompletion: {
 *       basicInfo: { complete: boolean; percentage: number }
 *       headquarters: { complete: boolean; percentage: number }
 *       salesOffice: { complete: boolean; percentage: number }
 *       contact: { complete: boolean; percentage: number }
 *     }
 *     missingCriticalFields: string[]
 *     missingRecommendedFields: string[]
 *     nextSteps: string[]
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ============================================================================
// TYPES
// ============================================================================

interface SectionCompletion {
  complete: boolean
  percentage: number
}

interface CompletionStatusResponse {
  success: boolean
  data?: {
    developerId: string
    companyName: string
    overallCompletion: number
    sectionCompletion: {
      basicInfo: SectionCompletion
      headquarters: SectionCompletion
      salesOffice: SectionCompletion
      contact: SectionCompletion
    }
    missingCriticalFields: string[]
    missingRecommendedFields: string[]
    nextSteps: string[]
  }
  error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate section completion for basic info
 */
function calculateBasicInfoCompletion(developer: Record<string, unknown>): SectionCompletion {
  const fields = [
    'company_name', 'legal_form', 'krs_number', 'ceidg_number',
    'nip', 'regon', 'phone', 'email', 'fax', 'website'
  ]

  const filledFields = fields.filter(field => {
    const value = developer[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  const percentage = Math.round((filledFields / fields.length) * 100)
  const complete = percentage === 100

  return { complete, percentage }
}

/**
 * Calculate section completion for headquarters address
 */
function calculateHeadquartersCompletion(developer: Record<string, unknown>): SectionCompletion {
  const fields = [
    'headquarters_voivodeship', 'headquarters_county', 'headquarters_municipality',
    'headquarters_city', 'headquarters_street', 'headquarters_building_number',
    'headquarters_apartment_number', 'headquarters_postal_code'
  ]

  const filledFields = fields.filter(field => {
    const value = developer[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  const percentage = Math.round((filledFields / fields.length) * 100)
  const complete = percentage === 100

  return { complete, percentage }
}

/**
 * Calculate section completion for sales office address
 */
function calculateSalesOfficeCompletion(developer: Record<string, unknown>): SectionCompletion {
  const fields = [
    'sales_office_voivodeship', 'sales_office_county', 'sales_office_municipality',
    'sales_office_city', 'sales_office_street', 'sales_office_building_number',
    'sales_office_apartment_number', 'sales_office_postal_code'
  ]

  const filledFields = fields.filter(field => {
    const value = developer[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  const percentage = Math.round((filledFields / fields.length) * 100)
  const complete = percentage === 100

  return { complete, percentage }
}

/**
 * Calculate section completion for contact info
 */
function calculateContactCompletion(developer: Record<string, unknown>): SectionCompletion {
  const fields = ['additional_sales_locations', 'contact_method']

  const filledFields = fields.filter(field => {
    const value = developer[field]
    return value !== null && value !== undefined && value !== ''
  }).length

  const percentage = Math.round((filledFields / fields.length) * 100)
  const complete = percentage === 100

  return { complete, percentage }
}

/**
 * Get missing critical fields (required by Ministry)
 */
function getMissingCriticalFields(developer: Record<string, unknown>): string[] {
  const criticalFields: Record<string, string> = {
    company_name: 'Nazwa dewelopera',
    nip: 'NIP',
    email: 'Email kontaktowy'
  }

  const missing: string[] = []

  Object.entries(criticalFields).forEach(([field, displayName]) => {
    const value = developer[field]
    if (value === null || value === undefined || value === '') {
      missing.push(displayName)
    }
  })

  return missing
}

/**
 * Get missing recommended fields
 */
function getMissingRecommendedFields(developer: Record<string, unknown>): string[] {
  const recommendedFields: Record<string, string> = {
    legal_form: 'Forma prawna',
    phone: 'Telefon',
    regon: 'REGON',
    headquarters_city: 'Miasto siedziby',
    headquarters_street: 'Ulica siedziby',
    headquarters_postal_code: 'Kod pocztowy siedziby',
    sales_office_city: 'Miasto biura sprzedaży',
    contact_method: 'Sposób kontaktu'
  }

  const missing: string[] = []

  Object.entries(recommendedFields).forEach(([field, displayName]) => {
    const value = developer[field]
    if (value === null || value === undefined || value === '') {
      missing.push(displayName)
    }
  })

  return missing
}

/**
 * Generate actionable next steps based on missing data
 */
function generateNextSteps(
  developer: Record<string, unknown>,
  sectionCompletion: {
    basicInfo: SectionCompletion
    headquarters: SectionCompletion
    salesOffice: SectionCompletion
    contact: SectionCompletion
  }
): string[] {
  const steps: string[] = []

  // Critical fields first
  const criticalMissing = getMissingCriticalFields(developer)
  if (criticalMissing.length > 0) {
    steps.push(`🔴 KRYTYCZNE: Uzupełnij wymagane pola: ${criticalMissing.join(', ')}`)
  }

  // Section-specific steps
  if (!sectionCompletion.basicInfo.complete) {
    steps.push(`📋 Uzupełnij podstawowe informacje o firmie (${sectionCompletion.basicInfo.percentage}% gotowe)`)
  }

  if (!sectionCompletion.headquarters.complete) {
    steps.push(`🏢 Dodaj pełny adres siedziby firmy (${sectionCompletion.headquarters.percentage}% gotowe)`)
  }

  if (!sectionCompletion.salesOffice.complete) {
    steps.push(`🏪 Dodaj adres biura sprzedaży (${sectionCompletion.salesOffice.percentage}% gotowe)`)
  }

  if (!sectionCompletion.contact.complete) {
    steps.push(`📞 Uzupełnij informacje kontaktowe (${sectionCompletion.contact.percentage}% gotowe)`)
  }

  // If everything is complete
  if (steps.length === 0) {
    steps.push('✅ Profil kompletny! Wszystkie dane zostały uzupełnione.')
  }

  return steps
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    // GET DEVELOPER ID FROM PARAMS
    // ========================================================================

    const params = await context.params
    const developerId = params.id

    if (!developerId || developerId === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // ========================================================================
    // FETCH DEVELOPER PROFILE
    // ========================================================================

    const { data: developer, error: fetchError } = await supabase
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ COMPLETION STATUS API: Database error:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!developer) {
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

    // ========================================================================
    // CALCULATE COMPLETION STATUS
    // ========================================================================

    const sectionCompletion = {
      basicInfo: calculateBasicInfoCompletion(developer),
      headquarters: calculateHeadquartersCompletion(developer),
      salesOffice: calculateSalesOfficeCompletion(developer),
      contact: calculateContactCompletion(developer)
    }

    // Overall completion (weighted average)
    const overallCompletion = Math.round(
      (sectionCompletion.basicInfo.percentage * 0.4 +
       sectionCompletion.headquarters.percentage * 0.3 +
       sectionCompletion.salesOffice.percentage * 0.2 +
       sectionCompletion.contact.percentage * 0.1)
    )

    const missingCriticalFields = getMissingCriticalFields(developer)
    const missingRecommendedFields = getMissingRecommendedFields(developer)
    const nextSteps = generateNextSteps(developer, sectionCompletion)

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    const response: CompletionStatusResponse = {
      success: true,
      data: {
        developerId: developer.id,
        companyName: developer.company_name || developer.email || 'Nieznana firma',
        overallCompletion,
        sectionCompletion,
        missingCriticalFields,
        missingRecommendedFields,
        nextSteps
      }
    }

    console.log(`✅ COMPLETION STATUS API: Developer ${developer.company_name}, completion: ${overallCompletion}%`)

    return NextResponse.json(response, { status: 200 })

  } catch (error: unknown) {
    console.error('❌ COMPLETION STATUS API: Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
