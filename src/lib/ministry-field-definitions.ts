/**
 * Ministry field definitions for manual data completion UI
 * Based on Polish law: ustawa z dnia 21 maja 2025 r. o jawności cen mieszkań
 *
 * This file centralizes all field metadata used in:
 * - Missing fields detection API
 * - Manual fill UI component
 * - Validation schemas
 */

export interface FieldDefinition {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required: boolean
  description?: string
  validation?: {
    pattern?: string
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
  }
  options?: string[]
}

// Polish voivodeships (provinces)
export const VOIVODESHIPS = [
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

// Property status options
export const PROPERTY_STATUS_OPTIONS = [
  'dostępne',
  'zarezerwowane',
  'sprzedane'
]

// Ownership form options
export const OWNERSHIP_FORM_OPTIONS = [
  'pełna własność',
  'spółdzielcze własnościowe',
  'spółdzielcze lokatorskie',
  'TBS'
]

// Layout type options
export const LAYOUT_TYPE_OPTIONS = [
  'rozkładowe',
  'nierozkładowe'
]

// Finish standard options
export const FINISH_STANDARD_OPTIONS = [
  'deweloperski',
  'pod klucz',
  'do wykończenia',
  'do remontu'
]

// Required fields for ministry compliance
export const REQUIRED_FIELDS: FieldDefinition[] = [
  {
    field: 'wojewodztwo',
    label: 'Województwo',
    type: 'select',
    required: true,
    description: 'Lokalizacja wojewódzka nieruchomości',
    options: VOIVODESHIPS
  },
  {
    field: 'powiat',
    label: 'Powiat',
    type: 'text',
    required: true,
    description: 'Powiat w którym znajduje się nieruchomość',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    field: 'gmina',
    label: 'Gmina',
    type: 'text',
    required: true,
    description: 'Gmina w której znajduje się nieruchomość',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    field: 'miejscowosc',
    label: 'Miejscowość',
    type: 'text',
    required: true,
    description: 'Miasto lub wieś',
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    field: 'kod_pocztowy',
    label: 'Kod pocztowy',
    type: 'text',
    required: true,
    description: 'Format: XX-XXX (np. 00-001)',
    validation: {
      pattern: '[0-9]{2}-[0-9]{3}',
      maxLength: 6
    }
  },
  {
    field: 'cena_za_m2_aktualna',
    label: 'Cena za m² (aktualna)',
    type: 'number',
    required: true,
    description: 'Aktualna cena za metr kwadratowy w PLN',
    validation: {
      min: 0
    }
  },
  {
    field: 'cena_finalna_aktualna',
    label: 'Cena finalna (aktualna)',
    type: 'number',
    required: true,
    description: 'Aktualna cena końcowa nieruchomości w PLN',
    validation: {
      min: 0
    }
  },
  {
    field: 'powierzchnia_uzytkowa',
    label: 'Powierzchnia użytkowa',
    type: 'number',
    required: true,
    description: 'Powierzchnia użytkowa w m²',
    validation: {
      min: 0
    }
  }
]

// Recommended fields (not strictly required but highly recommended by ministry)
export const RECOMMENDED_FIELDS: FieldDefinition[] = [
  {
    field: 'ulica',
    label: 'Ulica',
    type: 'text',
    required: false,
    description: 'Nazwa ulicy (jeśli dotyczy)',
    validation: {
      maxLength: 200
    }
  },
  {
    field: 'numer_nieruchomosci',
    label: 'Numer nieruchomości',
    type: 'text',
    required: false,
    description: 'Numer budynku/działki',
    validation: {
      maxLength: 50
    }
  },
  {
    field: 'data_pierwszej_oferty',
    label: 'Data pierwszej oferty',
    type: 'date',
    required: false,
    description: 'Kiedy nieruchomość została po raz pierwszy wystawiona'
  },
  {
    field: 'data_obowiazywania_ceny_od',
    label: 'Data obowiązywania ceny od',
    type: 'date',
    required: false,
    description: 'Od kiedy obowiązuje aktualna cena'
  },
  {
    field: 'cena_za_m2_poczatkowa',
    label: 'Cena za m² (początkowa)',
    type: 'number',
    required: false,
    description: 'Początkowa cena za metr kwadratowy w PLN',
    validation: {
      min: 0
    }
  },
  {
    field: 'cena_finalna_poczatkowa',
    label: 'Cena finalna (początkowa)',
    type: 'number',
    required: false,
    description: 'Początkowa cena końcowa nieruchomości w PLN',
    validation: {
      min: 0
    }
  },
  {
    field: 'liczba_pokoi',
    label: 'Liczba pokoi',
    type: 'number',
    required: false,
    description: 'Liczba pokoi w lokalu',
    validation: {
      min: 1,
      max: 20
    }
  },
  {
    field: 'kondygnacja',
    label: 'Kondygnacja',
    type: 'number',
    required: false,
    description: 'Piętro na którym znajduje się lokal (-2 = piwnica, 0 = parter)',
    validation: {
      min: -2,
      max: 100
    }
  },
  {
    field: 'liczba_kondygnacji',
    label: 'Liczba kondygnacji',
    type: 'number',
    required: false,
    description: 'Liczba pięter w budynku',
    validation: {
      min: 1,
      max: 100
    }
  },
  {
    field: 'powierzchnia_calkowita',
    label: 'Powierzchnia całkowita',
    type: 'number',
    required: false,
    description: 'Powierzchnia całkowita w m² (wraz z balkonami, etc.)',
    validation: {
      min: 0
    }
  },
  {
    field: 'status_sprzedazy',
    label: 'Status sprzedaży',
    type: 'select',
    required: false,
    description: 'Aktualny status dostępności',
    options: PROPERTY_STATUS_OPTIONS
  },
  {
    field: 'forma_wlasnosci',
    label: 'Forma własności',
    type: 'select',
    required: false,
    description: 'Typ własności nieruchomości',
    options: OWNERSHIP_FORM_OPTIONS
  },
  {
    field: 'uklad_mieszkania',
    label: 'Układ mieszkania',
    type: 'select',
    required: false,
    description: 'Typ układu pomieszczeń',
    options: LAYOUT_TYPE_OPTIONS
  },
  {
    field: 'stan_wykonczenia',
    label: 'Stan wykończenia',
    type: 'select',
    required: false,
    description: 'Stopień wykończenia mieszkania',
    options: FINISH_STANDARD_OPTIONS
  },
  {
    field: 'rok_budowy',
    label: 'Rok budowy',
    type: 'number',
    required: false,
    description: 'Rok oddania budynku do użytku',
    validation: {
      min: 1800,
      max: 2100
    }
  }
]

/**
 * Get field definition by field name
 */
export function getFieldDefinition(fieldName: string): FieldDefinition | undefined {
  return [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS].find(
    field => field.field === fieldName
  )
}

/**
 * Check if field is required
 */
export function isFieldRequired(fieldName: string): boolean {
  return REQUIRED_FIELDS.some(field => field.field === fieldName)
}

/**
 * Get all field names (required + recommended)
 */
export function getAllFieldNames(): string[] {
  return [...REQUIRED_FIELDS, ...RECOMMENDED_FIELDS].map(field => field.field)
}

/**
 * Validate field value against field definition
 */
export function validateFieldValue(
  fieldName: string,
  value: string | number | null | undefined
): { valid: boolean; error?: string } {
  const fieldDef = getFieldDefinition(fieldName)

  if (!fieldDef) {
    return { valid: false, error: 'Nieznane pole' }
  }

  // Required field check
  if (fieldDef.required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: `${fieldDef.label} jest wymagane` }
  }

  // Skip validation if value is empty and field is not required
  if (!fieldDef.required && (value === null || value === undefined || value === '')) {
    return { valid: true }
  }

  // Type-specific validation
  if (fieldDef.type === 'number' && typeof value === 'number') {
    if (fieldDef.validation?.min !== undefined && value < fieldDef.validation.min) {
      return { valid: false, error: `Wartość musi być większa lub równa ${fieldDef.validation.min}` }
    }
    if (fieldDef.validation?.max !== undefined && value > fieldDef.validation.max) {
      return { valid: false, error: `Wartość musi być mniejsza lub równa ${fieldDef.validation.max}` }
    }
  }

  if (fieldDef.type === 'text' && typeof value === 'string') {
    if (fieldDef.validation?.minLength && value.length < fieldDef.validation.minLength) {
      return { valid: false, error: `Minimalna długość: ${fieldDef.validation.minLength} znaków` }
    }
    if (fieldDef.validation?.maxLength && value.length > fieldDef.validation.maxLength) {
      return { valid: false, error: `Maksymalna długość: ${fieldDef.validation.maxLength} znaków` }
    }
    if (fieldDef.validation?.pattern) {
      const regex = new RegExp(`^${fieldDef.validation.pattern}$`)
      if (!regex.test(value)) {
        return { valid: false, error: `Nieprawidłowy format` }
      }
    }
  }

  if (fieldDef.type === 'date' && typeof value === 'string') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(value)) {
      return { valid: false, error: 'Format daty: RRRR-MM-DD' }
    }
  }

  if (fieldDef.type === 'select' && typeof value === 'string') {
    if (fieldDef.options && !fieldDef.options.includes(value)) {
      return { valid: false, error: 'Nieprawidłowa wartość' }
    }
  }

  return { valid: true }
}

/**
 * Format pattern for user-friendly display
 */
export function formatPatternDescription(pattern: string): string {
  const patterns: Record<string, string> = {
    '\\d{10}': '10 cyfr (np. 1234567890)',
    '\\d{9}|\\d{14}': '9 lub 14 cyfr',
    '[0-9]{2}-[0-9]{3}': 'XX-XXX (np. 00-950)',
    '\\+48\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}': '+48 XXX XXX XXX',
  }

  return patterns[pattern] || 'Sprawdź format'
}
