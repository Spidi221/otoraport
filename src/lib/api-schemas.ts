/**
 * Zod schemas for API request/response validation
 * Task 14.2 - Strong types for API routes
 */

import { z } from 'zod'

// ===================================
// Upload API Schemas
// ===================================

/**
 * Schema for parsed property data from CSV/Excel
 */
export const ParsedPropertySchema = z.object({
  // Location
  wojewodztwo: z.string().optional(),
  powiat: z.string().optional(),
  gmina: z.string().optional(),
  miejscowosc: z.string().optional().nullable(),
  ulica: z.string().optional().nullable(),
  numer_nieruchomosci: z.string().optional().nullable(),
  kod_pocztowy: z.string().optional().nullable(),

  // Basic info
  property_type: z.string().optional(),
  property_number: z.string().optional(),
  apartment_number: z.string().optional(),
  area: z.union([z.string(), z.number()]).optional().nullable(),
  rooms: z.union([z.string(), z.number()]).optional().nullable(),
  floor: z.union([z.string(), z.number()]).optional().nullable(),
  liczba_pokoi: z.union([z.string(), z.number()]).optional().nullable(), // Task #90.1: For ministry validation
  kondygnacja: z.union([z.string(), z.number()]).optional().nullable(), // Task #90.1: For ministry validation
  construction_year: z.union([z.string(), z.number()]).optional().nullable(), // Task #90.1: For ministry validation

  // Prices
  price_per_m2: z.union([z.string(), z.number()]).optional().nullable(),
  base_price: z.union([z.string(), z.number()]).optional().nullable(),
  total_price: z.union([z.string(), z.number()]).optional().nullable(),
  final_price: z.union([z.string(), z.number()]).optional().nullable(),
  price_valid_from: z.string().optional().nullable(),

  // Parking
  parking_type: z.string().optional().nullable(),
  parking_designation: z.string().optional().nullable(),
  parking_price: z.union([z.string(), z.number()]).optional().nullable(),
  parking_date: z.string().optional().nullable(),

  // Storage
  storage_type: z.string().optional().nullable(),
  storage_designation: z.string().optional().nullable(),
  storage_price: z.union([z.string(), z.number()]).optional().nullable(),
  storage_date: z.string().optional().nullable(),

  // Necessary rights
  necessary_rights_type: z.string().optional().nullable(),
  necessary_rights_description: z.string().optional().nullable(),
  necessary_rights_price: z.union([z.string(), z.number()]).optional().nullable(),
  necessary_rights_date: z.string().optional().nullable(),

  // Other
  other_services_type: z.string().optional().nullable(),
  other_services_price: z.union([z.string(), z.number()]).optional().nullable(),
  prospectus_url: z.string().optional().nullable(),
  status: z.string().optional().nullable(),

  // Project info (for upload-parsed)
  project_name: z.string().optional(),

  // Raw CSV data (Task #90.1: For ministry validation service)
  raw_data: z.record(z.string(), z.unknown()).optional(),
}).passthrough() // Allow additional fields from CSV

export type ParsedProperty = z.infer<typeof ParsedPropertySchema>

/**
 * Schema for upload-parsed API request body
 */
export const UploadParsedRequestSchema = z.object({
  properties: z.array(ParsedPropertySchema),
  validRecords: z.number(),
  fileName: z.string().optional(),
})

export type UploadParsedRequest = z.infer<typeof UploadParsedRequestSchema>

/**
 * Schema for upload API response
 */
export const UploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    fileName: z.string(),
    recordsCount: z.number(),
    validRecords: z.number(),
    savedToDatabase: z.boolean(),
    preview: z.array(z.unknown()).nullable().optional(),
  }).optional(),
})

export type UploadResponse = z.infer<typeof UploadResponseSchema>

// ===================================
// Properties API Schemas
// ===================================

/**
 * Schema for properties list query params
 */
export const PropertiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type PropertiesQuery = z.infer<typeof PropertiesQuerySchema>

/**
 * Schema for property delete request
 */
export const PropertyDeleteSchema = z.object({
  id: z.string().uuid(),
})

export type PropertyDelete = z.infer<typeof PropertyDeleteSchema>

// ===================================
// Stripe API Schemas
// ===================================

/**
 * Schema for checkout session response
 */
export const CheckoutSessionResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string().url().nullable(),
})

export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>

// ===================================
// Error Response Schema
// ===================================

/**
 * Standard error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// ===================================
// Validation API Schemas (Task #90.1)
// ===================================

/**
 * Schema for validation missing-fields query params
 */
export const ValidationMissingFieldsQuerySchema = z.object({
  developerId: z.string().uuid().optional(), // If missing, use authenticated user's developer
})

export type ValidationMissingFieldsQuery = z.infer<typeof ValidationMissingFieldsQuerySchema>

/**
 * Schema for field validation error from ministry-validation service
 */
export const FieldValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  value: z.union([z.string(), z.number()]).optional(),
})

export type FieldValidationError = z.infer<typeof FieldValidationErrorSchema>

/**
 * Schema for property validation result in missing-fields response
 */
export const PropertyValidationItemSchema = z.object({
  id: z.string().uuid(),
  propertyNumber: z.string(),
  address: z.string(),
  status: z.enum(['valid', 'invalid']),
  errors: z.array(FieldValidationErrorSchema),
  warnings: z.array(FieldValidationErrorSchema),
  missingRequired: z.array(z.string()),
  missingRecommended: z.array(z.string()),
  invalidFormats: z.array(z.string()),
})

export type PropertyValidationItem = z.infer<typeof PropertyValidationItemSchema>

/**
 * Schema for missing field summary entry
 */
export const MissingFieldSummaryEntrySchema = z.object({
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  severity: z.enum(['critical', 'warning', 'info']),
  fieldLabel: z.string(),
})

export type MissingFieldSummaryEntry = z.infer<typeof MissingFieldSummaryEntrySchema>

/**
 * Schema for validation missing-fields response
 */
export const ValidationMissingFieldsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    summary: z.object({
      totalProperties: z.number().int().nonnegative(),
      propertiesWithIssues: z.number().int().nonnegative(),
      propertiesValid: z.number().int().nonnegative(),
      complianceScore: z.number().int().min(0).max(100), // 0-100%
    }),
    missingFieldsSummary: z.record(z.string(), MissingFieldSummaryEntrySchema),
    properties: z.array(PropertyValidationItemSchema),
  }),
})

export type ValidationMissingFieldsResponse = z.infer<typeof ValidationMissingFieldsResponseSchema>

// ===================================
// Helper Functions
// ===================================

/**
 * Parse decimal value from string or number (CSV data)
 * Handles Polish Excel exports with 'X' for null values
 */
export function parseDecimal(value: unknown): number | null {
  if (!value || value === 'X' || value === 'x') return null
  const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''))
  return isNaN(parsed) ? null : parsed
}

/**
 * Parse date string safely
 */
export function parseDate(value: unknown): string | null {
  if (!value || value === 'X' || value === 'x') return null
  return String(value)
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}
