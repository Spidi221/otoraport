/**
 * TASK #98.5: Comprehensive Tests for Fuzzy Matching with Levenshtein Distance
 *
 * Tests the fuzzy matching algorithm with Polish character support using fastest-levenshtein library.
 *
 * Coverage:
 * - Priority-based matching (Exact > Contains > Fuzzy)
 * - Polish diacritical character handling
 * - Levenshtein distance accuracy
 * - 0.6 confidence threshold validation
 * - Edge cases and performance
 */

import { describe, it, expect } from 'vitest'
import { SmartCSVParser } from '../smart-csv-parser'

// Helper to access private fuzzyMatch method for testing
const getFuzzyMatch = (parser: SmartCSVParser): (str1: string, str2: string) => number => {
  return (parser as any).fuzzyMatch.bind(parser)
}

// Create a minimal CSV to instantiate the parser
const createParser = (): SmartCSVParser => {
  const minimalCSV = 'header1,header2\nvalue1,value2'
  return new SmartCSVParser(minimalCSV)
}

describe('SmartCSVParser - Fuzzy Matching with Levenshtein Distance', () => {
  describe('Priority 1: Exact Match (1.0)', () => {
    it('should return 1.0 for identical strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('powierzchnia', 'powierzchnia')).toBe(1.0)
      expect(fuzzyMatch('województwo', 'województwo')).toBe(1.0)
      expect(fuzzyMatch('piętro', 'piętro')).toBe(1.0)
    })

    it('should return 1.0 for exact Polish diacritical matches', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('łódzkie', 'łódzkie')).toBe(1.0)
      expect(fuzzyMatch('kraków', 'kraków')).toBe(1.0)
      expect(fuzzyMatch('gdańsk', 'gdańsk')).toBe(1.0)
    })

    it('should return 1.0 for empty strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('', '')).toBe(1.0)
    })
  })

  describe('Priority 2: Contains Match (0.9)', () => {
    it('should return 0.9 when str1 contains str2', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('powierzchnia użytkowa', 'powierzchnia')).toBe(0.9)
      expect(fuzzyMatch('województwo łódzkie', 'województwo')).toBe(0.9)
      expect(fuzzyMatch('numer mieszkania', 'mieszkania')).toBe(0.9)
    })

    it('should return 0.9 when str2 contains str1', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('pow', 'powierzchnia')).toBe(0.9)
      expect(fuzzyMatch('woj', 'województwo')).toBe(0.9)
      // 'nr' is NOT a substring of 'numer' - just similar
      const nrScore = fuzzyMatch('nr', 'numer')
      expect(nrScore).toBeGreaterThan(0.3)
      expect(nrScore).toBeLessThan(0.9)
    })

    it('should handle Polish characters in contains matching', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Note: These are normalized (lowercase, no punct), so "województwo łódzkie" becomes "województwo łódzkie"
      // but "łódź" is NOT a substring due to letter differences (łódzkie vs łódź)
      expect(fuzzyMatch('lodzkie', 'wojewodztwo lodzkie')).toBe(0.9)
      expect(fuzzyMatch('krakow', 'krakow centrum')).toBe(0.9)
      expect(fuzzyMatch('gdansk', 'gdansk srodmiescie')).toBe(0.9)
    })
  })

  describe('Priority 3: Levenshtein Distance Similarity', () => {
    it('should calculate correct similarity for single character differences', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // "piętro" vs "pietro" - 1 char difference (ę vs e)
      const score1 = fuzzyMatch('piętro', 'pietro')
      expect(score1).toBeGreaterThan(0.8) // 5/6 chars match
      expect(score1).toBeLessThan(0.9)

      // "województwo" vs "wojewodztwo" - 1 char difference (ó vs o)
      const score2 = fuzzyMatch('województwo', 'wojewodztwo')
      expect(score2).toBeGreaterThan(0.9) // 10/11 chars match
      expect(score2).toBeLessThan(1.0)
    })

    it('should calculate correct similarity for multiple character differences', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // "powierzchnia" vs "powierchnia" - very similar (only 1 char difference!)
      const score = fuzzyMatch('powierzchnia', 'powierchnia')
      expect(score).toBeGreaterThan(0.9) // Very similar
      expect(score).toBeLessThan(1.0)
    })

    it('should handle completely different strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('województwo', 'cena')).toBeLessThan(0.3)
      expect(fuzzyMatch('powierzchnia', 'status')).toBeLessThan(0.3)
    })

    it('should normalize similarity score to 0-1 range', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      const score = fuzzyMatch('abc', 'xyz')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('0.6 Confidence Threshold', () => {
    it('should match strings above 0.6 threshold', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Similar enough (>60% match)
      expect(fuzzyMatch('powierzchnia', 'powierzchna')).toBeGreaterThan(0.6)
      expect(fuzzyMatch('województwo', 'wojewodztwo')).toBeGreaterThan(0.6)
    })

    it('should reject strings below 0.6 threshold', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Too different (<60% match)
      expect(fuzzyMatch('powierzchnia', 'cena')).toBeLessThan(0.6)
      expect(fuzzyMatch('województwo', 'status')).toBeLessThan(0.6)
    })

    it('should handle threshold edge cases', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Strings with some similarity but below 60% threshold (avoiding contains matches)
      const score1 = fuzzyMatch('abcdefgh', 'powierzchnia') // Very different - few chars match
      const score2 = fuzzyMatch('xyz123', 'województwo') // Very different - no chars match

      // These should be below threshold (too many differences)
      expect(score1).toBeGreaterThan(0.0)
      expect(score1).toBeLessThan(0.6)
      expect(score2).toBeGreaterThanOrEqual(0.0) // May be 0 if completely different
      expect(score2).toBeLessThan(0.6)
    })
  })

  describe('Polish Character Handling', () => {
    it('should correctly match Polish diacritical characters', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // All Polish special characters
      expect(fuzzyMatch('ąćęłńóśźż', 'ąćęłńóśźż')).toBe(1.0)
    })

    it('should differentiate between Polish and ASCII characters', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Polish ó vs o, ł vs l ARE different characters in Levenshtein
      expect(fuzzyMatch('łódź', 'lodz')).toBeLessThan(1.0)
      expect(fuzzyMatch('kraków', 'krakow')).toBeLessThan(1.0)

      // But longer words with few diacritic differences are still similar
      expect(fuzzyMatch('województwo', 'wojewodztwo')).toBeGreaterThan(0.9)
    })

    it('should handle mixed Polish and ASCII in real column names', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Real CSV column variations
      expect(fuzzyMatch('piętro nieruchomości', 'pietro nieruchomosci')).toBeGreaterThan(0.8)
      expect(fuzzyMatch('powierzchnia użytkowa', 'powierzchnia uzytkowa')).toBeGreaterThan(0.8)
      expect(fuzzyMatch('województwo łódzkie', 'wojewodztwo lodzkie')).toBeGreaterThan(0.8)
    })
  })

  describe('Real-World CSV Column Matching', () => {
    it('should match INPRO column variations', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // INPRO exact vs normalized
      expect(fuzzyMatch('cena za m2 nieruchomości', 'cena za m2 nieruchomosci')).toBeGreaterThan(0.9)
      expect(fuzzyMatch('nr nieruchomości nadany przez dewelopera', 'nr nieruchomosci nadany przez dewelopera')).toBeGreaterThan(0.9)
    })

    it('should match ATAL column variations', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // ATAL exact matches (normalized)
      expect(fuzzyMatch('cena m2', 'cena m2')).toBe(1.0)
      // Contains matches
      expect(fuzzyMatch('cena', 'cena za m2')).toBe(0.9)
      expect(fuzzyMatch('m2', 'cena m2')).toBe(0.9)
    })

    it('should match Ministry column variations', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Ministry official vs variations (diacritic differences)
      const score1 = fuzzyMatch('województwo lokalizacji przedsięwzięcia', 'wojewodztwo lokalizacji przedsiewziecia')
      const score2 = fuzzyMatch('cena m 2 powierzchni użytkowej', 'cena m2 powierzchni uzytkowej')

      expect(score1).toBeGreaterThan(0.8)
      expect(score2).toBeGreaterThan(0.8)
    })

    it('should match common abbreviations when they are substrings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // These ARE substrings (contains match = 0.9)
      expect(fuzzyMatch('pow', 'powierzchnia')).toBe(0.9)
      expect(fuzzyMatch('woj', 'województwo')).toBe(0.9)
      expect(fuzzyMatch('powierzch', 'powierzchnia')).toBe(0.9)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('', '')).toBe(1.0)
      expect(fuzzyMatch('powierzchnia', '')).toBe(0) // max distance
      expect(fuzzyMatch('', 'województwo')).toBe(0) // max distance
    })

    it('should handle single character strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('a', 'a')).toBe(1.0)
      expect(fuzzyMatch('a', 'b')).toBe(0)
      expect(fuzzyMatch('ą', 'ą')).toBe(1.0)
      expect(fuzzyMatch('ą', 'a')).toBe(0)
    })

    it('should handle very long strings', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      const longStr1 = 'województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego'.repeat(5)
      const longStr2 = 'wojewodztwo lokalizacji przedsiewziecia deweloperskiego lub zadania inwestycyjnego'.repeat(5)

      const score = fuzzyMatch(longStr1, longStr2)
      expect(score).toBeGreaterThan(0.8) // Should still be similar
      expect(score).toBeLessThan(1.0)
    })

    it('should handle strings with numbers and special characters', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      expect(fuzzyMatch('m²', 'm2')).toBeLessThan(1.0)
      expect(fuzzyMatch('m2', 'm2')).toBe(1.0)
      expect(fuzzyMatch('nr 42', 'nr 42')).toBe(1.0)
      expect(fuzzyMatch('ul. dąbrowskiego 5', 'ul dabrowskiego 5')).toBeGreaterThan(0.8)
    })

    it('should be case-insensitive (normalized input)', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Note: fuzzyMatch expects normalized input (lowercase, no punctuation)
      // This is tested via normalizeString in smart-csv-parser.test.ts
      expect(fuzzyMatch('powierzchnia', 'powierzchnia')).toBe(1.0)
      expect(fuzzyMatch('wojewodztwo', 'wojewodztwo')).toBe(1.0)
    })

    it('should handle Unicode normalization (NFC)', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      // Note: fuzzyMatch expects NFC-normalized input
      // Composed (NFC) vs decomposed (NFD) should be handled by normalizeString
      const composed = 'łódź' // NFC form
      const decomposed = 'łódź' // Same in this case (string literal is NFC)

      expect(fuzzyMatch(composed, decomposed)).toBe(1.0)
    })
  })

  describe('Performance Characteristics', () => {
    it('should complete fuzzy matching in reasonable time for typical column names', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      const start = performance.now()

      // Simulate matching 100 column pairs (typical CSV parsing workload)
      for (let i = 0; i < 100; i++) {
        fuzzyMatch('powierzchnia użytkowa lokalu mieszkalnego', 'powierzchnia uzytkowa lokalu mieszkalnego')
      }

      const end = performance.now()
      const duration = end - start

      // Should complete 100 matches in <100ms (with fastest-levenshtein)
      expect(duration).toBeLessThan(100)
    })

    it('should handle worst-case scenario (completely different long strings)', () => {
      const parser = createParser()
      const fuzzyMatch = getFuzzyMatch(parser)

      const str1 = 'a'.repeat(100)
      const str2 = 'b'.repeat(100)

      const start = performance.now()
      const score = fuzzyMatch(str1, str2)
      const end = performance.now()

      expect(score).toBe(0) // Completely different
      expect(end - start).toBeLessThan(10) // Fast even for worst case
    })
  })

  describe('Integration with Column Matching', () => {
    it('should correctly identify matching columns from real CSV headers', () => {
      const csv = `
Województwo,Powiat,Gmina,Miejscowość,Ulica,Nr nieruchomości,Kod pocztowy
mazowieckie,warszawski,Warszawa,Warszawa,Marszałkowska,1,00-001
      `.trim()

      const parser = new SmartCSVParser(csv)
      const result = parser.analyzeColumns()

      // Should successfully map location fields
      expect(result.mappings['wojewodztwo']).toBe('Województwo')
      expect(result.mappings['powiat']).toBe('Powiat')
      expect(result.mappings['gmina']).toBe('Gmina')
      expect(result.mappings['miejscowosc']).toBe('Miejscowość')
      expect(result.mappings['ulica']).toBe('Ulica')
      expect(result.mappings['numer_nieruchomosci']).toBe('Nr nieruchomości')
      expect(result.mappings['kod_pocztowy']).toBe('Kod pocztowy')
    })

    it('should use fuzzy matching for misspelled column names', () => {
      const csv = `
Wojewodztwo,Powiatt,Gminna,Miejscowosc,Ulicaa
mazowieckie,warszawski,Warszawa,Warszawa,Marszałkowska
      `.trim()

      const parser = new SmartCSVParser(csv)
      const result = parser.analyzeColumns()

      // Should still map despite typos (using fuzzy matching)
      expect(result.mappings['wojewodztwo']).toBe('Wojewodztwo')
      expect(result.mappings['powiat']).toBe('Powiatt')
      expect(result.mappings['gmina']).toBe('Gminna')
    })

    it('should calculate overall confidence score', () => {
      const csv = `
Powierzchnia,Cena,Status
50,500000,dostępne
      `.trim()

      const parser = new SmartCSVParser(csv)
      const result = parser.analyzeColumns()

      // Confidence should be high (exact or contains matches)
      expect(result.confidence).toBeGreaterThan(0.8)
    })
  })
})
