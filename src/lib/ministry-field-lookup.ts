/**
 * TASK #88.1: Universal Ministry Field Value Lookup with 3-Tier Priority System
 *
 * This module provides a unified field value retrieval system for ministerial CSV exports.
 * Implements the 3-tier data priority system:
 *   1. manual_overrides (user edits that persist across CSV re-uploads)
 *   2. raw_csv_data (original uploaded CSV data - immutable)
 *   3. properties/developers table (database defaults)
 *   4. defaultValue (fallback)
 *
 * @module ministry-field-lookup
 */

import { COLUMN_PATTERNS } from '@/lib/smart-csv-parser'
import type { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

interface PropertyWithRawData extends Property {
  raw_csv_data: Array<{
    raw_data: Record<string, unknown>
    is_latest: boolean
  }>
}

/**
 * Check if a value is valid (not null, undefined, or empty string)
 */
function isValidValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
}

/**
 * Normalize string for column name matching (same as SmartCSVParser)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Find value in raw_csv_data by trying COLUMN_PATTERNS variations
 * Implements fuzzy matching for short CSV column names
 */
function findInRawDataByPatterns(
  rawData: Record<string, unknown>,
  internalFieldName: string
): unknown {
  const patterns = COLUMN_PATTERNS[internalFieldName as keyof typeof COLUMN_PATTERNS]
  if (!patterns) return undefined

  // Try exact match first (case-sensitive)
  for (const pattern of patterns) {
    if (isValidValue(rawData[pattern])) {
      return rawData[pattern]
    }
  }

  // Try normalized match (case-insensitive, diacritic-insensitive)
  const normalizedPatterns = patterns.map(p => normalizeString(p))
  const rawDataKeys = Object.keys(rawData)

  for (let i = 0; i < patterns.length; i++) {
    const normalizedPattern = normalizedPatterns[i]

    for (const key of rawDataKeys) {
      if (normalizeString(key) === normalizedPattern) {
        const rawValue = rawData[key]
        if (isValidValue(rawValue)) {
          return rawValue
        }
      }
    }
  }

  return undefined
}

/**
 * TASK #88.1: Universal Ministry Field Value Lookup
 *
 * Gets field value with 3-tier priority system:
 *   1. manual_overrides[ministryFieldName or internalFieldName]
 *   2. raw_csv_data[ministryFieldName] (exact match or COLUMN_PATTERNS fuzzy match)
 *   3. developer[internalFieldName] OR property[internalFieldName]
 *   4. defaultValue
 *
 * @param property - Property object (use properties[0] for developer fields)
 * @param ministryFieldName - Full ministry CSV column name (e.g., "Nazwa dewelopera")
 * @param internalFieldName - Internal database field name (e.g., "company_name")
 * @param developer - Developer object (optional, for developer-level fields)
 * @param defaultValue - Fallback value if all tiers fail
 * @returns Field value as string
 *
 * @example
 * // Developer field (columns 1-28) - use first property
 * getMinistryFieldValue(properties[0], 'Nazwa dewelopera', 'company_name', developer)
 *
 * @example
 * // Property field (columns 29-58) - use specific property
 * getMinistryFieldValue(property, 'Województwo lokalizacji...', 'wojewodztwo')
 */
export function getMinistryFieldValue(
  property: PropertyWithRawData,
  ministryFieldName: string = '',
  internalFieldName: string = '',
  developer?: Developer,
  defaultValue: string = ''
): string {
  // ==========================================
  // TIER 1: manual_overrides (highest priority)
  // ==========================================
  // Check both ministry field name and internal field name
  // Property.manual_overrides is Json | null from database.ts, cast to Record for safe access
  const manualOverrides = property.manual_overrides as Record<string, unknown> | null | undefined

  if (manualOverrides && typeof manualOverrides === 'object') {
    // Try ministry field name first (exact match)
    if (ministryFieldName && isValidValue(manualOverrides[ministryFieldName])) {
      return String(manualOverrides[ministryFieldName])
    }

    // Try internal field name as fallback
    if (internalFieldName && isValidValue(manualOverrides[internalFieldName])) {
      return String(manualOverrides[internalFieldName])
    }
  }

  // ==========================================
  // TIER 2: raw_csv_data (uploaded CSV)
  // ==========================================
  const rawData = property.raw_csv_data?.[0]?.raw_data || {}

  // Try exact match with ministry field name (case-sensitive)
  if (ministryFieldName && isValidValue(rawData[ministryFieldName])) {
    return String(rawData[ministryFieldName])
  }

  // Try normalized match with ministry field name (case-insensitive, diacritic-insensitive)
  if (ministryFieldName) {
    const normalizedMinistryName = normalizeString(ministryFieldName)
    const rawDataKeys = Object.keys(rawData)

    for (const key of rawDataKeys) {
      if (normalizeString(key) === normalizedMinistryName) {
        const rawValue = rawData[key]
        if (isValidValue(rawValue)) {
          return String(rawValue)
        }
      }
    }
  }

  // Try COLUMN_PATTERNS fuzzy matching (for short CSV column names)
  if (internalFieldName) {
    const patternValue = findInRawDataByPatterns(rawData, internalFieldName)
    if (isValidValue(patternValue)) {
      return String(patternValue)
    }
  }

  // ==========================================
  // TIER 3: Database tables (properties or developers)
  // ==========================================
  // If developer is provided, check developer table (for developer-level fields)
  if (developer && internalFieldName) {
    const devValue = developer[internalFieldName as keyof Developer]
    if (isValidValue(devValue)) {
      return String(devValue)
    }
  }

  // Otherwise check property table (for property-level fields)
  if (internalFieldName && !developer) {
    const propValue = property[internalFieldName as keyof Property]
    if (isValidValue(propValue)) {
      return String(propValue)
    }
  }

  // ==========================================
  // TIER 4: Default value (fallback)
  // ==========================================
  return defaultValue
}
