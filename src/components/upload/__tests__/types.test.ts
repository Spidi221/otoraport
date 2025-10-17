/**
 * Upload Types Tests - No external dependencies required
 * Task #104 - Type safety validation
 */

import { describe, it, expect } from 'vitest'
import {
  getComplianceLevel,
  getComplianceColor,
  getComplianceBgColor,
} from '../types'

describe('Upload Types Utilities', () => {
  describe('getComplianceLevel', () => {
    it('should return "low" for scores below 50', () => {
      expect(getComplianceLevel(0)).toBe('low')
      expect(getComplianceLevel(25)).toBe('low')
      expect(getComplianceLevel(49)).toBe('low')
    })

    it('should return "medium" for scores between 50-79', () => {
      expect(getComplianceLevel(50)).toBe('medium')
      expect(getComplianceLevel(65)).toBe('medium')
      expect(getComplianceLevel(79)).toBe('medium')
    })

    it('should return "high" for scores 80+', () => {
      expect(getComplianceLevel(80)).toBe('high')
      expect(getComplianceLevel(90)).toBe('high')
      expect(getComplianceLevel(100)).toBe('high')
    })
  })

  describe('getComplianceColor', () => {
    it('should return red color for low compliance', () => {
      expect(getComplianceColor(30)).toBe('text-red-600')
    })

    it('should return yellow color for medium compliance', () => {
      expect(getComplianceColor(65)).toBe('text-yellow-600')
    })

    it('should return green color for high compliance', () => {
      expect(getComplianceColor(90)).toBe('text-green-600')
    })
  })

  describe('getComplianceBgColor', () => {
    it('should return red background for low compliance', () => {
      expect(getComplianceBgColor(30)).toBe('bg-red-50 border-red-200')
    })

    it('should return yellow background for medium compliance', () => {
      expect(getComplianceBgColor(65)).toBe('bg-yellow-50 border-yellow-200')
    })

    it('should return green background for high compliance', () => {
      expect(getComplianceBgColor(90)).toBe('bg-green-50 border-green-200')
    })
  })

  describe('Edge cases', () => {
    it('should handle boundary values correctly', () => {
      // Boundary between low and medium
      expect(getComplianceLevel(49)).toBe('low')
      expect(getComplianceLevel(50)).toBe('medium')

      // Boundary between medium and high
      expect(getComplianceLevel(79)).toBe('medium')
      expect(getComplianceLevel(80)).toBe('high')
    })

    it('should handle extreme values', () => {
      expect(getComplianceLevel(-10)).toBe('low')
      expect(getComplianceLevel(0)).toBe('low')
      expect(getComplianceLevel(100)).toBe('high')
      expect(getComplianceLevel(150)).toBe('high')
    })
  })
})
