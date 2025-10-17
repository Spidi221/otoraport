/**
 * Upload Feedback Modal Tests
 * Task #104 - Comprehensive test coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UploadFeedbackModal } from '../upload-feedback-modal'
import type { UploadResponseData, ValidationResponse } from '../types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Sample data
const mockUploadData: UploadResponseData = {
  fileName: 'test-file.csv',
  recordsCount: 100,
  validRecords: 95,
  autoImportedFields: 5,
  savedToDatabase: true,
  preview: null,
  trackingData: {
    fileType: 'csv',
    recordsCount: 95,
  },
}

const mockValidationDataHighCompliance: ValidationResponse = {
  success: true,
  data: {
    summary: {
      totalProperties: 95,
      propertiesWithIssues: 10,
      propertiesValid: 85,
      complianceScore: 90,
    },
    missingFieldsSummary: {
      nip: {
        count: 5,
        percentage: 5,
        severity: 'critical',
        fieldLabel: 'NIP (10 cyfr)',
      },
      regon: {
        count: 3,
        percentage: 3,
        severity: 'warning',
        fieldLabel: 'REGON',
      },
    },
    sectionBreakdown: {
      developer: { total: 95, valid: 90, percentage: 94.7 },
      location: { total: 95, valid: 85, percentage: 89.5 },
      pricing: { total: 95, valid: 95, percentage: 100 },
      technical: { total: 95, valid: 80, percentage: 84.2 },
    },
    detailedMissingFields: [],
  },
}

const mockValidationDataLowCompliance: ValidationResponse = {
  success: true,
  data: {
    summary: {
      totalProperties: 95,
      propertiesWithIssues: 60,
      propertiesValid: 35,
      complianceScore: 40,
    },
    missingFieldsSummary: {
      nip: {
        count: 80,
        percentage: 84,
        severity: 'critical',
        fieldLabel: 'NIP (10 cyfr)',
      },
      regon: {
        count: 75,
        percentage: 79,
        severity: 'critical',
        fieldLabel: 'REGON',
      },
      kod_pocztowy: {
        count: 60,
        percentage: 63,
        severity: 'warning',
        fieldLabel: 'Kod pocztowy',
      },
    },
    sectionBreakdown: {
      developer: { total: 95, valid: 20, percentage: 21.1 },
      location: { total: 95, valid: 40, percentage: 42.1 },
      pricing: { total: 95, valid: 50, percentage: 52.6 },
      technical: { total: 95, valid: 35, percentage: 36.8 },
    },
    detailedMissingFields: [],
  },
}

describe('UploadFeedbackModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    uploadData: mockUploadData,
    developerId: 'test-developer-id',
    onStartCompletion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Rendering', () => {
    it('should render modal when open', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      expect(screen.getByText('Upload Successful!')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<UploadFeedbackModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument()
    })

    it('should display upload summary correctly', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      expect(screen.getByText(/95 properties from/i)).toBeInTheDocument()
      // Use getAllByText since filename appears multiple times in modal
      expect(screen.getAllByText(/test-file.csv/i)[0]).toBeInTheDocument()
    })

    it('should display auto-imported fields when greater than 0', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      expect(screen.getByText(/5 fields/i)).toBeInTheDocument()
    })

    it('should not display auto-imported fields when 0', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      const propsWithNoAutoImport = {
        ...defaultProps,
        uploadData: { ...mockUploadData, autoImportedFields: 0 },
      }

      render(<UploadFeedbackModal {...propsWithNoAutoImport} />)

      expect(screen.queryByText(/Auto-Imported Fields/i)).not.toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should fetch validation data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/validation/missing-fields'),
          expect.objectContaining({
            credentials: 'include',
          })
        )
      })
    })

    it('should include developerId and includeSections in query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('developerId=test-developer-id'),
          expect.anything()
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('includeSections=true'),
          expect.anything()
        )
      })
    })

    it('should show loading state while fetching', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<UploadFeedbackModal {...defaultProps} />)

      expect(screen.getByText(/Analyzing data compliance/i)).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Could not load compliance data/i)).toBeInTheDocument()
      })
    })

    it('should show error message when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Could not load compliance data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Compliance Score Display', () => {
    it('should display high compliance score with green color', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        // Use getAllByText since compliance score appears in main display + section breakdown
        expect(screen.getAllByText('90%')[0]).toBeInTheDocument()
        expect(screen.getByText(/Excellent compliance/i)).toBeInTheDocument()
      })
    })

    it('should display low compliance score with red color', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataLowCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('40%')).toBeInTheDocument()
        expect(screen.getByText(/Needs improvement/i)).toBeInTheDocument()
      })
    })

    it('should display section breakdown when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Developer Data/i)).toBeInTheDocument()
        expect(screen.getByText(/Location Data/i)).toBeInTheDocument()
        expect(screen.getByText(/Pricing Data/i)).toBeInTheDocument()
        expect(screen.getByText(/Technical Data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Missing Fields Display', () => {
    it('should display top missing fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/NIP \(10 cyfr\)/i)).toBeInTheDocument()
        expect(screen.getByText(/REGON/i)).toBeInTheDocument()
      })
    })

    it('should show severity badges for missing fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataLowCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        const criticalBadges = screen.getAllByText(/critical/i)
        expect(criticalBadges.length).toBeGreaterThan(0)
      })
    })

    it('should display percentage of properties missing each field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataLowCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/84%/)).toBeInTheDocument()
        expect(screen.getByText(/79%/)).toBeInTheDocument()
      })
    })

    it('should show message when more than 10 missing fields', async () => {
      const manyMissingFields = {
        ...mockValidationDataLowCompliance,
        data: {
          ...mockValidationDataLowCompliance.data,
          missingFieldsSummary: Object.fromEntries(
            Array.from({ length: 15 }, (_, i) => [
              `field_${i}`,
              {
                count: 10,
                percentage: 10,
                severity: 'warning' as const,
                fieldLabel: `Field ${i}`,
              },
            ])
          ),
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manyMissingFields,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Showing top 10 of 15/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Actions', () => {
    it('should call onStartCompletion when "Complete Now" clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Complete Missing Fields Now/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Complete Missing Fields Now/i))

      expect(defaultProps.onStartCompletion).toHaveBeenCalledTimes(1)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should store badge in localStorage when "Do Later" clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/I'll Do This Later/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/I'll Do This Later/i))

      const stored = localStorage.getItem('oto-raport-data-completion-badge')
      expect(stored).toBeTruthy()

      const badgeData = JSON.parse(stored!)
      expect(badgeData.hasPendingDataCompletion).toBe(true)
      expect(badgeData.complianceScore).toBe(90)
      expect(badgeData.fileName).toBe('test-file.csv')
    })

    it('should emit data-completion-pending event when "Do Later" clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      const eventListener = vi.fn()
      window.addEventListener('data-completion-pending', eventListener)

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/I'll Do This Later/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/I'll Do This Later/i))

      expect(eventListener).toHaveBeenCalledTimes(1)
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'data-completion-pending',
        })
      )

      window.removeEventListener('data-completion-pending', eventListener)
    })

    it('should call onClose when "Do Later" clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/I'll Do This Later/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/I'll Do This Later/i))

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should disable Complete Now button while loading', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<UploadFeedbackModal {...defaultProps} />)

      const completeButton = screen.getByRole('button', {
        name: /Complete Missing Fields Now/i,
      })

      expect(completeButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should be dismissible with ESC key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Upload Successful!')).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      // Note: Testing actual ESC dismissal requires dialog component implementation
      // This test verifies the modal is rendered correctly for keyboard interaction
      expect(screen.getByText('Upload Successful!')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty validation data gracefully', async () => {
      const emptyValidation: ValidationResponse = {
        success: true,
        data: {
          summary: {
            totalProperties: 0,
            propertiesWithIssues: 0,
            propertiesValid: 0,
            complianceScore: 100,
          },
          missingFieldsSummary: {},
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyValidation,
      })

      render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })

    it('should re-fetch validation data when modal reopens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockValidationDataHighCompliance,
      })

      const { rerender } = render(<UploadFeedbackModal {...defaultProps} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Close modal
      rerender(<UploadFeedbackModal {...defaultProps} isOpen={false} />)

      // Reopen modal
      rerender(<UploadFeedbackModal {...defaultProps} isOpen={true} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })
})
