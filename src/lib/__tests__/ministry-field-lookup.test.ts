/**
 * TASK #88.4: Unit Tests for 3-Tier Ministry Field Lookup System
 *
 * Tests all tiers of the priority system:
 *   TIER 1: manual_overrides (highest priority)
 *   TIER 2: raw_csv_data (uploaded CSV data)
 *   TIER 3: properties/developers tables (database defaults)
 *   TIER 4: defaultValue (fallback)
 */

import { describe, it, expect } from 'vitest'
import { getMinistryFieldValue } from '../ministry-field-lookup'
import type { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

interface PropertyWithRawData extends Property {
  raw_csv_data: Array<{
    raw_data: Record<string, unknown>
    is_latest: boolean
  }>
}

// Mock property with all tiers populated
const createMockProperty = (overrides?: Partial<PropertyWithRawData>): PropertyWithRawData => ({
  id: 'test-property-id',
  developer_id: 'test-developer-id',
  apartment_number: 'A1',
  wojewodztwo: 'mazowieckie',
  powiat: 'warszawski',
  gmina: 'Warszawa',
  miejscowosc: 'Warszawa',
  ulica: 'ul. Testowa',
  numer_budynku: '10',
  kod_pocztowy: '00-001',
  cena: null,
  cena_m2: null,
  powierzchnia: null,
  liczba_pokoi: null,
  pietro: null,
  standard: null,
  status_sprzedazy: null,
  data_publikacji: null,
  manual_overrides: {},
  raw_csv_data: [],
  created_at: '2025-10-15T00:00:00Z',
  updated_at: '2025-10-15T00:00:00Z',
  deleted_at: null,
  ...overrides
})

// Mock developer
const createMockDeveloper = (overrides?: Partial<Developer>): Developer => ({
  id: 'test-developer-id',
  user_id: 'test-user-id',
  company_name: 'Test Developer Sp. z o.o.',
  email: 'test@developer.pl',
  wojewodztwo_siedziby: 'mazowieckie',
  telefon: '123456789',
  krs: '0000123456',
  nip: '1234567890',
  regon: '123456789',
  forma_prawna: 'Spółka z ograniczoną odpowiedzialnością',
  powiat_siedziby: null,
  gmina_siedziby: null,
  miejscowosc_siedziby: null,
  ulica_siedziby: null,
  numer_budynku_siedziby: null,
  numer_lokalu_siedziby: null,
  kod_pocztowy_siedziby: null,
  wojewodztwo_korespondencja: null,
  powiat_korespondencja: null,
  gmina_korespondencja: null,
  miejscowosc_korespondencja: null,
  ulica_korespondencja: null,
  numer_budynku_korespondencja: null,
  numer_lokalu_korespondencja: null,
  kod_pocztowy_korespondencja: null,
  czy_korespondencja_rowna_siedzibie: null,
  numer_faxu: null,
  www: null,
  created_at: '2025-10-15T00:00:00Z',
  updated_at: '2025-10-15T00:00:00Z',
  ...overrides
})

describe('getMinistryFieldValue - 3-Tier Priority System', () => {
  describe('TIER 1: manual_overrides (highest priority)', () => {
    it('should return value from manual_overrides when using ministry field name', () => {
      const property = createMockProperty({
        manual_overrides: {
          'Województwo lokalizacji lokalu': 'wielkopolskie'
        },
        wojewodztwo: 'mazowieckie', // DB value (should be ignored)
        raw_csv_data: [{
          raw_data: { 'Województwo lokalizacji lokalu': 'pomorskie' }, // CSV value (should be ignored)
          is_latest: true
        }]
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('wielkopolskie')
    })

    it('should return value from manual_overrides when using internal field name', () => {
      const property = createMockProperty({
        manual_overrides: {
          wojewodztwo: 'wielkopolskie'
        },
        wojewodztwo: 'mazowieckie', // DB value (should be ignored)
        raw_csv_data: [{
          raw_data: { 'Województwo lokalizacji lokalu': 'pomorskie' }, // CSV value (should be ignored)
          is_latest: true
        }]
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('wielkopolskie')
    })

    it('should prioritize ministry field name over internal field name in manual_overrides', () => {
      const property = createMockProperty({
        manual_overrides: {
          'Województwo lokalizacji lokalu': 'wielkopolskie', // Ministry name (should be used)
          wojewodztwo: 'lubelskie' // Internal name (should be ignored)
        }
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('wielkopolskie')
    })

    it('should handle null manual_overrides', () => {
      const property = createMockProperty({
        manual_overrides: null,
        wojewodztwo: 'mazowieckie'
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('mazowieckie') // Should fall through to TIER 3
    })

    it('should skip empty string values in manual_overrides', () => {
      const property = createMockProperty({
        manual_overrides: {
          wojewodztwo: '' // Empty string (should be ignored)
        },
        wojewodztwo: 'mazowieckie' // DB value (should be used)
      })

      const result = getMinistryFieldValue(property, '', 'wojewodztwo')
      expect(result).toBe('mazowieckie')
    })
  })

  describe('TIER 2: raw_csv_data (uploaded CSV)', () => {
    it('should return value from raw_csv_data using ministry field name', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: { 'Województwo lokalizacji lokalu': 'pomorskie' },
          is_latest: true
        }],
        wojewodztwo: 'mazowieckie' // DB value (should be ignored)
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('pomorskie')
    })

    it('should use COLUMN_PATTERNS fuzzy matching when exact ministry field name not found', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: {
            'Województwo': 'pomorskie' // Short version (should match via COLUMN_PATTERNS)
          },
          is_latest: true
        }],
        wojewodztwo: 'mazowieckie' // DB value (should be ignored)
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('pomorskie')
    })

    it('should handle case-insensitive column matching', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: {
            'WOJEWÓDZTWO LOKALIZACJI LOKALU': 'pomorskie' // Uppercase
          },
          is_latest: true
        }]
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('pomorskie')
    })

    it('should handle diacritic-insensitive column matching', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: {
            'Wojewodztwo lokalizacji lokalu': 'pomorskie' // No Polish diacritics
          },
          is_latest: true
        }]
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('pomorskie')
    })

    it('should skip empty string values in raw_csv_data', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: {
            'Województwo lokalizacji lokalu': '' // Empty string (should be ignored)
          },
          is_latest: true
        }],
        wojewodztwo: 'mazowieckie' // DB value (should be used)
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('mazowieckie')
    })

    it('should handle empty raw_csv_data array', () => {
      const property = createMockProperty({
        raw_csv_data: [],
        wojewodztwo: 'mazowieckie'
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('mazowieckie') // Should fall through to TIER 3
    })
  })

  describe('TIER 3: Database tables (properties/developers)', () => {
    it('should return developer field from developer object', () => {
      const property = createMockProperty()
      const developer = createMockDeveloper({
        company_name: 'ACME Developer Sp. z o.o.'
      })

      const result = getMinistryFieldValue(property, 'Nazwa dewelopera', 'company_name', developer)
      expect(result).toBe('ACME Developer Sp. z o.o.')
    })

    it('should return property field from property object', () => {
      const property = createMockProperty({
        wojewodztwo: 'mazowieckie'
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo')
      expect(result).toBe('mazowieckie')
    })

    it('should prioritize developer object for developer-level fields', () => {
      const property = createMockProperty()
      const developer = createMockDeveloper({
        email: 'developer@company.pl'
      })

      const result = getMinistryFieldValue(property, 'Adres poczty elektronicznej', 'email', developer)
      expect(result).toBe('developer@company.pl')
    })

    it('should skip null values in database fields', () => {
      const property = createMockProperty({
        cena: null
      })

      const result = getMinistryFieldValue(property, 'Cena', 'cena', undefined, 'DEFAULT')
      expect(result).toBe('DEFAULT') // Should fall through to TIER 4
    })

    it('should convert database values to string', () => {
      const property = createMockProperty({
        powierzchnia: 65.5 as any
      })

      const result = getMinistryFieldValue(property, 'Powierzchnia użytkowa', 'powierzchnia')
      expect(result).toBe('65.5')
    })
  })

  describe('TIER 4: Default value (fallback)', () => {
    it('should return default value when all tiers are empty', () => {
      const property = createMockProperty()

      const result = getMinistryFieldValue(property, '', 'nonexistent_field', undefined, 'FALLBACK_VALUE')
      expect(result).toBe('FALLBACK_VALUE')
    })

    it('should return empty string when no default provided', () => {
      const property = createMockProperty()

      const result = getMinistryFieldValue(property, '', 'nonexistent_field')
      expect(result).toBe('')
    })

    it('should return default value for missing ministry field', () => {
      const property = createMockProperty()

      const result = getMinistryFieldValue(property, 'Nieistniejące pole', '', undefined, 'N/A')
      expect(result).toBe('N/A')
    })
  })

  describe('Priority order validation', () => {
    it('should respect complete priority order: manual_overrides > raw_csv_data > database > default', () => {
      const property = createMockProperty({
        manual_overrides: {
          wojewodztwo: 'TIER1' // Highest priority
        },
        raw_csv_data: [{
          raw_data: { 'Województwo lokalizacji lokalu': 'TIER2' },
          is_latest: true
        }],
        wojewodztwo: 'TIER3' // Database
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo', undefined, 'TIER4')
      expect(result).toBe('TIER1')
    })

    it('should use TIER2 when TIER1 is empty', () => {
      const property = createMockProperty({
        manual_overrides: {}, // Empty
        raw_csv_data: [{
          raw_data: { 'Województwo lokalizacji lokalu': 'TIER2' },
          is_latest: true
        }],
        wojewodztwo: 'TIER3'
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo', undefined, 'TIER4')
      expect(result).toBe('TIER2')
    })

    it('should use TIER3 when TIER1 and TIER2 are empty', () => {
      const property = createMockProperty({
        manual_overrides: {},
        raw_csv_data: [],
        wojewodztwo: 'TIER3'
      })

      const result = getMinistryFieldValue(property, 'Województwo lokalizacji lokalu', 'wojewodztwo', undefined, 'TIER4')
      expect(result).toBe('TIER3')
    })

    it('should use TIER4 when all other tiers are empty', () => {
      const property = createMockProperty({
        manual_overrides: {},
        raw_csv_data: []
      })

      const result = getMinistryFieldValue(property, '', 'nonexistent', undefined, 'TIER4')
      expect(result).toBe('TIER4')
    })
  })

  describe('Edge cases', () => {
    it('should handle numeric values', () => {
      const property = createMockProperty({
        manual_overrides: {
          cena: 500000
        }
      })

      const result = getMinistryFieldValue(property, 'Cena', 'cena')
      expect(result).toBe('500000')
    })

    it('should handle boolean values', () => {
      const property = createMockProperty({
        manual_overrides: {
          czy_korespondencja_rowna_siedzibie: true
        }
      })

      const result = getMinistryFieldValue(property, '', 'czy_korespondencja_rowna_siedzibie')
      expect(result).toBe('true')
    })

    it('should handle date values', () => {
      const property = createMockProperty({
        data_publikacji: '2025-10-15' as any
      })

      const result = getMinistryFieldValue(property, 'Data publikacji', 'data_publikacji')
      expect(result).toBe('2025-10-15')
    })

    it('should handle fields with only ministry name provided', () => {
      const property = createMockProperty({
        raw_csv_data: [{
          raw_data: { 'Cena': '500000' },
          is_latest: true
        }]
      })

      const result = getMinistryFieldValue(property, 'Cena', '')
      expect(result).toBe('500000')
    })

    it('should handle fields with only internal name provided', () => {
      const property = createMockProperty({
        wojewodztwo: 'mazowieckie'
      })

      const result = getMinistryFieldValue(property, '', 'wojewodztwo')
      expect(result).toBe('mazowieckie')
    })

    it('should handle undefined developer parameter', () => {
      const property = createMockProperty({
        wojewodztwo: 'mazowieckie'
      })

      const result = getMinistryFieldValue(property, '', 'wojewodztwo', undefined)
      expect(result).toBe('mazowieckie')
    })
  })
})
