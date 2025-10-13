/**
 * Ministry Property Data XML Generator
 * Schema: urn:otwarte-dane:mieszkania:1.13
 *
 * CRITICAL: This generates PROPERTY DATA XML (58 fields), NOT harvester metadata!
 *
 * This is what the ministry requires for actual apartment pricing data.
 * Different from harvester XML which only contains metadata pointing to CSV.
 */

import { Database } from '@/types/database'

type Developer = Database['public']['Tables']['developers']['Row']
type Property = Database['public']['Tables']['properties']['Row']

export interface MinistryXMLOptions {
  developer: Developer
  properties: Property[]
}

/**
 * Generate Ministry Property Data XML according to Schema 1.13
 * Contains all 58 required fields for Housing Price Transparency Act
 */
export function generateMinistryDataXML(options: MinistryXMLOptions): string {
  const { developer, properties } = options
  const currentDate = new Date().toISOString().split('T')[0]

  console.log(`Generating Ministry Property Data XML for ${developer.company_name} with ${properties.length} properties`)

  // Start XML document
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>${escapeXml(currentDate)}</data_publikacji>
    <dostawca_danych>
      ${generateDeveloperSection(developer)}
    </dostawca_danych>
  </informacje_podstawowe>
  <oferty>
${properties.map(property => generatePropertyOffer(property, developer)).join('\n')}
  </oferty>
</dane_o_cenach_mieszkan>
`

  return xml
}

/**
 * Generate developer information section (Fields 1-26)
 * All developer-related fields from ministry requirements
 */
function generateDeveloperSection(developer: Developer): string {
  return `<nazwa>${escapeXml(developer.company_name || developer.name)}</nazwa>
      <forma_prawna>${escapeXml(developer.legal_form || 'spółka z ograniczoną odpowiedzialnością')}</forma_prawna>
      ${developer.krs ? `<nr_krs>${escapeXml(developer.krs)}</nr_krs>` : '<nr_krs>X</nr_krs>'}
      ${developer.ceidg ? `<nr_wpisu_ceidg>${escapeXml(developer.ceidg)}</nr_wpisu_ceidg>` : '<nr_wpisu_ceidg>X</nr_wpisu_ceidg>'}
      <nip>${escapeXml(developer.nip || '0000000000')}</nip>
      <regon>${escapeXml(developer.regon || '00000000000000')}</regon>
      <nr_telefonu>${escapeXml(developer.phone || 'X')}</nr_telefonu>
      <adres_email>${escapeXml(developer.email)}</adres_email>
      <nr_faxu>X</nr_faxu>
      <adres_strony_internetowej>${escapeXml(developer.website_url || 'X')}</adres_strony_internetowej>
      ${generateDeveloperAddress(developer, 'siedziba')}
      ${generateDeveloperAddress(developer, 'sprzedaz')}
      <dodatkowe_lokalizacje_sprzedazy>X</dodatkowe_lokalizacje_sprzedazy>
      <sposob_kontaktu>email, telefon</sposob_kontaktu>`
}

/**
 * Generate developer address (headquarters or sales location)
 * Fields: województwo, powiat, gmina, miejscowość, ulica, nr_nieruchomości, nr_lokalu, kod_pocztowy
 */
function generateDeveloperAddress(developer: Developer, addressType: 'siedziba' | 'sprzedaz'): string {
  // Parse headquarters_address if available, otherwise use defaults
  const address = parseDeveloperAddress(developer.headquarters_address)

  const prefix = addressType === 'siedziba' ? 'wojewodztwo_adresu_siedziby' : 'wojewodztwo_adresu_lokalu_sprzedazy'

  return `<${prefix}>${escapeXml(address.wojewodztwo)}</${prefix}>
      <powiat_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.powiat)}</powiat_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <gmina_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.gmina)}</gmina_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <miejscowosc_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.miejscowosc)}</miejscowosc_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <ulica_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.ulica)}</ulica_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <nr_nieruchomosci_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.nr_nieruchomosci)}</nr_nieruchomosci_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <nr_lokalu_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.nr_lokalu)}</nr_lokalu_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>
      <kod_pocztowy_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>${escapeXml(address.kod_pocztowy)}</kod_pocztowy_adresu_${addressType === 'siedziba' ? 'siedziby' : 'lokalu_sprzedazy'}>`
}

/**
 * Parse developer address string into components
 */
function parseDeveloperAddress(addressString: string | null): {
  wojewodztwo: string
  powiat: string
  gmina: string
  miejscowosc: string
  ulica: string
  nr_nieruchomosci: string
  nr_lokalu: string
  kod_pocztowy: string
} {
  if (!addressString) {
    return {
      wojewodztwo: 'mazowieckie',
      powiat: 'warszawski',
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'X',
      nr_nieruchomosci: 'X',
      nr_lokalu: 'X',
      kod_pocztowy: '00-000'
    }
  }

  // Simple parsing logic - can be enhanced
  const parts = addressString.split(',')
  const streetMatch = parts[0]?.match(/(.+?)\s+(\d+)(?:\/(\d+))?/)
  const postalMatch = addressString.match(/(\d{2}-\d{3})/)

  return {
    wojewodztwo: 'mazowieckie', // Default - should be stored separately
    powiat: 'warszawski',
    gmina: parts[1]?.trim() || 'Warszawa',
    miejscowosc: parts[1]?.trim() || 'Warszawa',
    ulica: streetMatch?.[1]?.trim() || 'X',
    nr_nieruchomosci: streetMatch?.[2] || 'X',
    nr_lokalu: streetMatch?.[3] || 'X',
    kod_pocztowy: postalMatch?.[1] || '00-000'
  }
}

/**
 * Generate single property offer (Fields 27-58)
 * All property-specific fields from ministry requirements
 */
function generatePropertyOffer(property: Property, developer: Developer): string {
  const currentDate = new Date().toISOString().split('T')[0]

  return `    <oferta>
      <!-- Property Location (Fields 27-33) -->
      <wojewodztwo_lokalizacji>${escapeXml(property.wojewodztwo || 'mazowieckie')}</wojewodztwo_lokalizacji>
      <powiat_lokalizacji>${escapeXml(property.powiat || 'warszawski')}</powiat_lokalizacji>
      <gmina_lokalizacji>${escapeXml(property.gmina || 'Warszawa')}</gmina_lokalizacji>
      <miejscowosc_lokalizacji>${escapeXml(property.miejscowosc || 'Warszawa')}</miejscowosc_lokalizacji>
      <ulica_lokalizacji>${escapeXml(property.ulica || 'X')}</ulica_lokalizacji>
      <nr_nieruchomosci_lokalizacji>${escapeXml(property.numer_nieruchomosci || 'X')}</nr_nieruchomosci_lokalizacji>
      <kod_pocztowy_lokalizacji>${escapeXml(property.kod_pocztowy || '00-000')}</kod_pocztowy_lokalizacji>

      <!-- Property Details (Fields 34-36) -->
      <rodzaj_nieruchomosci>${escapeXml(property.property_type || 'lokal mieszkalny')}</rodzaj_nieruchomosci>
      <nr_lokalu>${escapeXml(property.property_number)}</nr_lokalu>

      <!-- Pricing - Price per m2 (Fields 37-38) -->
      <cena_m2>${formatPrice(property.price_per_m2)}</cena_m2>
      <data_ceny_m2>${escapeXml(property.price_valid_from || currentDate)}</data_ceny_m2>

      <!-- Pricing - Base Price (Fields 39-40) -->
      <cena_bazowa>${formatPrice(property.total_price)}</cena_bazowa>
      <data_ceny_bazowej>${escapeXml(property.price_valid_from || currentDate)}</data_ceny_bazowej>

      <!-- Pricing - Final Price (Fields 41-42) -->
      <cena_calkowita>${formatPrice(property.final_price || property.total_price)}</cena_calkowita>
      <data_ceny_calkowitej>${escapeXml(property.price_valid_from || currentDate)}</data_ceny_calkowitej>

      <!-- Related Property Parts (Fields 43-46) -->
      ${generateRelatedParts(property)}

      <!-- Related Premises (Fields 47-50) -->
      ${generateRelatedPremises(property)}

      <!-- Necessary Rights (Fields 51-53) -->
      ${generateNecessaryRights(property)}

      <!-- Other Financial Obligations (Fields 54-56) -->
      ${generateOtherObligations(property)}

      <!-- Prospectus URL (Field 57) -->
      <adres_prospektu>${escapeXml(developer.website_url || 'X')}</adres_prospektu>

      <!-- Surface Area (Field 58) -->
      <powierzchnia_uzytkowa>${formatArea(property.area)}</powierzchnia_uzytkowa>
    </oferta>`
}

/**
 * Generate related property parts section (parking spaces, storage)
 * Fields 43-46: rodzaj_czesci, oznaczenie_czesci, cena_czesci, data_ceny_czesci
 */
function generateRelatedParts(property: Property): string {
  const currentDate = new Date().toISOString().split('T')[0]

  if (property.parking_space && property.parking_price) {
    return `<rodzaj_czesci>miejsce postojowe</rodzaj_czesci>
      <oznaczenie_czesci>${escapeXml(property.parking_space)}</oznaczenie_czesci>
      <cena_czesci>${formatPrice(property.parking_price)}</cena_czesci>
      <data_ceny_czesci>${escapeXml(property.price_valid_from || currentDate)}</data_ceny_czesci>`
  }

  return `<rodzaj_czesci>X</rodzaj_czesci>
      <oznaczenie_czesci>X</oznaczenie_czesci>
      <cena_czesci>X</cena_czesci>
      <data_ceny_czesci>X</data_ceny_czesci>`
}

/**
 * Generate related premises section (storage rooms, etc.)
 * Fields 47-50: rodzaj_pomieszczen, oznaczenie_pomieszczen, cena_pomieszczen, data_ceny_pomieszczen
 */
function generateRelatedPremises(property: Property): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Check for storage rooms (komórki)
  if (property.komorki_nr && property.komorki_nr.length > 0 && property.komorki_ceny && property.komorki_ceny.length > 0) {
    return `<rodzaj_pomieszczen>komórka lokatorska</rodzaj_pomieszczen>
      <oznaczenie_pomieszczen>${escapeXml(property.komorki_nr[0])}</oznaczenie_pomieszczen>
      <cena_pomieszczen>${formatPrice(property.komorki_ceny[0])}</cena_pomieszczen>
      <data_ceny_pomieszczen>${escapeXml(property.price_valid_from || currentDate)}</data_ceny_pomieszczen>`
  }

  return `<rodzaj_pomieszczen>X</rodzaj_pomieszczen>
      <oznaczenie_pomieszczen>X</oznaczenie_pomieszczen>
      <cena_pomieszczen>X</cena_pomieszczen>
      <data_ceny_pomieszczen>X</data_ceny_pomieszczen>`
}

/**
 * Generate necessary rights section
 * Fields 51-53: wyszczegolnienie_praw, wartosc_praw, data_wartosci_praw
 */
function generateNecessaryRights(property: Property): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Check if there are any additional rights
  if (property.inne_swiadczenia) {
    return `<wyszczegolnienie_praw>${escapeXml(property.inne_swiadczenia)}</wyszczegolnienie_praw>
      <wartosc_praw>1000</wartosc_praw>
      <data_wartosci_praw>${escapeXml(property.price_valid_from || currentDate)}</data_wartosci_praw>`
  }

  return `<wyszczegolnienie_praw>X</wyszczegolnienie_praw>
      <wartosc_praw>X</wartosc_praw>
      <data_wartosci_praw>X</data_wartosci_praw>`
}

/**
 * Generate other financial obligations section
 * Fields 54-56: wyszczegolnienie_innych_swiadczen, wartosc_innych_swiadczen, data_wartosci_innych_swiadczen
 */
function generateOtherObligations(property: Property): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Check for additional costs
  if (property.additional_costs && property.additional_costs > 0) {
    return `<wyszczegolnienie_innych_swiadczen>koszty dodatkowe</wyszczegolnienie_innych_swiadczen>
      <wartosc_innych_swiadczen>${formatPrice(property.additional_costs)}</wartosc_innych_swiadczen>
      <data_wartosci_innych_swiadczen>${escapeXml(property.price_valid_from || currentDate)}</data_wartosci_innych_swiadczen>`
  }

  return `<wyszczegolnienie_innych_swiadczen>X</wyszczegolnienie_innych_swiadczen>
      <wartosc_innych_swiadczen>X</wartosc_innych_swiadczen>
      <data_wartosci_innych_swiadczen>X</data_wartosci_innych_swiadczen>`
}

/**
 * Format price (handle null/undefined, format as integer)
 */
function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return 'X'
  }
  return Math.round(price).toString()
}

/**
 * Format area (handle null/undefined, format with 2 decimals)
 */
function formatArea(area: number | null | undefined): string {
  if (area === null || area === undefined) {
    return 'X'
  }
  return area.toFixed(2)
}

/**
 * Escape XML special characters
 */
function escapeXml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'X'
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value !== 'string') {
    return 'X'
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Validate ministry data XML compliance
 */
export function validateMinistryDataXML(options: MinistryXMLOptions): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const { developer, properties } = options
  const errors: string[] = []
  const warnings: string[] = []

  // Developer validation
  if (!developer.company_name && !developer.name) {
    errors.push('Brak nazwy dewelopera')
  }
  if (!developer.nip) {
    errors.push('Brak numeru NIP dewelopera (pole wymagane)')
  }
  if (!developer.regon) {
    warnings.push('Brak numeru REGON dewelopera (zalecane)')
  }
  if (!developer.email) {
    errors.push('Brak adresu email dewelopera')
  }

  // Properties validation
  if (properties.length === 0) {
    warnings.push('Brak ofert mieszkań do publikacji')
  }

  properties.forEach((property, index) => {
    if (!property.property_number) {
      errors.push(`Oferta ${index + 1}: Brak numeru lokalu`)
    }
    if (!property.area) {
      errors.push(`Oferta ${index + 1}: Brak powierzchni użytkowej`)
    }
    if (!property.price_per_m2 && !property.total_price) {
      errors.push(`Oferta ${index + 1}: Brak ceny (ani cena za m2, ani cena całkowita)`)
    }
    if (!property.wojewodztwo) {
      warnings.push(`Oferta ${index + 1}: Brak województwa lokalizacji`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generate sample ministry data for testing
 */
export function generateSampleMinistryData(): MinistryXMLOptions {
  const currentDate = new Date().toISOString().split('T')[0]

  const developer: Developer = {
    id: 'sample-dev-001',
    email: 'kontakt@przyklad-dev.pl',
    name: 'Jan Kowalski',
    company_name: 'PRZYKŁAD Development Sp. z o.o.',
    nip: '1234567890',
    regon: '123456789012',
    krs: '0000123456',
    ceidg: null,
    phone: '+48 123 456 789',
    legal_form: 'spółka z ograniczoną odpowiedzialnością',
    headquarters_address: 'ul. Deweloperska 15/2, 00-001 Warszawa',
    website_url: 'https://przyklad-development.pl',
    license_number: null,
    tax_office_code: null,
    subscription_plan: 'pro',
    subscription_status: 'active',
    subscription_end_date: null,
    ministry_approved: true,
    ministry_email_sent: true,
    presentation_url: null,
    presentation_generated_at: null,
    presentation_deployed_at: null,
    custom_domain: null,
    custom_domain_verified: false,
    created_at: currentDate,
    updated_at: currentDate
  }

  const properties: Property[] = [
    {
      id: 'prop-001',
      project_id: 'proj-001',
      property_number: 'A1/01',
      property_type: 'lokal mieszkalny',
      price_per_m2: 12500,
      total_price: 687500,
      final_price: 687500,
      area: 55.0,
      floor: 1,
      rooms: 2,
      building_number: 'A1',
      parking_space: 'Garaż G-01',
      parking_price: 45000,
      status: 'available',
      raw_data: null,
      wojewodztwo: 'mazowieckie',
      powiat: 'warszawski',
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'ul. Przykładowa',
      numer_nieruchomosci: '15',
      kod_pocztowy: '00-001',
      kondygnacja: 1,
      liczba_pokoi: 2,
      powierzchnia_balkon: 6.5,
      powierzchnia_taras: null,
      powierzchnia_loggia: null,
      powierzchnia_ogrod: null,
      price_valid_from: currentDate,
      price_valid_to: null,
      cena_za_m2_poczatkowa: 12500,
      cena_bazowa_poczatkowa: 687500,
      data_pierwszej_oferty: currentDate,
      data_pierwszej_sprzedazy: null,
      miejsca_postojowe_nr: ['G-01'],
      miejsca_postojowe_ceny: [45000],
      komorki_nr: null,
      komorki_ceny: null,
      pomieszczenia_przynalezne: null,
      inne_swiadczenia: null,
      status_dostepnosci: 'dostępne',
      data_rezerwacji: null,
      data_sprzedazy: null,
      data_aktualizacji: currentDate,
      powod_zmiany: null,
      numer_akt_notarialny: null,
      data_akt_notarialny: null,
      uwagi: null,
      construction_year: 2025,
      building_permit_number: null,
      energy_class: 'B',
      certyfikat_energetyczny: null,
      additional_costs: null,
      vat_rate: null,
      legal_status: null,
      created_at: currentDate,
      updated_at: currentDate
    }
  ]

  return { developer, properties }
}
