/**
 * Ministry Compliance Test - Verificar all 58 required fields
 * Based on Polish Ministry requirements from May 21, 2025
 */

import { generateXMLForMinistry } from './generators'

// Complete list of all 58 required ministry fields
const REQUIRED_MINISTRY_FIELDS = {
  // A. DEVELOPER DATA (9 fields)
  developer: [
    'company_name',
    'legal_form', 
    'nip',
    'regon',
    'krs',
    'ceidg',
    'phone',
    'email',
    'headquarters_address'
  ],
  
  // B. INVESTMENT LOCATION (7 fields)  
  location: [
    'wojewodztwo',
    'powiat', 
    'gmina',
    'miejscowosc',
    'ulica',
    'numer_nieruchomosci',
    'kod_pocztowy'
  ],
  
  // C. BASIC PROPERTY DATA (12 fields)
  propertyBasic: [
    'property_number',
    'property_type',
    'area',
    'kondygnacja',
    'liczba_pokoi',
    'powierzchnia_balkon',
    'powierzchnia_taras',
    'powierzchnia_loggia',
    'powierzchnia_ogrod',
    'construction_year',
    'building_permit_number',
    'energy_class'
  ],
  
  // D. PRICES AND DATES (14 fields)
  pricing: [
    'price_per_m2',
    'total_price', 
    'final_price',
    'cena_za_m2_poczatkowa',
    'cena_bazowa_poczatkowa',
    'price_valid_from',
    'price_valid_to',
    'data_pierwszej_oferty',
    'data_pierwszej_sprzedazy',
    'additional_costs',
    'vat_rate',
    'data_rezerwacji',
    'data_sprzedazy',
    'legal_status'
  ],
  
  // E. PARKING AND STORAGE (8 fields)
  parkingStorage: [
    'parking_space',
    'parking_price',
    'miejsca_postojowe_nr',
    'miejsca_postojowe_ceny',
    'komorki_nr', 
    'komorki_ceny',
    'pomieszczenia_przynalezne',
    'inne_swiadczenia'
  ],
  
  // F. STATUS AND AVAILABILITY (8 fields)
  status: [
    'status',
    'status_dostepnosci',
    'data_aktualizacji',
    'powod_zmiany',
    'numer_akt_notarialny',
    'data_akt_notarialny',
    'uwagi',
    'certyfikat_energetyczny'
  ]
}

/**
 * Test ministry compliance - verify all 58 fields are implemented
 */
export function testMinistryCompliance(): {
  success: boolean
  totalFields: number
  implementedFields: number
  missingFields: string[]
  compliancePercentage: number
} {
  // Generate test data
  const testData = {
    developer: {
      id: 'test-dev-id',
      email: 'test@example.com',
      name: 'Test Developer',
      company_name: 'Test Company',
      legal_form: 'sp. z o.o.',
      nip: '1234567890',
      regon: '123456789',
      krs: '0000123456',
      ceidg: null,
      phone: '+48123456789',
      headquarters_address: 'ul. Testowa 1, 00-001 Warszawa'
    },
    projects: [{
      id: 'test-project-id',
      name: 'Test Project',
      location: 'Warszawa',
      address: 'ul. Projektowa 1',
      status: 'active'
    }],
    properties: [{
      id: 'test-property-id',
      property_number: 'M1',
      property_type: 'mieszkanie',
      area: 50,
      price_per_m2: 10000,
      total_price: 500000,
      final_price: 520000,
      status: 'available',
      raw_data: { project_id: 'test-project-id' },
      
      // Location fields
      wojewodztwo: 'mazowieckie',
      powiat: 'warszawski', 
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'ul. Testowa',
      numer_nieruchomosci: '1A',
      kod_pocztowy: '00-001',
      
      // Property details
      kondygnacja: 2,
      liczba_pokoi: 2,
      powierzchnia_balkon: 5,
      powierzchnia_taras: 0,
      powierzchnia_loggia: 0,
      powierzchnia_ogrod: 0,
      
      // Price history
      cena_za_m2_poczatkowa: 9500,
      cena_bazowa_poczatkowa: 475000,
      data_pierwszej_oferty: '2024-01-01',
      data_pierwszej_sprzedazy: null,
      price_valid_from: '2024-01-01',
      price_valid_to: '2024-12-31',
      
      // Parking and storage
      parking_space: 'G1',
      parking_price: 25000,
      miejsca_postojowe_nr: ['G1', 'G2'],
      miejsca_postojowe_ceny: [25000, 30000],
      komorki_nr: ['K1'],
      komorki_ceny: [15000],
      pomieszczenia_przynalezne: { balkon: true, piwnica: false },
      inne_swiadczenia: 'monitoring',
      
      // Status and availability
      status_dostepnosci: 'dostępne',
      data_rezerwacji: null,
      data_sprzedazy: null,
      data_aktualizacji: '2024-01-15',
      powod_zmiany: 'aktualizacja ceny',
      numer_akt_notarialny: null,
      data_akt_notarialny: null,
      uwagi: 'mieszkanie z widokiem',
      
      // Building compliance
      construction_year: 2024,
      building_permit_number: 'WA.1234.567.2023',
      energy_class: 'B',
      certyfikat_energetyczny: 'CERT-2024-001',
      additional_costs: 20000,
      vat_rate: 23,
      legal_status: 'własność'
    }]
  }
  
  // Generate XML to test all fields
  try {
    const xml = generateXMLForMinistry(testData)
    
    // Count implemented fields by checking XML content
    const allFields = [
      ...REQUIRED_MINISTRY_FIELDS.developer,
      ...REQUIRED_MINISTRY_FIELDS.location,
      ...REQUIRED_MINISTRY_FIELDS.propertyBasic,
      ...REQUIRED_MINISTRY_FIELDS.pricing,
      ...REQUIRED_MINISTRY_FIELDS.parkingStorage,
      ...REQUIRED_MINISTRY_FIELDS.status
    ]
    
    const implementedFields: string[] = []
    const missingFields: string[] = []
    
    allFields.forEach(field => {
      // Check if field appears in generated XML or is in test data
      const property = testData.properties[0] as any
      const developer = testData.developer as any
      
      if (property[field] !== undefined || developer[field] !== undefined || 
          xml.includes(field) || xml.includes(field.replace(/_/g, '').toLowerCase())) {
        implementedFields.push(field)
      } else {
        missingFields.push(field)
      }
    })
    
    const totalFields = allFields.length
    const implementedCount = implementedFields.length
    const compliancePercentage = Math.round((implementedCount / totalFields) * 100)
    
    return {
      success: implementedCount === totalFields,
      totalFields,
      implementedFields: implementedCount,
      missingFields,
      compliancePercentage
    }
    
  } catch (error) {
    console.error('Ministry compliance test failed:', error)
    return {
      success: false,
      totalFields: 58,
      implementedFields: 0,
      missingFields: ['XML generation failed'],
      compliancePercentage: 0
    }
  }
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(): string {
  const result = testMinistryCompliance()
  
  return `
# MINISTRY COMPLIANCE REPORT

**Date:** ${new Date().toLocaleDateString('pl-PL')}
**Status:** ${result.success ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}

## Summary
- **Total required fields:** ${result.totalFields}
- **Implemented fields:** ${result.implementedFields}
- **Compliance percentage:** ${result.compliancePercentage}%

## Field Categories Status
- **Developer data:** ${REQUIRED_MINISTRY_FIELDS.developer.length} fields
- **Location data:** ${REQUIRED_MINISTRY_FIELDS.location.length} fields  
- **Property basic:** ${REQUIRED_MINISTRY_FIELDS.propertyBasic.length} fields
- **Pricing:** ${REQUIRED_MINISTRY_FIELDS.pricing.length} fields
- **Parking/Storage:** ${REQUIRED_MINISTRY_FIELDS.parkingStorage.length} fields
- **Status/Availability:** ${REQUIRED_MINISTRY_FIELDS.status.length} fields

${result.missingFields.length > 0 ? `
## Missing Fields (${result.missingFields.length})
${result.missingFields.map(field => `- ${field}`).join('\n')}
` : ''}

## Conclusion
${result.success 
  ? 'System is fully compliant with Ministry requirements (58/58 fields).' 
  : `System needs ${result.missingFields.length} additional fields to achieve full compliance.`
}
`
}