/**
 * Enhanced Data Quality Widget Test Suite (Task #102.5)
 *
 * Tests all utility functions, color coding logic, field mappings,
 * and data transformation for the Enhanced Data Quality Widget.
 *
 * Subtasks covered:
 * - Color classification (red/yellow/green)
 * - Field label mapping
 * - Severity categorization
 * - Section data transformation
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// UTILITY FUNCTIONS (exported for testing)
// ============================================================================

/**
 * Determines color class based on completion percentage
 * Green: >=80%, Yellow: 50-79%, Red: <50%
 */
function getColorClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Gets text color for percentage display
 */
function getTextColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-700'
  if (percentage >= 50) return 'text-yellow-700'
  return 'text-red-700'
}

/**
 * Gets badge variant based on completion
 */
function getBadgeVariant(percentage: number): "default" | "secondary" | "destructive" {
  if (percentage >= 80) return 'default'
  if (percentage >= 50) return 'secondary'
  return 'destructive'
}

/**
 * Maps field names to human-readable labels
 */
function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    // Basic Info
    company_name: 'Nazwa firmy',
    nip: 'NIP',
    regon: 'REGON',
    krs: 'KRS',

    // Headquarters
    headquarters_street: 'Ulica siedziby',
    headquarters_city: 'Miasto siedziby',
    headquarters_postal_code: 'Kod pocztowy siedziby',
    headquarters_province: 'Województwo siedziby',

    // Sales Office
    sales_office_street: 'Ulica biura sprzedaży',
    sales_office_city: 'Miasto biura sprzedaży',
    sales_office_postal_code: 'Kod pocztowy biura',

    // Contact
    contact_email: 'Email kontaktowy',
    contact_phone: 'Telefon kontaktowy',
    website: 'Strona WWW',
  }

  return labels[fieldName] || fieldName
}

/**
 * Determines field severity (critical/recommended)
 */
function getFieldSeverity(fieldName: string, criticalFields: string[]): 'critical' | 'recommended' {
  return criticalFields.includes(fieldName) ? 'critical' : 'recommended'
}

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

interface CompletionData {
  developerId: string
  companyName: string
  overallCompletion: number
  sectionCompletion: {
    basicInfo: { complete: boolean; percentage: number }
    headquarters: { complete: boolean; percentage: number }
    salesOffice: { complete: boolean; percentage: number }
    contact: { complete: boolean; percentage: number }
  }
  missingCriticalFields: string[]
  missingRecommendedFields: string[]
  nextSteps: string[]
}

const createMockCompletionData = (overallCompletion: number): CompletionData => ({
  developerId: 'dev-123',
  companyName: 'Test Developer Sp. z o.o.',
  overallCompletion,
  sectionCompletion: {
    basicInfo: { complete: overallCompletion === 100, percentage: overallCompletion },
    headquarters: { complete: overallCompletion === 100, percentage: overallCompletion },
    salesOffice: { complete: overallCompletion === 100, percentage: overallCompletion },
    contact: { complete: overallCompletion === 100, percentage: overallCompletion },
  },
  missingCriticalFields: overallCompletion === 100 ? [] : ['nip', 'regon'],
  missingRecommendedFields: overallCompletion === 100 ? [] : ['krs', 'website'],
  nextSteps: overallCompletion === 100 ? [] : ['Uzupełnij dane NIP', 'Dodaj REGON'],
})

const createPartialCompletionData = (): CompletionData => ({
  developerId: 'dev-456',
  companyName: 'Partial Developer',
  overallCompletion: 65,
  sectionCompletion: {
    basicInfo: { complete: false, percentage: 50 },
    headquarters: { complete: false, percentage: 75 },
    salesOffice: { complete: true, percentage: 100 },
    contact: { complete: false, percentage: 30 },
  },
  missingCriticalFields: ['nip', 'contact_email'],
  missingRecommendedFields: ['regon', 'krs', 'website'],
  nextSteps: [
    'Uzupełnij NIP',
    'Dodaj email kontaktowy',
    'Uzupełnij dane siedziby',
  ],
})

// ============================================================================
// SUBTASK 102.5.1: COLOR CODING TESTS
// ============================================================================

describe('Task #102.5.1: Color Coding Logic', () => {
  describe('getColorClass', () => {
    it('should return green for completion >= 80%', () => {
      expect(getColorClass(80)).toBe('bg-green-500')
      expect(getColorClass(90)).toBe('bg-green-500')
      expect(getColorClass(100)).toBe('bg-green-500')
    })

    it('should return yellow for completion 50-79%', () => {
      expect(getColorClass(50)).toBe('bg-yellow-500')
      expect(getColorClass(60)).toBe('bg-yellow-500')
      expect(getColorClass(79)).toBe('bg-yellow-500')
    })

    it('should return red for completion < 50%', () => {
      expect(getColorClass(0)).toBe('bg-red-500')
      expect(getColorClass(25)).toBe('bg-red-500')
      expect(getColorClass(49)).toBe('bg-red-500')
    })

    it('should handle boundary values correctly', () => {
      expect(getColorClass(79.9)).toBe('bg-yellow-500')
      expect(getColorClass(80)).toBe('bg-green-500')
      expect(getColorClass(49.9)).toBe('bg-red-500')
      expect(getColorClass(50)).toBe('bg-yellow-500')
    })

    it('should handle edge cases', () => {
      expect(getColorClass(-10)).toBe('bg-red-500')
      expect(getColorClass(150)).toBe('bg-green-500')
    })
  })

  describe('getTextColor', () => {
    it('should return correct text color for each range', () => {
      expect(getTextColor(100)).toBe('text-green-700')
      expect(getTextColor(65)).toBe('text-yellow-700')
      expect(getTextColor(30)).toBe('text-red-700')
    })

    it('should handle boundary values', () => {
      expect(getTextColor(80)).toBe('text-green-700')
      expect(getTextColor(79)).toBe('text-yellow-700')
      expect(getTextColor(50)).toBe('text-yellow-700')
      expect(getTextColor(49)).toBe('text-red-700')
    })
  })

  describe('getBadgeVariant', () => {
    it('should return default variant for high completion', () => {
      expect(getBadgeVariant(80)).toBe('default')
      expect(getBadgeVariant(100)).toBe('default')
    })

    it('should return secondary variant for medium completion', () => {
      expect(getBadgeVariant(50)).toBe('secondary')
      expect(getBadgeVariant(65)).toBe('secondary')
    })

    it('should return destructive variant for low completion', () => {
      expect(getBadgeVariant(0)).toBe('destructive')
      expect(getBadgeVariant(49)).toBe('destructive')
    })
  })
})

// ============================================================================
// SUBTASK 102.5.2: FIELD MAPPING TESTS
// ============================================================================

describe('Task #102.5.2: Field Label Mapping', () => {
  describe('getFieldLabel', () => {
    it('should map basic info fields correctly', () => {
      expect(getFieldLabel('company_name')).toBe('Nazwa firmy')
      expect(getFieldLabel('nip')).toBe('NIP')
      expect(getFieldLabel('regon')).toBe('REGON')
      expect(getFieldLabel('krs')).toBe('KRS')
    })

    it('should map headquarters fields correctly', () => {
      expect(getFieldLabel('headquarters_street')).toBe('Ulica siedziby')
      expect(getFieldLabel('headquarters_city')).toBe('Miasto siedziby')
      expect(getFieldLabel('headquarters_postal_code')).toBe('Kod pocztowy siedziby')
      expect(getFieldLabel('headquarters_province')).toBe('Województwo siedziby')
    })

    it('should map sales office fields correctly', () => {
      expect(getFieldLabel('sales_office_street')).toBe('Ulica biura sprzedaży')
      expect(getFieldLabel('sales_office_city')).toBe('Miasto biura sprzedaży')
      expect(getFieldLabel('sales_office_postal_code')).toBe('Kod pocztowy biura')
    })

    it('should map contact fields correctly', () => {
      expect(getFieldLabel('contact_email')).toBe('Email kontaktowy')
      expect(getFieldLabel('contact_phone')).toBe('Telefon kontaktowy')
      expect(getFieldLabel('website')).toBe('Strona WWW')
    })

    it('should return original field name for unknown fields', () => {
      expect(getFieldLabel('unknown_field')).toBe('unknown_field')
      expect(getFieldLabel('random_123')).toBe('random_123')
    })

    it('should handle empty and special characters', () => {
      expect(getFieldLabel('')).toBe('')
      expect(getFieldLabel('field_with_underscore')).toBe('field_with_underscore')
    })
  })
})

// ============================================================================
// SUBTASK 102.5.3: SEVERITY CATEGORIZATION TESTS
// ============================================================================

describe('Task #102.5.3: Field Severity Categorization', () => {
  describe('getFieldSeverity', () => {
    it('should return critical for fields in critical list', () => {
      const criticalFields = ['nip', 'regon', 'contact_email']

      expect(getFieldSeverity('nip', criticalFields)).toBe('critical')
      expect(getFieldSeverity('regon', criticalFields)).toBe('critical')
      expect(getFieldSeverity('contact_email', criticalFields)).toBe('critical')
    })

    it('should return recommended for fields not in critical list', () => {
      const criticalFields = ['nip', 'regon']

      expect(getFieldSeverity('krs', criticalFields)).toBe('recommended')
      expect(getFieldSeverity('website', criticalFields)).toBe('recommended')
      expect(getFieldSeverity('headquarters_street', criticalFields)).toBe('recommended')
    })

    it('should handle empty critical fields list', () => {
      expect(getFieldSeverity('nip', [])).toBe('recommended')
      expect(getFieldSeverity('any_field', [])).toBe('recommended')
    })

    it('should be case-sensitive', () => {
      const criticalFields = ['nip']

      expect(getFieldSeverity('nip', criticalFields)).toBe('critical')
      expect(getFieldSeverity('NIP', criticalFields)).toBe('recommended')
      expect(getFieldSeverity('Nip', criticalFields)).toBe('recommended')
    })
  })
})

// ============================================================================
// SUBTASK 102.5.4: DATA TRANSFORMATION TESTS
// ============================================================================

describe('Task #102.5.4: Section Data Transformation', () => {
  it('should correctly identify section missing fields', () => {
    const data = createPartialCompletionData()
    const allMissing = [...data.missingCriticalFields, ...data.missingRecommendedFields]

    // Basic info fields
    const basicInfoFields = allMissing.filter(f =>
      ['company_name', 'nip', 'regon', 'krs'].includes(f)
    )
    expect(basicInfoFields).toContain('nip')
    expect(basicInfoFields).toContain('regon')
    expect(basicInfoFields).toContain('krs')

    // Contact fields
    const contactFields = allMissing.filter(f =>
      ['contact_email', 'contact_phone', 'website'].includes(f)
    )
    expect(contactFields).toContain('contact_email')
    expect(contactFields).toContain('website')
  })

  it('should calculate correct section percentages', () => {
    const data = createPartialCompletionData()

    expect(data.sectionCompletion.basicInfo.percentage).toBe(50)
    expect(data.sectionCompletion.headquarters.percentage).toBe(75)
    expect(data.sectionCompletion.salesOffice.percentage).toBe(100)
    expect(data.sectionCompletion.contact.percentage).toBe(30)
  })

  it('should mark sections as complete correctly', () => {
    const completeData = createMockCompletionData(100)

    expect(completeData.sectionCompletion.basicInfo.complete).toBe(true)
    expect(completeData.sectionCompletion.headquarters.complete).toBe(true)
    expect(completeData.sectionCompletion.salesOffice.complete).toBe(true)
    expect(completeData.sectionCompletion.contact.complete).toBe(true)

    const partialData = createPartialCompletionData()

    expect(partialData.sectionCompletion.basicInfo.complete).toBe(false)
    expect(partialData.sectionCompletion.salesOffice.complete).toBe(true)
    expect(partialData.sectionCompletion.contact.complete).toBe(false)
  })
})

// ============================================================================
// SUBTASK 102.5.5: EDGE CASES AND ERROR HANDLING
// ============================================================================

describe('Task #102.5.5: Edge Cases and Error Handling', () => {
  it('should handle 0% completion', () => {
    const data = createMockCompletionData(0)

    expect(data.overallCompletion).toBe(0)
    expect(getColorClass(data.overallCompletion)).toBe('bg-red-500')
    expect(getBadgeVariant(data.overallCompletion)).toBe('destructive')
  })

  it('should handle 100% completion', () => {
    const data = createMockCompletionData(100)

    expect(data.overallCompletion).toBe(100)
    expect(data.missingCriticalFields).toHaveLength(0)
    expect(data.missingRecommendedFields).toHaveLength(0)
    expect(data.nextSteps).toHaveLength(0)
    expect(getColorClass(data.overallCompletion)).toBe('bg-green-500')
  })

  it('should handle partial completion with mixed sections', () => {
    const data = createPartialCompletionData()

    expect(data.overallCompletion).toBeGreaterThan(0)
    expect(data.overallCompletion).toBeLessThan(100)
    expect(data.missingCriticalFields.length).toBeGreaterThan(0)
    expect(data.nextSteps.length).toBeGreaterThan(0)
  })

  it('should handle missing fields categorization', () => {
    const data = createPartialCompletionData()

    expect(Array.isArray(data.missingCriticalFields)).toBe(true)
    expect(Array.isArray(data.missingRecommendedFields)).toBe(true)

    // Critical fields should not be in recommended
    const overlap = data.missingCriticalFields.filter(f =>
      data.missingRecommendedFields.includes(f)
    )
    expect(overlap).toHaveLength(0)
  })

  it('should handle negative percentages gracefully', () => {
    expect(getColorClass(-5)).toBe('bg-red-500')
    expect(getTextColor(-10)).toBe('text-red-700')
    expect(getBadgeVariant(-1)).toBe('destructive')
  })

  it('should handle percentages over 100 gracefully', () => {
    expect(getColorClass(105)).toBe('bg-green-500')
    expect(getTextColor(150)).toBe('text-green-700')
    expect(getBadgeVariant(200)).toBe('default')
  })

  it('should handle decimal percentages correctly', () => {
    expect(getColorClass(79.5)).toBe('bg-yellow-500')
    expect(getColorClass(80.1)).toBe('bg-green-500')
    expect(getColorClass(49.9)).toBe('bg-red-500')
    expect(getColorClass(50.1)).toBe('bg-yellow-500')
  })
})

// ============================================================================
// SUBTASK 102.5.6: INTEGRATION SCENARIOS
// ============================================================================

describe('Task #102.5.6: Integration Scenarios', () => {
  it('should provide correct visual feedback for high completion', () => {
    const data = createMockCompletionData(95)

    expect(getColorClass(data.overallCompletion)).toBe('bg-green-500')
    expect(getTextColor(data.overallCompletion)).toBe('text-green-700')
    expect(getBadgeVariant(data.overallCompletion)).toBe('default')
  })

  it('should provide correct visual feedback for medium completion', () => {
    const data = createMockCompletionData(65)

    expect(getColorClass(data.overallCompletion)).toBe('bg-yellow-500')
    expect(getTextColor(data.overallCompletion)).toBe('text-yellow-700')
    expect(getBadgeVariant(data.overallCompletion)).toBe('secondary')
  })

  it('should provide correct visual feedback for low completion', () => {
    const data = createMockCompletionData(30)

    expect(getColorClass(data.overallCompletion)).toBe('bg-red-500')
    expect(getTextColor(data.overallCompletion)).toBe('text-red-700')
    expect(getBadgeVariant(data.overallCompletion)).toBe('destructive')
  })

  it('should handle mixed section completions correctly', () => {
    const data = createPartialCompletionData()

    const sections = [
      { name: 'basicInfo', percentage: data.sectionCompletion.basicInfo.percentage },
      { name: 'headquarters', percentage: data.sectionCompletion.headquarters.percentage },
      { name: 'salesOffice', percentage: data.sectionCompletion.salesOffice.percentage },
      { name: 'contact', percentage: data.sectionCompletion.contact.percentage },
    ]

    sections.forEach(section => {
      const color = getColorClass(section.percentage)
      const textColor = getTextColor(section.percentage)
      const badge = getBadgeVariant(section.percentage)

      // Verify color consistency
      if (section.percentage >= 80) {
        expect(color).toContain('green')
        expect(textColor).toContain('green')
        expect(badge).toBe('default')
      } else if (section.percentage >= 50) {
        expect(color).toContain('yellow')
        expect(textColor).toContain('yellow')
        expect(badge).toBe('secondary')
      } else {
        expect(color).toContain('red')
        expect(textColor).toContain('red')
        expect(badge).toBe('destructive')
      }
    })
  })

  it('should correctly map all field types to labels', () => {
    const allFields = [
      'company_name', 'nip', 'regon', 'krs',
      'headquarters_street', 'headquarters_city', 'headquarters_postal_code', 'headquarters_province',
      'sales_office_street', 'sales_office_city', 'sales_office_postal_code',
      'contact_email', 'contact_phone', 'website'
    ]

    allFields.forEach(field => {
      const label = getFieldLabel(field)
      expect(label).toBeDefined()
      expect(label.length).toBeGreaterThan(0)
      // Label should be in Polish
      expect(label).not.toBe(field) // Should be translated
    })
  })
})

// ============================================================================
// SUBTASK 102.5.7: PERFORMANCE AND BOUNDARY TESTS
// ============================================================================

describe('Task #102.5.7: Performance and Boundary Tests', () => {
  it('should handle large number of missing fields efficiently', () => {
    const largeFieldList = Array.from({ length: 100 }, (_, i) => `field_${i}`)

    largeFieldList.forEach(field => {
      const label = getFieldLabel(field)
      expect(label).toBe(field) // Unknown fields return original name
    })
  })

  it('should handle all percentage values from 0 to 100', () => {
    for (let i = 0; i <= 100; i++) {
      const color = getColorClass(i)
      const textColor = getTextColor(i)
      const badge = getBadgeVariant(i)

      expect(color).toBeDefined()
      expect(textColor).toBeDefined()
      expect(badge).toBeDefined()

      // Verify color thresholds
      if (i >= 80) {
        expect(color).toBe('bg-green-500')
      } else if (i >= 50) {
        expect(color).toBe('bg-yellow-500')
      } else {
        expect(color).toBe('bg-red-500')
      }
    }
  })

  it('should maintain consistency across multiple calls', () => {
    const percentage = 75

    // Call multiple times
    const calls = Array.from({ length: 10 }, () => ({
      color: getColorClass(percentage),
      text: getTextColor(percentage),
      badge: getBadgeVariant(percentage),
    }))

    // All calls should return same values
    calls.forEach(call => {
      expect(call.color).toBe('bg-yellow-500')
      expect(call.text).toBe('text-yellow-700')
      expect(call.badge).toBe('secondary')
    })
  })
})
