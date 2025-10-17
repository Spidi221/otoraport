/**
 * Ministry Field Validation Service (Task #89 & #99)
 *
 * Comprehensive validation service for Polish ministry compliance
 * Based on: ustawa z dnia 21 maja 2025 r. o jawności cen mieszkań
 * Ministry Schema: 1.13 (59 columns)
 *
 * Features:
 * - Required field validation (8 fields)
 * - Conditionally required fields (nr_krs vs nr_ceidg based on legal form)
 * - Format validation (postal codes, NIP, REGON, email, dates)
 * - Business logic validation (price consistency, area ranges)
 * - Severity categorization (critical/recommended/optional)
 * - Sectioned validation with Zod v4.x (Task #99.2)
 * - Detailed missing field feedback (Task #99.4)
 */

import { z } from 'zod'
import { ParsedProperty } from './api-schemas'

// ============================================================================
// TYPES & INTERFACES (Task #99.3 & #99.4)
// ============================================================================

/**
 * Detailed field validation error with category and section
 */
export interface FieldValidationError {
  field: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  value?: string | number
  category?: 'required' | 'recommended' | 'developer'
  section?: 'developer' | 'location' | 'pricing' | 'technical'
}

/**
 * Section breakdown for compliance reporting
 */
export interface SectionBreakdown {
  total: number
  valid: number
  percentage: number
}

/**
 * Detailed missing field information (Task #99.4)
 */
export interface MissingFieldInfo {
  fieldName: string
  displayName: string
  category: 'required' | 'recommended' | 'developer'
  section: 'developer' | 'location' | 'pricing' | 'technical'
  severity: 'critical' | 'warning'
}

/**
 * Property validation result with section breakdown
 */
export interface PropertyValidationResult {
  valid: boolean
  propertyNumber: string
  errors: FieldValidationError[]
  warnings: FieldValidationError[]
  missingRequired: string[]
  missingRecommended: string[]
  invalidFormats: string[]
  // NEW: Section breakdown (Task #99.3)
  sectionBreakdown?: {
    developer: SectionBreakdown
    location: SectionBreakdown
    pricing: SectionBreakdown
    technical: SectionBreakdown
  }
  // NEW: Detailed missing fields (Task #99.4)
  missingFieldsDetailed?: MissingFieldInfo[]
}

/**
 * Batch validation result with aggregated section breakdown
 */
export interface BatchValidationResult {
  valid: boolean
  totalProperties: number
  validProperties: number
  invalidProperties: number
  complianceScore: number // 0-100%
  globalErrors: string[]
  globalWarnings: string[]
  propertyResults: PropertyValidationResult[]
  // NEW: Aggregated section breakdown (Task #99.3)
  sectionBreakdown?: {
    developer: SectionBreakdown
    location: SectionBreakdown
    pricing: SectionBreakdown
    technical: SectionBreakdown
  }
  // NEW: Aggregated missing fields summary (Task #99.4)
  missingFieldsSummary?: {
    developer: string[]
    location: string[]
    pricing: string[]
    technical: string[]
  }
}

// ============================================================================
// CONSTANTS & FIELD DEFINITIONS (Task #99.1)
// ============================================================================

/**
 * Developer information fields (Ministry columns 1-28)
 * All developer data required by Ministry Schema 1.13
 */
export const DEVELOPER_FIELDS = {
  // Basic company info (columns 1-10)
  nazwa_dewelopera: 'Nazwa dewelopera',
  forma_prawna: 'Forma prawna dewelopera',
  nr_krs: 'Nr KRS',
  nr_ceidg: 'Nr wpisu do CEiDG',
  nip: 'Nr NIP',
  regon: 'Nr REGON',
  telefon: 'Nr telefonu',
  email: 'Adres poczty elektronicznej',
  fax: 'Nr faxu',
  strona_www: 'Adres strony internetowej dewelopera',

  // Headquarters address (columns 11-18)
  siedziba_wojewodztwo: 'Województwo adresu siedziby',
  siedziba_powiat: 'Powiat adresu siedziby',
  siedziba_gmina: 'Gmina adresu siedziby',
  siedziba_miejscowosc: 'Miejscowość adresu siedziby',
  siedziba_ulica: 'Ulica adresu siedziby',
  siedziba_numer_budynku: 'Nr nieruchomości adresu siedziby',
  siedziba_numer_lokalu: 'Nr lokalu adresu siedziby',
  siedziba_kod_pocztowy: 'Kod pocztowy adresu siedziby',

  // Sales office address (columns 19-26)
  biuro_wojewodztwo: 'Województwo adresu lokalu sprzedaży',
  biuro_powiat: 'Powiat adresu lokalu sprzedaży',
  biuro_gmina: 'Gmina adresu lokalu sprzedaży',
  biuro_miejscowosc: 'Miejscowość adresu lokalu sprzedaży',
  biuro_ulica: 'Ulica adresu lokalu sprzedaży',
  biuro_numer_budynku: 'Nr nieruchomości adresu lokalu sprzedaży',
  biuro_numer_lokalu: 'Nr lokalu adresu lokalu sprzedaży',
  biuro_kod_pocztowy: 'Kod pocztowy adresu lokalu sprzedaży',

  // Additional info (columns 27-28)
  dodatkowe_lokalizacje: 'Dodatkowe lokalizacje sprzedaży',
  sposob_kontaktu: 'Sposób kontaktu nabywcy z deweloperem'
} as const

/**
 * Required fields for ministry compliance (Schema 1.13)
 * These are CRITICAL fields that MUST be present
 */
export const REQUIRED_FIELDS = {
  // Location (required by ministry)
  wojewodztwo: 'Województwo lokalizacji',
  powiat: 'Powiat lokalizacji',
  gmina: 'Gmina lokalizacji',
  miejscowosc: 'Miejscowość lokalizacji',
  kod_pocztowy: 'Kod pocztowy',

  // Pricing (required)
  price_per_m2: 'Cena za m²',
  total_price: 'Cena całkowita',
  area: 'Powierzchnia użytkowa',

  // Property identification
  property_number: 'Nr lokalu/domu',

  // Developer information (required by ministry)
  developer_name: 'Nazwa dewelopera',
  nip: 'Nr NIP dewelopera'
} as const

/**
 * Recommended fields (highly recommended by ministry)
 */
export const RECOMMENDED_FIELDS = {
  ulica: 'Ulica',
  numer_nieruchomosci: 'Numer nieruchomości',
  data_pierwszej_oferty: 'Data pierwszej oferty',
  property_type: 'Rodzaj nieruchomości',
  liczba_pokoi: 'Liczba pokoi',
  kondygnacja: 'Kondygnacja',
  base_price: 'Cena bazowa',
  final_price: 'Cena finalna',
  construction_year: 'Rok budowy'
} as const

/**
 * Conditionally required fields
 */
export const CONDITIONAL_FIELDS = {
  // Required for Sp. z o.o., S.A., S.K.A., etc.
  nr_krs: 'Nr KRS',

  // Required for sole proprietorships (działalność gospodarcza)
  nr_ceidg: 'Nr CEIDG'
} as const

/**
 * Valid Polish voivodeships
 */
const VALID_VOIVODESHIPS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie'
]

/**
 * Legal forms requiring KRS number
 */
const KRS_REQUIRED_LEGAL_FORMS = [
  'spółka z ograniczoną odpowiedzialnością',
  'sp. z o.o.',
  'spółka akcyjna',
  's.a.',
  'spółka komandytowa',
  's.k.',
  'spółka komandytowo-akcyjna',
  's.k.a.',
  'spółka jawna',
  's.j.'
]

// ============================================================================
// ZOD VALIDATION SCHEMAS (Task #99.2)
// ============================================================================

/**
 * Zod schema for developer information (columns 1-28)
 */
export const DeveloperInfoSchema = z.object({
  // Basic company info (required)
  nazwa_dewelopera: z.string().min(1, 'Nazwa dewelopera jest wymagana'),
  forma_prawna: z.string().optional(),
  nr_krs: z.string().optional(),
  nr_ceidg: z.string().optional(),
  nip: z.string().regex(/^\d{10}$/, 'NIP musi składać się z 10 cyfr'),
  regon: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email('Nieprawidłowy format email').optional(),
  fax: z.string().optional(),
  strona_www: z.string().url('Nieprawidłowy format URL').optional(),

  // Headquarters address
  siedziba_wojewodztwo: z.string().optional(),
  siedziba_powiat: z.string().optional(),
  siedziba_gmina: z.string().optional(),
  siedziba_miejscowosc: z.string().optional(),
  siedziba_ulica: z.string().optional(),
  siedziba_numer_budynku: z.string().optional(),
  siedziba_numer_lokalu: z.string().optional(),
  siedziba_kod_pocztowy: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX').optional(),

  // Sales office address
  biuro_wojewodztwo: z.string().optional(),
  biuro_powiat: z.string().optional(),
  biuro_gmina: z.string().optional(),
  biuro_miejscowosc: z.string().optional(),
  biuro_ulica: z.string().optional(),
  biuro_numer_budynku: z.string().optional(),
  biuro_numer_lokalu: z.string().optional(),
  biuro_kod_pocztowy: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX').optional(),

  // Additional info
  dodatkowe_lokalizacje: z.string().optional(),
  sposob_kontaktu: z.string().optional()
})

/**
 * Zod schema for location information (columns 29-35)
 */
export const LocationSchema = z.object({
  wojewodztwo: z.string().min(1, 'Województwo jest wymagane'),
  powiat: z.string().min(1, 'Powiat jest wymagany'),
  gmina: z.string().min(1, 'Gmina jest wymagana'),
  miejscowosc: z.string().min(1, 'Miejscowość jest wymagana'),
  ulica: z.string().optional(),
  numer: z.string().optional(),
  kod_pocztowy: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX')
})

/**
 * Zod schema for pricing information (columns 39-43)
 */
export const PricingSchema = z.object({
  price_per_m2: z.number().positive('Cena za m² musi być > 0'),
  total_price: z.number().positive('Cena całkowita musi być > 0'),
  final_price: z.number().positive('Cena finalna musi być > 0').optional()
}).refine(
  (data) => {
    // Price consistency check: total_price ≈ price_per_m2 × area
    // (area will be validated separately)
    return true // Will be validated in business logic
  },
  { message: 'Niezgodność cen' }
)

/**
 * Zod schema for technical property details
 */
export const TechnicalSchema = z.object({
  property_number: z.string().min(1, 'Nr lokalu/domu jest wymagany'),
  property_type: z.string().optional(),
  area: z.number().positive('Powierzchnia musi być > 0').min(10, 'Powierzchnia zbyt mała').max(500, 'Powierzchnia zbyt duża'),
  liczba_pokoi: z.number().int().min(1).max(20).optional(),
  kondygnacja: z.number().int().optional(),
  construction_year: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
  energy_class: z.string().optional(),
  data_pierwszej_oferty: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi być w formacie RRRR-MM-DD').optional()
})

// ============================================================================
// FORMAT VALIDATION FUNCTIONS (Task #89.2)
// ============================================================================

/**
 * Validate Polish NIP (Tax ID) format
 * Valid format: 10 digits (can have dashes/spaces)
 */
export function validateNIP(nip: string | undefined | null): { valid: boolean; error?: string } {
  if (!nip) {
    return { valid: false, error: 'NIP jest wymagany' }
  }

  // Remove dashes and spaces
  const cleanNIP = nip.replace(/[-\s]/g, '')

  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cleanNIP)) {
    return { valid: false, error: 'NIP musi składać się z 10 cyfr' }
  }

  // Checksum validation (NIP checksum algorithm)
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  const digits = cleanNIP.split('').map(Number)
  const sum = weights.reduce((acc, weight, i) => acc + weight * digits[i], 0)
  const checksum = sum % 11
  const lastDigit = digits[9]

  if (checksum !== lastDigit) {
    return { valid: false, error: 'Nieprawidłowa suma kontrolna NIP' }
  }

  return { valid: true }
}

/**
 * Validate Polish REGON format
 * Valid format: 9 or 14 digits
 */
export function validateREGON(regon: string | undefined | null): { valid: boolean; error?: string } {
  if (!regon) {
    return { valid: true } // REGON is optional
  }

  const cleanREGON = regon.replace(/[-\s]/g, '')

  if (!/^(\d{9}|\d{14})$/.test(cleanREGON)) {
    return { valid: false, error: 'REGON musi składać się z 9 lub 14 cyfr' }
  }

  return { valid: true }
}

/**
 * Validate Polish postal code format
 * Valid format: XX-XXX (e.g., 00-001)
 */
export function validatePostalCode(code: string | undefined | null): { valid: boolean; error?: string } {
  if (!code) {
    return { valid: false, error: 'Kod pocztowy jest wymagany' }
  }

  if (!/^\d{2}-\d{3}$/.test(code)) {
    return { valid: false, error: 'Kod pocztowy musi być w formacie XX-XXX (np. 00-001)' }
  }

  return { valid: true }
}

/**
 * Validate email format
 */
export function validateEmail(email: string | undefined | null): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: true } // Email is optional for properties, required for developer
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Nieprawidłowy format adresu email' }
  }

  return { valid: true }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string | undefined | null): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: true } // Dates are optional
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Data musi być w formacie RRRR-MM-DD' }
  }

  // Check if date is valid
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Nieprawidłowa data' }
  }

  return { valid: true }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string | undefined | null): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: true } // Phone is optional
  }

  // Accept various Polish phone formats
  const phoneRegex = /^(\+48)?\s?\d{3}\s?\d{3}\s?\d{3}$/
  if (!phoneRegex.test(phone.replace(/-/g, ' '))) {
    return { valid: false, error: 'Nieprawidłowy format numeru telefonu (oczekiwany: +48 XXX XXX XXX)' }
  }

  return { valid: true }
}

/**
 * Validate KRS number format
 */
export function validateKRS(krs: string | undefined | null): { valid: boolean; error?: string } {
  if (!krs) {
    return { valid: true } // Will be validated conditionally
  }

  const cleanKRS = krs.replace(/[-\s]/g, '')

  if (!/^\d{10}$/.test(cleanKRS)) {
    return { valid: false, error: 'Nr KRS musi składać się z 10 cyfr' }
  }

  return { valid: true }
}

/**
 * Validate CEIDG number format
 */
export function validateCEIDG(ceidg: string | undefined | null): { valid: boolean; error?: string } {
  if (!ceidg) {
    return { valid: true } // Will be validated conditionally
  }

  // CEIDG format varies - basic validation
  if (ceidg.length < 5 || ceidg.length > 20) {
    return { valid: false, error: 'Nieprawidłowy format numeru CEIDG' }
  }

  return { valid: true }
}

// ============================================================================
// BUSINESS LOGIC VALIDATION (Task #89.3)
// ============================================================================

/**
 * Validate price consistency (price_per_m2 × area ≈ total_price)
 */
export function validatePriceConsistency(
  pricePerM2: number | undefined,
  area: number | undefined,
  totalPrice: number | undefined
): { valid: boolean; warning?: string } {
  if (!pricePerM2 || !area || !totalPrice) {
    return { valid: true } // Can't validate if data missing
  }

  const calculatedPrice = Math.round(pricePerM2 * area)
  const priceDiff = Math.abs(calculatedPrice - totalPrice)
  const percentDiff = (priceDiff / totalPrice) * 100

  if (percentDiff > 5) {
    return {
      valid: false,
      warning: `Niezgodność cen: cena całkowita (${totalPrice} zł) różni się od iloczynu ceny za m² × powierzchnia (${calculatedPrice} zł, różnica: ${percentDiff.toFixed(1)}%)`
    }
  }

  return { valid: true }
}

/**
 * Validate area range
 */
export function validateAreaRange(area: number | undefined): { valid: boolean; warning?: string } {
  if (!area) {
    return { valid: true }
  }

  if (area < 10) {
    return { valid: false, warning: `Bardzo mała powierzchnia: ${area} m² (może być błąd?)` }
  }

  if (area > 500) {
    return { valid: false, warning: `Bardzo duża powierzchnia: ${area} m² (może być błąd?)` }
  }

  return { valid: true }
}

/**
 * Validate price range
 */
export function validatePriceRange(pricePerM2: number | undefined): { valid: boolean; warning?: string } {
  if (!pricePerM2) {
    return { valid: true }
  }

  if (pricePerM2 < 1000) {
    return { valid: false, warning: `Niska cena za m²: ${pricePerM2} zł (może być błąd?)` }
  }

  if (pricePerM2 > 50000) {
    return { valid: false, warning: `Bardzo wysoka cena za m²: ${pricePerM2} zł (może być błąd?)` }
  }

  return { valid: true }
}

/**
 * Validate rooms count
 */
export function validateRoomsCount(rooms: number | undefined): { valid: boolean; warning?: string } {
  if (rooms === undefined || rooms === null) {
    return { valid: true }
  }

  if (rooms < 1 || rooms > 20) {
    return { valid: false, warning: `Nieprawidłowa liczba pokoi: ${rooms} (powinna być 1-20)` }
  }

  return { valid: true }
}

/**
 * Validate construction year
 */
export function validateConstructionYear(year: number | undefined): { valid: boolean; warning?: string } {
  if (!year) {
    return { valid: true }
  }

  const currentYear = new Date().getFullYear()

  if (year < 1900 || year > currentYear + 5) {
    return { valid: false, warning: `Nieprawidłowy rok budowy: ${year} (powinien być ${1900}-${currentYear + 5})` }
  }

  return { valid: true }
}

/**
 * Validate date is not in future
 */
export function validateDateNotFuture(date: string | undefined, fieldName: string): { valid: boolean; warning?: string } {
  if (!date) {
    return { valid: true }
  }

  const dateObj = new Date(date)
  const today = new Date()

  if (dateObj > today) {
    return { valid: false, warning: `${fieldName} jest w przyszłości: ${date}` }
  }

  return { valid: true }
}

// ============================================================================
// SECTION BREAKDOWN HELPERS (Task #99.3)
// ============================================================================

/**
 * Calculate section breakdown for a property
 */
function calculateSectionBreakdown(property: ParsedProperty): {
  developer: SectionBreakdown
  location: SectionBreakdown
  pricing: SectionBreakdown
  technical: SectionBreakdown
} {
  // Developer section (28 fields)
  const developerFields = Object.keys(DEVELOPER_FIELDS)
  const developerValid = developerFields.filter(field => {
    const rawDataKey = DEVELOPER_FIELDS[field as keyof typeof DEVELOPER_FIELDS]
    const value = property.raw_data?.[rawDataKey]
    return value !== undefined && value !== null && value !== ''
  }).length

  // Location section (7 fields)
  const locationFields = ['wojewodztwo', 'powiat', 'gmina', 'miejscowosc', 'ulica', 'numer', 'kod_pocztowy']
  const locationValid = locationFields.filter(field => {
    if (field === 'wojewodztwo') return !!property.raw_data?.['Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'powiat') return !!property.raw_data?.['Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'gmina') return !!property.raw_data?.['Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'miejscowosc') return !!property.raw_data?.['Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'ulica') return !!property.raw_data?.['Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'numer') return !!property.raw_data?.['Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    if (field === 'kod_pocztowy') return !!property.raw_data?.['Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego']
    return false
  }).length

  // Pricing section (3 fields)
  const pricingFields = ['price_per_m2', 'total_price', 'final_price']
  const pricingValid = pricingFields.filter(field => {
    const value = property[field as keyof ParsedProperty]
    return value !== undefined && value !== null && (typeof value !== 'number' || value > 0)
  }).length

  // Technical section (8 fields)
  const technicalFields = ['property_number', 'property_type', 'area', 'liczba_pokoi', 'kondygnacja', 'construction_year', 'energy_class', 'data_pierwszej_oferty']
  const technicalValid = technicalFields.filter(field => {
    const value = property[field as keyof ParsedProperty]
    if (field === 'property_type') return !!property.raw_data?.['Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny']
    if (field === 'data_pierwszej_oferty') return !!property.raw_data?.['Data pierwszej oferty']
    return value !== undefined && value !== null && value !== ''
  }).length

  return {
    developer: {
      total: developerFields.length,
      valid: developerValid,
      percentage: Math.round((developerValid / developerFields.length) * 100)
    },
    location: {
      total: locationFields.length,
      valid: locationValid,
      percentage: Math.round((locationValid / locationFields.length) * 100)
    },
    pricing: {
      total: pricingFields.length,
      valid: pricingValid,
      percentage: Math.round((pricingValid / pricingFields.length) * 100)
    },
    technical: {
      total: technicalFields.length,
      valid: technicalValid,
      percentage: Math.round((technicalValid / technicalFields.length) * 100)
    }
  }
}

/**
 * Generate detailed missing field information (Task #99.4)
 */
function generateMissingFieldsInfo(
  missingRequired: string[],
  missingRecommended: string[],
  property: ParsedProperty
): MissingFieldInfo[] {
  const missingFields: MissingFieldInfo[] = []

  // Map field names to sections
  const fieldSectionMap: Record<string, 'developer' | 'location' | 'pricing' | 'technical'> = {
    // Developer fields
    nazwa_dewelopera: 'developer',
    nip: 'developer',
    forma_prawna: 'developer',
    // Location fields
    wojewodztwo: 'location',
    powiat: 'location',
    gmina: 'location',
    miejscowosc: 'location',
    kod_pocztowy: 'location',
    ulica: 'location',
    // Pricing fields
    price_per_m2: 'pricing',
    total_price: 'pricing',
    final_price: 'pricing',
    // Technical fields
    property_number: 'technical',
    area: 'technical',
    property_type: 'technical',
    liczba_pokoi: 'technical',
    construction_year: 'technical'
  }

  // Add missing required fields
  for (const field of missingRequired) {
    missingFields.push({
      fieldName: field,
      displayName: REQUIRED_FIELDS[field as keyof typeof REQUIRED_FIELDS] || field,
      category: 'required',
      section: fieldSectionMap[field] || 'technical',
      severity: 'critical'
    })
  }

  // Add missing recommended fields
  for (const field of missingRecommended) {
    missingFields.push({
      fieldName: field,
      displayName: RECOMMENDED_FIELDS[field as keyof typeof RECOMMENDED_FIELDS] || field,
      category: 'recommended',
      section: fieldSectionMap[field] || 'technical',
      severity: 'warning'
    })
  }

  return missingFields
}

// ============================================================================
// MAIN VALIDATION FUNCTION (Task #89.1 & #89.3 & #99)
// ============================================================================

/**
 * Validate single property against ministry requirements
 *
 * @param property - Parsed property object
 * @returns PropertyValidationResult with categorized errors and warnings
 */
export function validateProperty(property: ParsedProperty): PropertyValidationResult {
  const errors: FieldValidationError[] = []
  const warnings: FieldValidationError[] = []
  const missingRequired: string[] = []
  const missingRecommended: string[] = []
  const invalidFormats: string[] = []

  const propertyNumber = property.property_number || property.apartment_number || 'Nieznany'

  // ========================================================================
  // REQUIRED FIELDS VALIDATION
  // ========================================================================

  // Property number
  if (!property.property_number || property.property_number.trim() === '') {
    missingRequired.push('property_number')
    errors.push({
      field: 'property_number',
      message: 'Brak numeru lokalu (pole wymagane)',
      severity: 'critical'
    })
  }

  // Location fields
  const wojewodztwo = property.raw_data?.['Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
  const powiat = property.raw_data?.['Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
  const gmina = property.raw_data?.['Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string

  if (!wojewodztwo || wojewodztwo.trim() === '') {
    missingRequired.push('wojewodztwo')
    errors.push({
      field: 'wojewodztwo',
      message: 'Brak województwa (pole wymagane)',
      severity: 'critical'
    })
  } else if (!VALID_VOIVODESHIPS.includes(wojewodztwo.toLowerCase())) {
    invalidFormats.push('wojewodztwo')
    errors.push({
      field: 'wojewodztwo',
      message: `Nieprawidłowa nazwa województwa: "${wojewodztwo}"`,
      severity: 'critical',
      value: wojewodztwo
    })
  }

  if (!powiat || powiat.trim() === '') {
    missingRequired.push('powiat')
    errors.push({
      field: 'powiat',
      message: 'Brak powiatu (pole wymagane)',
      severity: 'critical'
    })
  }

  if (!gmina || gmina.trim() === '') {
    missingRequired.push('gmina')
    errors.push({
      field: 'gmina',
      message: 'Brak gminy (pole wymagane)',
      severity: 'critical'
    })
  }

  // Postal code (required + format)
  const kodPocztowy = property.raw_data?.['Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
  const postalCodeValidation = validatePostalCode(kodPocztowy)
  if (!postalCodeValidation.valid) {
    if (!kodPocztowy) {
      missingRequired.push('kod_pocztowy')
      errors.push({
        field: 'kod_pocztowy',
        message: postalCodeValidation.error!,
        severity: 'critical'
      })
    } else {
      invalidFormats.push('kod_pocztowy')
      warnings.push({
        field: 'kod_pocztowy',
        message: postalCodeValidation.error!,
        severity: 'warning',
        value: kodPocztowy
      })
    }
  }

  // Pricing fields
  if (!property.price_per_m2 || (typeof property.price_per_m2 === 'number' && property.price_per_m2 <= 0)) {
    missingRequired.push('price_per_m2')
    errors.push({
      field: 'price_per_m2',
      message: 'Brak lub nieprawidłowa cena za m² (musi być > 0)',
      severity: 'critical'
    })
  } else if (typeof property.price_per_m2 === 'number') {
    // Price range validation
    const priceRangeValidation = validatePriceRange(property.price_per_m2)
    if (!priceRangeValidation.valid) {
      warnings.push({
        field: 'price_per_m2',
        message: priceRangeValidation.warning!,
        severity: 'warning',
        value: property.price_per_m2
      })
    }
  }

  if (!property.total_price || (typeof property.total_price === 'number' && property.total_price <= 0)) {
    missingRequired.push('total_price')
    errors.push({
      field: 'total_price',
      message: 'Brak lub nieprawidłowa cena całkowita (musi być > 0)',
      severity: 'critical'
    })
  }

  // Area
  if (!property.area || (typeof property.area === 'number' && property.area <= 0)) {
    missingRequired.push('area')
    errors.push({
      field: 'area',
      message: 'Brak lub nieprawidłowa powierzchnia (musi być > 0)',
      severity: 'critical'
    })
  } else if (typeof property.area === 'number') {
    // Area range validation
    const areaRangeValidation = validateAreaRange(property.area)
    if (!areaRangeValidation.valid) {
      warnings.push({
        field: 'area',
        message: areaRangeValidation.warning!,
        severity: 'warning',
        value: property.area
      })
    }
  }

  // Price consistency check
  if (typeof property.price_per_m2 === 'number' && typeof property.area === 'number' && typeof property.total_price === 'number') {
    const priceConsistencyValidation = validatePriceConsistency(
      property.price_per_m2,
      property.area,
      property.total_price
    )
    if (!priceConsistencyValidation.valid) {
      warnings.push({
        field: 'price_consistency',
        message: priceConsistencyValidation.warning!,
        severity: 'warning'
      })
    }
  }

  // Developer information
  const developerName = property.raw_data?.['Nazwa dewelopera'] as string
  const nip = property.raw_data?.['Nr NIP'] as string

  if (!developerName || developerName.trim() === '') {
    missingRequired.push('developer_name')
    errors.push({
      field: 'developer_name',
      message: 'Brak nazwy dewelopera (pole wymagane)',
      severity: 'critical'
    })
  }

  // NIP validation (required + format)
  const nipValidation = validateNIP(nip)
  if (!nipValidation.valid) {
    if (!nip) {
      missingRequired.push('nip')
      errors.push({
        field: 'nip',
        message: nipValidation.error!,
        severity: 'critical'
      })
    } else {
      invalidFormats.push('nip')
      warnings.push({
        field: 'nip',
        message: nipValidation.error!,
        severity: 'warning',
        value: nip
      })
    }
  }

  // ========================================================================
  // CONDITIONALLY REQUIRED FIELDS (Task #89.1)
  // ========================================================================

  const legalForm = property.raw_data?.['Forma prawna'] as string
  const krs = property.raw_data?.['Nr KRS'] as string
  const ceidg = property.raw_data?.['Nr wpisu do CEIDG'] as string

  // If legal form requires KRS, validate it
  if (legalForm && KRS_REQUIRED_LEGAL_FORMS.some(form => legalForm.toLowerCase().includes(form))) {
    const krsValidation = validateKRS(krs)
    if (!krs) {
      errors.push({
        field: 'nr_krs',
        message: `Nr KRS wymagany dla formy prawnej: "${legalForm}"`,
        severity: 'critical'
      })
    } else if (!krsValidation.valid) {
      invalidFormats.push('nr_krs')
      warnings.push({
        field: 'nr_krs',
        message: krsValidation.error!,
        severity: 'warning',
        value: krs
      })
    }
  } else {
    // For other legal forms, CEIDG may be required
    if (ceidg) {
      const ceidgValidation = validateCEIDG(ceidg)
      if (!ceidgValidation.valid) {
        invalidFormats.push('nr_ceidg')
        warnings.push({
          field: 'nr_ceidg',
          message: ceidgValidation.error!,
          severity: 'warning',
          value: ceidg
        })
      }
    }
  }

  // ========================================================================
  // RECOMMENDED FIELDS VALIDATION
  // ========================================================================

  const ulica = property.raw_data?.['Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'] as string
  if (!ulica || ulica.trim() === '') {
    missingRecommended.push('ulica')
    warnings.push({
      field: 'ulica',
      message: 'Brak ulicy (pole zalecane)',
      severity: 'info'
    })
  }

  const propertyType = property.raw_data?.['Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny'] as string
  if (!propertyType || propertyType.trim() === '') {
    missingRecommended.push('property_type')
    warnings.push({
      field: 'property_type',
      message: 'Brak rodzaju nieruchomości (pole zalecane)',
      severity: 'info'
    })
  }

  // Rooms count validation
  if (typeof property.liczba_pokoi === 'number') {
    const roomsValidation = validateRoomsCount(property.liczba_pokoi)
    if (!roomsValidation.valid) {
      warnings.push({
        field: 'liczba_pokoi',
        message: roomsValidation.warning!,
        severity: 'warning',
        value: property.liczba_pokoi
      })
    }
  }

  // Construction year validation
  if (typeof property.construction_year === 'number') {
    const yearValidation = validateConstructionYear(property.construction_year)
    if (!yearValidation.valid) {
      warnings.push({
        field: 'construction_year',
        message: yearValidation.warning!,
        severity: 'warning',
        value: property.construction_year
      })
    }
  }

  // Date validation
  const dataOferty = property.raw_data?.['Data pierwszej oferty'] as string
  if (dataOferty) {
    const dateFormatValidation = validateDateFormat(dataOferty)
    if (!dateFormatValidation.valid) {
      invalidFormats.push('data_pierwszej_oferty')
      warnings.push({
        field: 'data_pierwszej_oferty',
        message: dateFormatValidation.error!,
        severity: 'warning',
        value: dataOferty
      })
    } else {
      const dateFutureValidation = validateDateNotFuture(dataOferty, 'Data pierwszej oferty')
      if (!dateFutureValidation.valid) {
        warnings.push({
          field: 'data_pierwszej_oferty',
          message: dateFutureValidation.warning!,
          severity: 'warning',
          value: dataOferty
        })
      }
    }
  }

  // ========================================================================
  // SECTION BREAKDOWN & DETAILED MISSING FIELDS (Task #99.3 & #99.4)
  // ========================================================================

  const sectionBreakdown = calculateSectionBreakdown(property)
  const missingFieldsDetailed = generateMissingFieldsInfo(missingRequired, missingRecommended, property)

  // ========================================================================
  // RETURN RESULT
  // ========================================================================

  const valid = errors.length === 0

  return {
    valid,
    propertyNumber,
    errors,
    warnings,
    missingRequired,
    missingRecommended,
    invalidFormats,
    sectionBreakdown,
    missingFieldsDetailed
  }
}

/**
 * Validate batch of properties (for bulk CSV uploads)
 *
 * @param properties - Array of parsed properties
 * @returns BatchValidationResult with aggregated statistics
 */
export function validateProperties(properties: ParsedProperty[]): BatchValidationResult {
  const propertyResults: PropertyValidationResult[] = []
  const globalErrors: string[] = []
  const globalWarnings: string[] = []

  // Validate each property
  for (const property of properties) {
    const result = validateProperty(property)
    propertyResults.push(result)
  }

  // Calculate statistics
  const validProperties = propertyResults.filter(r => r.valid).length
  const invalidProperties = propertyResults.length - validProperties

  // Compliance score calculation
  const totalFields = Object.keys(REQUIRED_FIELDS).length + Object.keys(RECOMMENDED_FIELDS).length
  const avgFieldsPresent = propertyResults.length > 0
    ? propertyResults.reduce((acc, r) => {
        const presentRequired = Object.keys(REQUIRED_FIELDS).length - r.missingRequired.length
        const presentRecommended = Object.keys(RECOMMENDED_FIELDS).length - r.missingRecommended.length
        return acc + presentRequired + presentRecommended
      }, 0) / propertyResults.length
    : 0

  const complianceScore = propertyResults.length > 0
    ? Math.round((avgFieldsPresent / totalFields) * 100)
    : 0

  // Global aggregation
  const propertiesWithMissingLocation = propertyResults.filter(r =>
    r.missingRequired.includes('wojewodztwo') ||
    r.missingRequired.includes('powiat') ||
    r.missingRequired.includes('gmina')
  ).length

  if (propertiesWithMissingLocation > 0) {
    globalErrors.push(
      `${propertiesWithMissingLocation} mieszkań bez wymaganych danych lokalizacji (${Math.round(propertiesWithMissingLocation / properties.length * 100)}%)`
    )
  }

  const propertiesWithMissingPrices = propertyResults.filter(r =>
    r.missingRequired.includes('price_per_m2') ||
    r.missingRequired.includes('total_price')
  ).length

  if (propertiesWithMissingPrices > 0) {
    globalErrors.push(
      `${propertiesWithMissingPrices} mieszkań bez kompletnych danych cenowych`
    )
  }

  // ========================================================================
  // AGGREGATED SECTION BREAKDOWN (Task #99.3)
  // ========================================================================

  const aggregateSectionBreakdown = (): {
    developer: SectionBreakdown
    location: SectionBreakdown
    pricing: SectionBreakdown
    technical: SectionBreakdown
  } => {
    if (propertyResults.length === 0) {
      return {
        developer: { total: 28, valid: 0, percentage: 0 },
        location: { total: 7, valid: 0, percentage: 0 },
        pricing: { total: 3, valid: 0, percentage: 0 },
        technical: { total: 8, valid: 0, percentage: 0 }
      }
    }

    const avgDeveloper = Math.round(
      propertyResults.reduce((sum, r) => sum + (r.sectionBreakdown?.developer.percentage || 0), 0) / propertyResults.length
    )
    const avgLocation = Math.round(
      propertyResults.reduce((sum, r) => sum + (r.sectionBreakdown?.location.percentage || 0), 0) / propertyResults.length
    )
    const avgPricing = Math.round(
      propertyResults.reduce((sum, r) => sum + (r.sectionBreakdown?.pricing.percentage || 0), 0) / propertyResults.length
    )
    const avgTechnical = Math.round(
      propertyResults.reduce((sum, r) => sum + (r.sectionBreakdown?.technical.percentage || 0), 0) / propertyResults.length
    )

    return {
      developer: {
        total: 28,
        valid: Math.round((avgDeveloper / 100) * 28),
        percentage: avgDeveloper
      },
      location: {
        total: 7,
        valid: Math.round((avgLocation / 100) * 7),
        percentage: avgLocation
      },
      pricing: {
        total: 3,
        valid: Math.round((avgPricing / 100) * 3),
        percentage: avgPricing
      },
      technical: {
        total: 8,
        valid: Math.round((avgTechnical / 100) * 8),
        percentage: avgTechnical
      }
    }
  }

  // ========================================================================
  // MISSING FIELDS SUMMARY (Task #99.4)
  // ========================================================================

  const missingFieldsSummary = {
    developer: [] as string[],
    location: [] as string[],
    pricing: [] as string[],
    technical: [] as string[]
  }

  // Aggregate missing fields across all properties
  for (const result of propertyResults) {
    if (result.missingFieldsDetailed) {
      for (const field of result.missingFieldsDetailed) {
        const fieldList = missingFieldsSummary[field.section]
        if (!fieldList.includes(field.displayName)) {
          fieldList.push(field.displayName)
        }
      }
    }
  }

  // ========================================================================
  // RETURN RESULT
  // ========================================================================

  // Overall validity
  const valid = globalErrors.length === 0 && invalidProperties === 0

  return {
    valid,
    totalProperties: properties.length,
    validProperties,
    invalidProperties,
    complianceScore,
    globalErrors,
    globalWarnings,
    propertyResults,
    sectionBreakdown: aggregateSectionBreakdown(),
    missingFieldsSummary
  }
}
