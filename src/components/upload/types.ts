/**
 * Type definitions for Upload Feedback Modal
 * Task #104 - Upload feedback with compliance summary
 */

/**
 * Upload API response structure (from /api/upload)
 */
export interface UploadResponseData {
  fileName: string
  recordsCount: number
  validRecords: number
  autoImportedFields: number
  savedToDatabase: boolean
  preview: unknown[] | null
  trackingData?: {
    fileType: 'csv' | 'xlsx' | 'xls'
    recordsCount: number
  }
}

/**
 * Validation API response structure (from /api/validation/missing-fields)
 */
export interface ValidationSummary {
  totalProperties: number
  propertiesWithIssues: number
  propertiesValid: number
  complianceScore: number
}

export interface MissingFieldSummary {
  count: number
  percentage: number
  severity: 'critical' | 'warning' | 'info'
  fieldLabel: string
}

export interface SectionBreakdown {
  total: number
  valid: number
  percentage: number
}

export interface DetailedMissingField {
  fieldName: string
  displayName: string
  category: 'required' | 'recommended' | 'developer'
  section: 'developer' | 'location' | 'pricing' | 'technical'
  severity: 'critical' | 'warning'
}

export interface ValidationResponseData {
  summary: ValidationSummary
  missingFieldsSummary: Record<string, MissingFieldSummary>
  sectionBreakdown?: {
    developer: SectionBreakdown
    location: SectionBreakdown
    pricing: SectionBreakdown
    technical: SectionBreakdown
  }
  detailedMissingFields?: DetailedMissingField[]
}

export interface ValidationResponse {
  success: boolean
  data: ValidationResponseData
}

/**
 * Props for UploadFeedbackModal component
 */
export interface UploadFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  uploadData: UploadResponseData
  developerId: string
  onStartCompletion: () => void
}

/**
 * Notification badge data stored in localStorage
 */
export interface DataCompletionBadge {
  hasPendingDataCompletion: boolean
  timestamp: number
  complianceScore: number
  fileName?: string
}

/**
 * Color coding for compliance scores
 */
export type ComplianceLevel = 'low' | 'medium' | 'high'

export function getComplianceLevel(score: number): ComplianceLevel {
  if (score < 50) return 'low'
  if (score < 80) return 'medium'
  return 'high'
}

export function getComplianceColor(score: number): string {
  const level = getComplianceLevel(score)
  switch (level) {
    case 'low':
      return 'text-red-600'
    case 'medium':
      return 'text-yellow-600'
    case 'high':
      return 'text-green-600'
  }
}

export function getComplianceBgColor(score: number): string {
  const level = getComplianceLevel(score)
  switch (level) {
    case 'low':
      return 'bg-red-50 border-red-200'
    case 'medium':
      return 'bg-yellow-50 border-yellow-200'
    case 'high':
      return 'bg-green-50 border-green-200'
  }
}
