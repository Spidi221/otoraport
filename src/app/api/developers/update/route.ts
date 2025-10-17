/**
 * DEVELOPERS UPDATE API - Update Developer Profile
 * Task #101.2 - Allow developers to update their Ministry-required profile information
 *
 * PATCH /api/developers/update
 *
 * Updates developer profile with Ministry Schema 1.13 compliance validation.
 * All 28 developer fields from Ministry specification can be updated.
 *
 * Request Body:
 * {
 *   developerId?: string  // Optional, defaults to authenticated user's developer
 *   updates: {
 *     // Basic info (columns 1-10)
 *     company_name?: string
 *     legal_form?: string
 *     krs_number?: string
 *     ceidg_number?: string
 *     nip?: string
 *     regon?: string
 *     phone?: string
 *     email?: string
 *     fax?: string
 *     website?: string
 *     // Headquarters address (columns 11-18)
 *     headquarters_voivodeship?: string
 *     headquarters_county?: string
 *     headquarters_municipality?: string
 *     headquarters_city?: string
 *     headquarters_street?: string
 *     headquarters_building_number?: string
 *     headquarters_apartment_number?: string
 *     headquarters_postal_code?: string
 *     // Sales office address (columns 19-26)
 *     sales_office_voivodeship?: string
 *     sales_office_county?: string
 *     sales_office_municipality?: string
 *     sales_office_city?: string
 *     sales_office_street?: string
 *     sales_office_building_number?: string
 *     sales_office_apartment_number?: string
 *     sales_office_postal_code?: string
 *     // Additional info (columns 27-28)
 *     additional_sales_locations?: string
 *     contact_method?: string
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   data?: {
 *     developer: DeveloperProfile
 *     validationStatus: {
 *       complianceScore: number
 *       missingFields: string[]
 *       completionPercentage: number
 *     }
 *   }
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { DeveloperInfoSchema } from '@/lib/ministry-validation'

export const dynamic = 'force-dynamic'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Request body schema for developer updates
 * Allows partial updates of any developer field
 */
const DeveloperUpdateRequestSchema = z.object({
  developerId: z.string().uuid().optional(),
  updates: z.object({
    // Basic company info (columns 1-10)
    company_name: z.string().min(1).max(255).optional(),
    legal_form: z.string().max(100).optional(),
    krs_number: z.string().max(50).optional(),
    ceidg_number: z.string().max(50).optional(),
    nip: z.string().regex(/^\d{10}$/, 'NIP musi składać się z 10 cyfr').optional(),
    regon: z.string().regex(/^\d{9}$|^\d{14}$/, 'REGON musi składać się z 9 lub 14 cyfr').optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email('Nieprawidłowy format email').optional(),
    fax: z.string().max(20).optional(),
    website: z.string().url('Nieprawidłowy format URL').optional().or(z.literal('')),

    // Headquarters address (columns 11-18)
    headquarters_voivodeship: z.string().max(50).optional(),
    headquarters_county: z.string().max(100).optional(),
    headquarters_municipality: z.string().max(100).optional(),
    headquarters_city: z.string().max(100).optional(),
    headquarters_street: z.string().max(255).optional(),
    headquarters_building_number: z.string().max(20).optional(),
    headquarters_apartment_number: z.string().max(20).optional(),
    headquarters_postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX').optional(),

    // Sales office address (columns 19-26)
    sales_office_voivodeship: z.string().max(50).optional(),
    sales_office_county: z.string().max(100).optional(),
    sales_office_municipality: z.string().max(100).optional(),
    sales_office_city: z.string().max(100).optional(),
    sales_office_street: z.string().max(255).optional(),
    sales_office_building_number: z.string().max(20).optional(),
    sales_office_apartment_number: z.string().max(20).optional(),
    sales_office_postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX').optional(),

    // Additional info (columns 27-28)
    additional_sales_locations: z.string().optional(),
    contact_method: z.string().max(255).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Brak pól do aktualizacji' }
  ),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate developer profile completion percentage
 */
function calculateCompletionPercentage(developer: Record<string, unknown>): {
  percentage: number
  missingFields: string[]
  complianceScore: number
} {
  // All 28 Ministry fields
  const ministryFields = [
    'company_name', 'legal_form', 'krs_number', 'ceidg_number', 'nip', 'regon',
    'phone', 'email', 'fax', 'website',
    'headquarters_voivodeship', 'headquarters_county', 'headquarters_municipality',
    'headquarters_city', 'headquarters_street', 'headquarters_building_number',
    'headquarters_apartment_number', 'headquarters_postal_code',
    'sales_office_voivodeship', 'sales_office_county', 'sales_office_municipality',
    'sales_office_city', 'sales_office_street', 'sales_office_building_number',
    'sales_office_apartment_number', 'sales_office_postal_code',
    'additional_sales_locations', 'contact_method'
  ]

  // Required fields (cannot be null/empty)
  const requiredFields = ['company_name', 'nip', 'email']

  const missingFields: string[] = []
  let filledCount = 0

  ministryFields.forEach((field) => {
    const value = developer[field]
    const isFilled = value !== null && value !== undefined && value !== ''

    if (isFilled) {
      filledCount++
    } else if (requiredFields.includes(field)) {
      missingFields.push(field)
    }
  })

  const percentage = Math.round((filledCount / ministryFields.length) * 100)

  // Compliance score: 100% if all required fields present, otherwise proportional
  const complianceScore = missingFields.length === 0
    ? 100
    : Math.max(0, 100 - (missingFields.length * 20))

  return { percentage, missingFields, complianceScore }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function PATCH(request: NextRequest) {
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
    // REQUEST VALIDATION
    // ========================================================================

    let body: z.infer<typeof DeveloperUpdateRequestSchema>

    try {
      body = await request.json()
      const validated = DeveloperUpdateRequestSchema.parse(body)
      body = validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }

    // ========================================================================
    // DEVELOPER IDENTIFICATION
    // ========================================================================

    let developerId: string

    if (body.developerId) {
      // Verify user owns this developer profile
      const { data: developer, error: devError } = await supabase
        .from('developers')
        .select('id, user_id')
        .eq('id', body.developerId)
        .maybeSingle()

      if (devError) {
        console.error('❌ DEVELOPER UPDATE API: Database error:', devError)
        return NextResponse.json(
          { success: false, error: devError.message },
          { status: 500 }
        )
      }

      if (!developer) {
        return NextResponse.json(
          { success: false, error: 'Developer not found' },
          { status: 404 }
        )
      }

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
        .maybeSingle()

      if (devError) {
        console.error('❌ DEVELOPER UPDATE API: Database error:', devError)
        return NextResponse.json(
          { success: false, error: devError.message },
          { status: 500 }
        )
      }

      if (!developer) {
        return NextResponse.json(
          { success: false, error: 'Developer profile not found' },
          { status: 404 }
        )
      }

      developerId = developer.id
    }

    // ========================================================================
    // UPDATE DEVELOPER PROFILE
    // ========================================================================

    const { data: updatedDeveloper, error: updateError } = await supabase
      .from('developers')
      .update(body.updates)
      .eq('id', developerId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ DEVELOPER UPDATE API: Update failed:', updateError)

      // Handle specific database errors
      if (updateError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Duplicate value - this data already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // ========================================================================
    // CALCULATE VALIDATION STATUS
    // ========================================================================

    const validationStatus = calculateCompletionPercentage(updatedDeveloper)

    console.log(`✅ DEVELOPER UPDATE API: Profile updated, completion: ${validationStatus.percentage}%`)

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          developer: updatedDeveloper,
          validationStatus
        }
      },
      { status: 200 }
    )

  } catch (error: unknown) {
    console.error('❌ DEVELOPER UPDATE API: Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
