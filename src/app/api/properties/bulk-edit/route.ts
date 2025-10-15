/**
 * PROPERTIES API - Bulk Edit Missing Fields
 * Task #91.2 - API endpoint for bulk field updates
 *
 * PATCH /api/properties/bulk-edit
 *
 * Allows bulk updating of missing ministerial fields across multiple properties.
 * Validates field names against allowlist for security.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/api-schemas'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ============================================================================
// ALLOWED FIELDS FOR BULK EDITING (Security Allowlist)
// ============================================================================

/**
 * Only these fields can be bulk-edited.
 * This prevents malicious bulk updates to sensitive fields (developer_id, created_at, etc.)
 */
const ALLOWED_BULK_EDIT_FIELDS = [
  // Location fields (most commonly missing)
  'kod_pocztowy',
  'ulica',
  'miejscowosc',
  'numer_nieruchomosci',
  'wojewodztwo',
  'powiat',
  'gmina',

  // Property details
  'liczba_pokoi',
  'kondygnacja',
  'liczba_kondygnacji',
  'rok_budowy',
  'powierzchnia_uzytkowa',

  // Additional info
  'data_pierwszej_oferty',
  'status_sprzedazy',
  'forma_wlasnosci',

  // Descriptive fields
  'opis_nieruchomosci',
  'stan_wykończenia',
] as const

type AllowedField = typeof ALLOWED_BULK_EDIT_FIELDS[number]

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const bulkEditSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(1, 'At least one property ID required'),
  field: z.string().refine(
    (field) => ALLOWED_BULK_EDIT_FIELDS.includes(field as AllowedField),
    {
      message: `Field must be one of: ${ALLOWED_BULK_EDIT_FIELDS.join(', ')}`,
    }
  ),
  value: z.union([z.string(), z.number()]).refine(
    (val) => {
      // Reject empty strings
      if (typeof val === 'string' && val.trim() === '') {
        return false
      }
      return true
    },
    { message: 'Value cannot be empty' }
  ),
})

type BulkEditRequest = z.infer<typeof bulkEditSchema>

// ============================================================================
// FIELD-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate field values based on field type
 */
function validateFieldValue(field: string, value: string | number): { valid: boolean; error?: string } {
  // Postal code format validation (XX-XXX)
  if (field === 'kod_pocztowy') {
    const postalCodeRegex = /^\d{2}-\d{3}$/
    if (typeof value !== 'string' || !postalCodeRegex.test(value)) {
      return {
        valid: false,
        error: 'Kod pocztowy musi być w formacie XX-XXX (np. 84-230)',
      }
    }
  }

  // Numeric fields validation
  const numericFields = ['liczba_pokoi', 'kondygnacja', 'liczba_kondygnacji', 'rok_budowy', 'powierzchnia_uzytkowa']
  if (numericFields.includes(field)) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue) || numValue < 0) {
      return {
        valid: false,
        error: `${field} musi być liczbą dodatnią`,
      }
    }

    // Specific range validations
    if (field === 'liczba_pokoi' && (numValue < 1 || numValue > 20)) {
      return { valid: false, error: 'Liczba pokoi musi być w zakresie 1-20' }
    }

    if (field === 'rok_budowy') {
      const currentYear = new Date().getFullYear()
      if (numValue < 1900 || numValue > currentYear + 10) {
        return {
          valid: false,
          error: `Rok budowy musi być w zakresie 1900-${currentYear + 10}`,
        }
      }
    }
  }

  // Date format validation (YYYY-MM-DD)
  if (field === 'data_pierwszej_oferty') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (typeof value !== 'string' || !dateRegex.test(value)) {
      return {
        valid: false,
        error: 'Data musi być w formacie RRRR-MM-DD (np. 2025-01-15)',
      }
    }

    // Check if date is valid
    const dateObj = new Date(value)
    if (isNaN(dateObj.getTime())) {
      return { valid: false, error: 'Nieprawidłowa data' }
    }

    // Check if date is not in the future
    if (dateObj > new Date()) {
      return { valid: false, error: 'Data nie może być w przyszłości' }
    }
  }

  return { valid: true }
}

// ============================================================================
// PATCH HANDLER
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ========================================================================
    // DEVELOPER PROFILE
    // ========================================================================

    const { data: developer, error: devError } = await supabase
      .from('developers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (devError || !developer) {
      return NextResponse.json(
        { error: 'Developer profile not found' },
        { status: 404 }
      )
    }

    // ========================================================================
    // REQUEST VALIDATION
    // ========================================================================

    const body = await request.json()
    const { propertyIds, field, value } = bulkEditSchema.parse(body) as BulkEditRequest

    console.log(`🔄 BULK EDIT: Updating field "${field}" for ${propertyIds.length} properties`)

    // ========================================================================
    // FIELD-SPECIFIC VALIDATION
    // ========================================================================

    const fieldValidation = validateFieldValue(field, value)
    if (!fieldValidation.valid) {
      return NextResponse.json(
        { error: fieldValidation.error },
        { status: 400 }
      )
    }

    // ========================================================================
    // PREPARE UPDATE OBJECT
    // ========================================================================

    // Dynamically build update object with only the specified field
    const updateData: Record<string, unknown> = {
      [field]: value,
      updated_at: new Date().toISOString(), // Track when property was modified
    }

    // ========================================================================
    // BULK UPDATE PROPERTIES
    // ========================================================================

    const { data: updatedProperties, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .in('id', propertyIds)
      .eq('developer_id', developer.id) // Security: Only update developer's own properties
      .select('id, property_number')

    if (updateError) {
      console.error('❌ BULK EDIT: Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update properties', details: updateError.message },
        { status: 500 }
      )
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================

    const updatedCount = updatedProperties?.length || 0

    console.log(`✅ BULK EDIT: Successfully updated ${updatedCount}/${propertyIds.length} properties`)

    // Log if some properties were not updated (might be owned by different developer)
    if (updatedCount < propertyIds.length) {
      console.warn(
        `⚠️ BULK EDIT: Only ${updatedCount}/${propertyIds.length} properties were updated. ` +
        `Possible ownership mismatch or invalid IDs.`
      )
    }

    return NextResponse.json({
      success: true,
      message: `Zaktualizowano ${updatedCount} ${updatedCount === 1 ? 'nieruchomość' : 'nieruchomości'}`,
      data: {
        updatedCount,
        requestedCount: propertyIds.length,
        field,
        value,
        updatedPropertyIds: updatedProperties?.map((p) => p.id) || [],
      },
    })

  } catch (error: unknown) {
    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    // Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('❌ BULK EDIT: Validation error:', error.errors)
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    // Generic errors
    console.error('❌ BULK EDIT: Unexpected error:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
