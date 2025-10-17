/**
 * Wizard Component Types
 * Task #103 - Data Completion Wizard Types
 */

// Wizard step identifiers
export type WizardStep = 'developer-info' | 'location' | 'pricing' | 'technical'

// Form field definition
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'select'
  placeholder?: string
  required?: boolean
  pattern?: string
  options?: { value: string; label: string }[]
}

// Section definition for wizard steps
export interface WizardSection {
  step: WizardStep
  title: string
  description: string
  fields: FormField[]
}

// Developer form data (matching database schema)
export interface DeveloperFormData {
  // Basic company info (columns 1-10)
  company_name?: string
  legal_form?: string
  krs_number?: string
  ceidg_number?: string
  nip?: string
  regon?: string
  phone?: string
  email?: string
  fax?: string
  website?: string

  // Headquarters address (columns 11-18)
  headquarters_voivodeship?: string
  headquarters_county?: string
  headquarters_municipality?: string
  headquarters_city?: string
  headquarters_street?: string
  headquarters_building_number?: string
  headquarters_apartment_number?: string
  headquarters_postal_code?: string

  // Sales office address (columns 19-26)
  sales_office_voivodeship?: string
  sales_office_county?: string
  sales_office_municipality?: string
  sales_office_city?: string
  sales_office_street?: string
  sales_office_building_number?: string
  sales_office_apartment_number?: string
  sales_office_postal_code?: string

  // Additional info (columns 27-28)
  additional_sales_locations?: string
  contact_method?: string
}

// Wizard state
export interface WizardState {
  currentStep: number
  completedSteps: Set<number>
  formData: DeveloperFormData
  isDirty: boolean
  isSaving: boolean
  lastSaved?: Date
}

// Draft save/restore
export interface WizardDraft {
  formData: DeveloperFormData
  currentStep: number
  timestamp: string
}

// Auto-save status
export interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  error?: string
}

// Completion status from API
export interface CompletionStatus {
  overallCompletion: number
  sectionCompletion: {
    basicInfo: { complete: boolean; percentage: number }
    headquarters: { complete: boolean; percentage: number }
    salesOffice: { complete: boolean; percentage: number }
    contact: { complete: boolean; percentage: number }
  }
  missingCriticalFields: string[]
  missingRecommendedFields: string[]
}
