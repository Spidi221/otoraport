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
