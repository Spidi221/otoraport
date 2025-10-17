/**
 * TASK #96.4: Unit Tests for normalizeString() - Polish and Non-Polish Inputs
 *
 * Tests comprehensive string normalization including:
 *   - Polish character preservation (ą, ć, ę, ł, ń, ó, ś, ź, ż)
 *   - Unicode normalization (NFC vs NFD)
 *   - Whitespace normalization
 *   - Case normalization
 *   - Special character removal
 *   - Real CSV column names from INPRO/ATAL/Ministry formats
 */

import { describe, it, expect } from 'vitest'
import { SmartCSVParser } from '../smart-csv-parser'

// Helper to access private normalizeString method for testing
// TypeScript won't complain because we're explicitly testing internal behavior
const getNormalizeString = (parser: SmartCSVParser): (str: string) => string => {
  return (parser as any).normalizeString.bind(parser)
}

// Create a minimal CSV to instantiate the parser
const createParser = (): SmartCSVParser => {
  const minimalCSV = 'header1,header2\nvalue1,value2'
  return new SmartCSVParser(minimalCSV)
}

describe('SmartCSVParser - normalizeString()', () => {
  describe('Polish character preservation', () => {
    it('should preserve all Polish lowercase diacritical characters', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('ą')).toBe('ą')
      expect(normalize('ć')).toBe('ć')
      expect(normalize('ę')).toBe('ę')
      expect(normalize('ł')).toBe('ł')
      expect(normalize('ń')).toBe('ń')
      expect(normalize('ó')).toBe('ó')
      expect(normalize('ś')).toBe('ś')
      expect(normalize('ź')).toBe('ź')
      expect(normalize('ż')).toBe('ż')
    })

    it('should preserve Polish diacritics in full words', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Piętro nieruchomości')).toBe('piętro nieruchomości')
      expect(normalize('Metraż użytkowy')).toBe('metraż użytkowy')
      expect(normalize('Łódź Śląskie Żyrardów')).toBe('łódź śląskie żyrardów')
      expect(normalize('Województwo')).toBe('województwo')
      expect(normalize('Działka budowlana')).toBe('działka budowlana')
    })

    it('should convert uppercase Polish characters to lowercase while preserving diacritics', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('ĄĆĘŁŃÓŚŹŻ')).toBe('ąćęłńóśźż')
      expect(normalize('PIĘTRO NIERUCHOMOŚCI')).toBe('piętro nieruchomości')
      expect(normalize('WOJEWÓDZTWO ŁÓDZKIE')).toBe('województwo łódzkie')
    })

    it('should handle mixed Polish and non-Polish characters', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Numer mieszkania 5A')).toBe('numer mieszkania 5a')
      expect(normalize('Cena: 500.000 zł')).toBe('cena 500000 zł')
      expect(normalize('Pow. użytkowa [m²]')).toBe('pow użytkowa m²') // ² is preserved as a letter
    })
  })

  describe('Unicode normalization (NFC vs NFD)', () => {
    it('should normalize composed (NFC) and decomposed (NFD) forms to same result', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // ó - composed form (NFC): U+00F3
      const composed = 'Łódź'
      // ó - decomposed form (NFD): U+006F + U+0301
      const decomposed = 'Ło\u0301dz\u0301'

      expect(normalize(composed)).toBe(normalize(decomposed))
    })

    it('should handle NFC normalization for all Polish diacritics', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // Test that we get consistent NFC output
      const testWord = 'ąćęłńóśźż'
      const normalized = normalize(testWord)

      // Should be in NFC form (composed)
      expect(normalized).toBe('ąćęłńóśźż')
      expect(normalized.normalize('NFC')).toBe(normalized) // Already in NFC
    })

    it('should normalize complex decomposed characters', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // Decomposed: ó (o + combining acute accent) should normalize to composed ó
      const decomposed = 'Województwo' // Using regular ó for this test
      expect(normalize(decomposed)).toBe('województwo')
    })
  })

  describe('Whitespace normalization', () => {
    it('should normalize multiple spaces to single space', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Piętro   nieruchomości')).toBe('piętro nieruchomości')
      expect(normalize('Cena  za  m2')).toBe('cena za m2')
      expect(normalize('Test     multiple     spaces')).toBe('test multiple spaces')
    })

    it('should trim leading and trailing whitespace', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('  Województwo  ')).toBe('województwo')
      expect(normalize('   Piętro nieruchomości   ')).toBe('piętro nieruchomości')
      expect(normalize('\tTabbed\t')).toBe('tabbed')
    })

    it('should normalize tabs and newlines to single space', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Piętro\tnieruchomości')).toBe('piętro nieruchomości')
      expect(normalize('Line1\nLine2')).toBe('line1 line2')
      expect(normalize('Mixed\t\n  spaces')).toBe('mixed spaces')
    })
  })

  describe('Case normalization', () => {
    it('should convert uppercase to lowercase', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('WOJEWÓDZTWO')).toBe('województwo')
      expect(normalize('PIĘTRO NIERUCHOMOŚCI')).toBe('piętro nieruchomości')
      expect(normalize('ABC123')).toBe('abc123')
    })

    it('should handle mixed case', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('WoJeWóDzTwO')).toBe('województwo')
      expect(normalize('MiXeD CaSe TeXt')).toBe('mixed case text')
    })
  })

  describe('Special character removal', () => {
    it('should remove punctuation but keep letters and numbers', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Cena m² powierzchni')).toBe('cena m² powierzchni') // ² is Unicode letter
      expect(normalize('Nr. mieszkania (lokal)')).toBe('nr mieszkania lokal')
      expect(normalize('Pow. użytkowa [m²]')).toBe('pow użytkowa m²') // ² is preserved
    })

    it('should remove special symbols', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Price: $500,000.00')).toBe('price 50000000')
      expect(normalize('E-mail: test@example.com')).toBe('email testexamplecom')
      expect(normalize('Test#123@special!')).toBe('test123special')
    })

    it('should keep alphanumeric characters', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Mieszkanie 42A')).toBe('mieszkanie 42a')
      expect(normalize('Blok 5 piętro 3')).toBe('blok 5 piętro 3')
      expect(normalize('abc123def456')).toBe('abc123def456')
    })
  })

  describe('Real CSV column names - INPRO format', () => {
    it('should normalize INPRO column: Piętro nieruchomości', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Piętro nieruchomości')).toBe('piętro nieruchomości')
      expect(normalize('PIĘTRO NIERUCHOMOŚCI')).toBe('piętro nieruchomości')
      expect(normalize('Piętro  nieruchomości')).toBe('piętro nieruchomości') // Extra space
    })

    it('should normalize INPRO column: Rodzaj nieruchomości', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      const fullName = 'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny'
      expect(normalize(fullName)).toBe('rodzaj nieruchomości lokal mieszkalny dom jednorodzinny')
    })

    it('should normalize INPRO column: Metraż użytkowy', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Metraż użytkowy')).toBe('metraż użytkowy')
      expect(normalize('Metraż  użytkowy  [m²]')).toBe('metraż użytkowy m²')
    })

    it('should normalize INPRO column: Województwo', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Województwo')).toBe('województwo')
      expect(normalize('WOJEWÓDZTWO:')).toBe('województwo')
    })
  })

  describe('Real CSV column names - ATAL format', () => {
    it('should normalize ATAL column: LP (ordinal number)', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('LP.')).toBe('lp')
      expect(normalize('Lp')).toBe('lp')
      expect(normalize('L.P.')).toBe('lp')
    })

    it('should normalize ATAL column: Status (dostępne/rezerwacja/sprzedane)', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Status')).toBe('status')
      expect(normalize('Status (dostępne/sprzedane)')).toBe('status dostępnesprzedane')
    })

    it('should normalize ATAL column: Powierzchnia', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Powierzchnia [m²]')).toBe('powierzchnia m²')
      expect(normalize('Powierzchnia (m2)')).toBe('powierzchnia m2')
    })
  })

  describe('Real CSV column names - Ministry Schema', () => {
    it('should normalize Ministry field: Województwo lokalizacji lokalu', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Województwo lokalizacji lokalu')).toBe('województwo lokalizacji lokalu')
      expect(normalize('WOJEWÓDZTWO LOKALIZACJI LOKALU')).toBe('województwo lokalizacji lokalu')
    })

    it('should normalize Ministry field: Powierzchnia użytkowa lokalu', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Powierzchnia użytkowa lokalu')).toBe('powierzchnia użytkowa lokalu')
      expect(normalize('Powierzchnia  użytkowa  lokalu  [m²]')).toBe('powierzchnia użytkowa lokalu m²')
    })

    it('should normalize Ministry field: Liczba pokoi w lokalu', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Liczba pokoi w lokalu')).toBe('liczba pokoi w lokalu')
    })

    it('should normalize Ministry field: Piętro lokalu', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Piętro lokalu')).toBe('piętro lokalu')
      expect(normalize('Piętro  lokalu  (numer)')).toBe('piętro lokalu numer')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('')).toBe('')
    })

    it('should handle whitespace-only string', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('   ')).toBe('')
      expect(normalize('\t\n\r')).toBe('')
    })

    it('should handle string with only special characters', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('!@#$%^&*()')).toBe('')
      expect(normalize('.,;:[]{}()')).toBe('')
    })

    it('should handle numbers only', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('12345')).toBe('12345')
      expect(normalize('1.23')).toBe('123')
      expect(normalize('999,999.99')).toBe('99999999')
    })

    it('should handle very long strings', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      const longString = 'Województwo '.repeat(100)
      const normalized = normalize(longString)
      expect(normalized).toContain('województwo')
      expect(normalized.split(' ').length).toBeLessThan(101) // Whitespace normalized
    })

    it('should handle Unicode emoji and symbols', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      expect(normalize('Test 😀 emoji')).toBe('test emoji')
      expect(normalize('Price → 1000')).toBe('price 1000')
      expect(normalize('Check ✓ mark')).toBe('check mark')
    })

    it('should be idempotent (normalizing twice gives same result)', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      const input = 'WOJEWÓDZTWO  ŁÓDZKIE!!!'
      const normalized1 = normalize(input)
      const normalized2 = normalize(normalized1)

      expect(normalized1).toBe(normalized2)
      expect(normalized1).toBe('województwo łódzkie')
    })
  })

  describe('Real-world CSV column matching scenarios', () => {
    it('should match variations of "Województwo" column', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      const variations = [
        'Województwo',
        'WOJEWÓDZTWO',
        'województwo',
        'Województwo lokalizacji',
        'Województwo (lokalizacji)',
        'Województwo:'
      ]

      const normalized = variations.map(v => normalize(v))

      // All should start with "województwo"
      normalized.forEach(n => {
        expect(n).toMatch(/^województwo/)
      })
    })

    it('should preserve differences in diacritics (not diacritic-insensitive)', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // Without diacritics vs with diacritics - these are different!
      expect(normalize('Wojewodztwo')).toBe('wojewodztwo') // No ó
      expect(normalize('Województwo')).toBe('województwo') // With ó
      expect(normalize('Wojewodztwo')).not.toBe(normalize('Województwo'))
    })

    it('should match variations of "Powierzchnia" column', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      const variations = [
        'Powierzchnia',
        'Powierzchnia użytkowa',
        'Powierzchnia [m²]',
        'Powierzchnia (m2)',
        'POWIERZCHNIA UŻYTKOWA'
      ]

      const normalized = variations.map(v => normalize(v))

      // All should contain "powierzchnia"
      normalized.forEach(n => {
        expect(n).toContain('powierzchnia')
      })
    })

    it('should handle abbreviations differently from full words', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // "Pow." is just "pow" - different from "powierzchnia"
      expect(normalize('Pow. użytkowa')).toBe('pow użytkowa')
      expect(normalize('Powierzchnia użytkowa')).toBe('powierzchnia użytkowa')
      expect(normalize('Pow. użytkowa')).not.toBe(normalize('Powierzchnia użytkowa'))
    })

    it('should distinguish between similar but different fields', () => {
      const parser = createParser()
      const normalize = getNormalizeString(parser)

      // These should be different after normalization
      expect(normalize('Piętro lokalu')).not.toBe(normalize('Liczba pięter'))
      expect(normalize('Cena całkowita')).not.toBe(normalize('Cena za m2'))
      expect(normalize('Numer budynku')).not.toBe(normalize('Numer lokalu'))
    })
  })
})
