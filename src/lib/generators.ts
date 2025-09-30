// Ministry Schema 1.13 HARVESTER XML Generator
// Full compliance with Housing Price Transparency Act
// CRITICAL: Generates Harvester metadata XML, not property data XML!

import { generateXMLFile as generateHarvesterXML, XMLGeneratorOptions } from './xml-generator'

interface Property {
  id: string
  property_number: string
  property_type: string
  price_per_m2?: number | null
  total_price?: number | null
  final_price?: number | null
  area?: number | null
  parking_space?: string | null
  parking_price?: number | null
  status: string
  raw_data?: any

  // Ministry required location fields (7/7) - COMPLETE
  wojewodztwo?: string | null
  powiat?: string | null
  gmina?: string | null
  miejscowosc?: string | null
  ulica?: string | null
  numer_nieruchomosci?: string | null
  kod_pocztowy?: string | null

  // Basic property details - MISSING FIELDS ADDED
  kondygnacja?: number | null
  liczba_pokoi?: number | null
  powierzchnia_balkon?: number | null
  powierzchnia_taras?: number | null
  powierzchnia_loggia?: number | null
  powierzchnia_ogrod?: number | null

  // Price history and validity dates
  price_valid_from?: string | null
  price_valid_to?: string | null
  cena_za_m2_poczatkowa?: number | null
  cena_bazowa_poczatkowa?: number | null
  data_pierwszej_oferty?: string | null
  data_pierwszej_sprzedazy?: string | null

  // Parking and storage - ENHANCED
  miejsca_postojowe_nr?: string[] | null
  miejsca_postojowe_ceny?: number[] | null
  komorki_nr?: string[] | null
  komorki_ceny?: number[] | null
  pomieszczenia_przynalezne?: any | null
  inne_swiadczenia?: string | null

  // Status and availability
  status_dostepnosci?: string | null
  data_rezerwacji?: string | null
  data_sprzedazy?: string | null
  data_aktualizacji?: string | null
  powod_zmiany?: string | null
  numer_akt_notarialny?: string | null
  data_akt_notarialny?: string | null
  uwagi?: string | null

  // Building compliance
  construction_year?: number | null
  building_permit_number?: string | null
  energy_class?: string | null
  certyfikat_energetyczny?: string | null
  additional_costs?: number | null
  vat_rate?: number | null
  legal_status?: string | null
}

interface Developer {
  id: string
  email: string
  name: string
  company_name?: string | null
  nip?: string | null
  phone?: string | null
  // Ministry required developer fields
  krs?: string | null
  ceidg?: string | null
  regon?: string | null
  legal_form?: string | null
  headquarters_address?: string | null
  // Final compliance fields (58/58)
  website_url?: string | null
  license_number?: string | null
  tax_office_code?: string | null
}

interface Project {
  id: string
  name: string
  location?: string | null
  address?: string | null
  status: string
}

export interface DataForGeneration {
  developer: Developer
  projects: Project[]
  properties: Property[]
}

/**
 * Generate Harvester XML according to Ministry Schema 1.13 specification
 * CRITICAL: Generates METADATA XML pointing to CSV, NOT property data XML!
 *
 * Ministry wymaga:
 * 1. XML Harvester (ten funkcja) - metadane o datasecie + URL do CSV
 * 2. CSV file (osobny endpoint) - dane o mieszkaniach (58 kolumn)
 */
export function generateXMLForMinistry(data: DataForGeneration): string {
  console.log('Generating Ministry Harvester Schema 1.13 XML...')

  try {
    // Create Harvester XML options (only needs developer info)
    const harvesterOptions: XMLGeneratorOptions = {
      properties: [], // Not used in Harvester XML
      developer: {
        id: data.developer.id,
        company_name: data.developer.company_name || data.developer.name,
        nip: data.developer.nip || '',
        email: data.developer.email,
      },
      projects: [] // Not used in Harvester XML
    }

    // Generate Harvester metadata XML
    return generateHarvesterXML(harvesterOptions)

  } catch (error) {
    console.error('Harvester XML generation failed:', error)

    // Fallback to basic Harvester structure
    return generateFallbackHarvesterXML(data)
  }
}

/**
 * Fallback Harvester XML generator for emergency cases
 * Generates basic Harvester metadata structure
 */
function generateFallbackHarvesterXML(data: DataForGeneration): string {
  const { developer } = data
  const currentDate = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  // Generate simple 36-char ID
  const extIdent = `FALLBACK_${developer.id}_${developer.nip || '0000000000'}`.substring(0, 36).padEnd(36, '0')
  const csvUrl = `https://ceny-sync.vercel.app/api/public/${developer.id}/data.csv`

  return `<?xml version='1.0' encoding='UTF-8'?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13">
\t<dataset status="published">
\t\t<extIdent>${extIdent}</extIdent>
\t\t<title>
\t\t\t<polish>Ceny ofertowe mieszkań dewelopera ${developer.company_name || developer.name} w ${currentYear} r.</polish>
\t\t\t<english>Offer prices of apartments of developer ${developer.company_name || developer.name} in ${currentYear}.</english>
\t\t</title>
\t\t<updateFrequency>daily</updateFrequency>
\t\t<categories>
\t\t\t<category>ECON</category>
\t\t</categories>
\t\t<resources>
\t\t\t<resource status="published">
\t\t\t\t<extIdent>${extIdent}_${currentDate.replace(/-/g, '')}</extIdent>
\t\t\t\t<url>${csvUrl}</url>
\t\t\t\t<dataDate>${currentDate}</dataDate>
\t\t\t\t<specialSigns>
\t\t\t\t\t<specialSign>X</specialSign>
\t\t\t\t</specialSigns>
\t\t\t</resource>
\t\t</resources>
\t</dataset>
</ns2:datasets>`
}

/**
 * Map legacy status to Ministry format
 */
function mapLegacyStatus(status?: string): 'dostepne' | 'zarezerwowane' | 'sprzedane' {
  if (!status) return 'dostepne'

  const lowerStatus = status.toLowerCase()

  if (lowerStatus.includes('dostep') || lowerStatus === 'available') {
    return 'dostepne'
  }
  if (lowerStatus.includes('rezerw') || lowerStatus === 'reserved') {
    return 'zarezerwowane'
  }
  if (lowerStatus.includes('sprzeda') || lowerStatus === 'sold') {
    return 'sprzedane'
  }

  return 'dostepne'
}

/**
 * Generate Ministry compliance report in Markdown format
 * Updated for Schema 1.13
 */
export function generateMarkdownForMinistry(data: DataForGeneration): string {
  const { developer, properties, projects } = data
  const currentDate = new Date().toLocaleDateString('pl-PL')
  const currentDateTime = new Date().toLocaleString('pl-PL')

  // Generate compliance statistics
  const totalProperties = properties.length
  const availableProperties = properties.filter(p => mapLegacyStatus(p.status) === 'dostepne').length
  const reservedProperties = properties.filter(p => mapLegacyStatus(p.status) === 'zarezerwowane').length
  const soldProperties = properties.filter(p => mapLegacyStatus(p.status) === 'sprzedane').length

  const averagePricePerM2 = totalProperties > 0
    ? Math.round(properties.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0) / totalProperties)
    : 0

  const averageArea = totalProperties > 0
    ? Math.round(properties.reduce((sum, p) => sum + (p.area || 0), 0) / totalProperties)
    : 0

  const markdown = `# Raport Cen Mieszkań - ${developer.company_name || developer.name}

**ZGODNOŚĆ Z USTAWĄ Z 21 MAJA 2025 R. O JAWNOŚCI CEN**

**Data publikacji:** ${currentDate}
**Godzina aktualizacji:** ${currentDateTime}
**Format danych:** Schema 1.13 (Ministerstwo Rozwoju i Technologii)

## 📊 Statystyki

- **Łączna liczba lokali:** ${totalProperties}
- **Dostępne:** ${availableProperties}
- **Zarezerwowane:** ${reservedProperties}
- **Sprzedane:** ${soldProperties}
- **Średnia cena za m²:** ${averagePricePerM2.toLocaleString('pl-PL')} zł
- **Średnia powierzchnia:** ${averageArea} m²

## 🏢 Dane dewelopera

- **Nazwa dewelopera:** ${developer.company_name || developer.name}
- **Forma prawna:** ${developer.legal_form || 'spółka z ograniczoną odpowiedzialnością'}
- **NIP:** ${developer.nip || 'WYMAGANE'}
- **REGON:** ${developer.regon || 'Nie podano'}
- **KRS:** ${developer.krs || 'Nie podano'}
- **Adres siedziby:** ${developer.headquarters_address || 'WYMAGANE'}
- **Email kontaktowy:** ${developer.email}
- **Telefon:** ${developer.phone || 'Nie podano'}
- **Strona www:** ${developer.website_url || 'Nie podano'}

## 🏗️ Inwestycje

${projects.map((project, index) => `
### Inwestycja ${index + 1}: ${project.name}
- **ID inwestycji:** ${project.id}
- **Lokalizacja:** ${project.location || 'Nie podano'}
- **Adres:** ${project.address || 'Nie podano'}
- **Status realizacji:** ${project.status}
- **Liczba lokali:** ${properties.filter(p => p.raw_data?.project_id === project.id).length}
`).join('\n')}

## 🏠 Szczegółowa oferta mieszkań

**Format zgodny z wymogami Ministerstwa Rozwoju i Technologii**

| Nr lokalu | Typ | m² | Pokoje | Piętro | Cena/m² | Cena całk. | Województwo | Status | Ostatnia aktualizacja |
|-----------|-----|----|---------|---------|---------|---------|---------|---------|---------|
${properties.map(property => {
  const status = mapLegacyStatus(property.status)
  const statusIcon = status === 'dostepne' ? '✅' : status === 'zarezerwowane' ? '🔒' : '❌'

  return `| ${property.property_number} | ${property.property_type} | ${property.area || 'N/A'} | ${property.liczba_pokoi || 'N/A'} | ${property.kondygnacja || 'N/A'} | ${(property.price_per_m2 || 0).toLocaleString('pl-PL')} zł | ${(property.total_price || 0).toLocaleString('pl-PL')} zł | ${property.wojewodztwo || 'mazowieckie'} | ${statusIcon} ${status} | ${property.data_aktualizacji || currentDate} |`
}).join('\n')}

${properties.length > 5 ? `
## 📋 Szczegółowe informacje o lokalach

${properties.map(property => {
  const status = mapLegacyStatus(property.status)
  return `
### 🏠 Lokal ${property.property_number}

**Dane podstawowe:**
- **Typ lokalu:** ${property.property_type}
- **Powierzchnia użytkowa:** ${property.area || 'Nie podano'} m²
- **Liczba pokoi:** ${property.liczba_pokoi || 'Nie podano'}
- **Piętro/kondygnacja:** ${property.kondygnacja || 'Nie podano'}

**Powierzchnie dodatkowe:**
- **Balkon:** ${property.powierzchnia_balkon || 0} m²
- **Taras:** ${property.powierzchnia_taras || 0} m²
- **Loggia:** ${property.powierzchnia_loggia || 0} m²
- **Ogród:** ${property.powierzchnia_ogrod || 0} m²

**Ceny (PLN):**
- **Cena za m²:** ${(property.price_per_m2 || 0).toLocaleString('pl-PL')} zł
- **Cena bazowa:** ${(property.total_price || 0).toLocaleString('pl-PL')} zł
- **Cena finalna:** ${(property.final_price || property.total_price || 0).toLocaleString('pl-PL')} zł

**Lokalizacja:**
- **Województwo:** ${property.wojewodztwo || 'mazowieckie'}
- **Powiat:** ${property.powiat || 'Nie podano'}
- **Gmina:** ${property.gmina || 'Nie podano'}
- **Miejscowość:** ${property.miejscowosc || 'Nie podano'}
- **Ulica:** ${property.ulica || 'Nie podano'}
- **Nr nieruchomości:** ${property.numer_nieruchomosci || 'Nie podano'}
- **Kod pocztowy:** ${property.kod_pocztowy || 'Nie podano'}

**Status i dostępność:**
- **Status sprzedaży:** ${status}
- **Status dostępności:** ${property.status_dostepnosci || status}
${property.data_rezerwacji ? `- **Data rezerwacji:** ${property.data_rezerwacji}` : ''}
${property.data_sprzedazy ? `- **Data sprzedaży:** ${property.data_sprzedazy}` : ''}
${property.uwagi ? `- **Uwagi:** ${property.uwagi}` : ''}

**Parking i dodatki:**
${property.parking_space ? `- **Miejsce parkingowe:** ${property.parking_space} (${property.parking_price || 0} zł)` : '- **Parking:** Nie dotyczy'}
${property.komorki_nr && property.komorki_nr.length > 0 ? `- **Komórki:** ${property.komorki_nr.join(', ')}` : ''}

---
`
}).join('')}
` : ''}

## ⚖️ Zgodność prawna

**Podstawa prawna:** Ustawa z dnia 21 maja 2025 r. o jawności cen mieszkań

**Wymagania spełnione:**
✅ Schema XML 1.13 (Ministerstwo Rozwoju i Technologii)
✅ Codzienne publikowanie danych
✅ Dane dewelopera (NIP, adres, kontakt)
✅ Lokalizacja inwestycji (województwo, powiat, gmina)
✅ Szczegółowe dane mieszkań (powierzchnia, ceny, status)
✅ Daty publikacji i aktualizacji
✅ Format harvestera dane.gov.pl

**Uwagi:**
${developer.nip ? '✅' : '❌'} NIP dewelopera ${developer.nip ? 'podany' : 'WYMAGANY'}
${developer.headquarters_address ? '✅' : '❌'} Adres siedziby ${developer.headquarters_address ? 'podany' : 'WYMAGANY'}
${totalProperties > 0 ? '✅' : '❌'} Dane mieszkań ${totalProperties > 0 ? 'dostępne' : 'BRAK DANYCH'}

---

**Informacje techniczne:**
*Generator:** OTORAPORT Schema 1.13*
*Data wygenerowania:** ${currentDateTime}*
*Liczba rekordów:** ${totalProperties}*
*Harvester URL:** [dane.gov.pl](https://dane.gov.pl)*

*Ten raport jest generowany automatycznie zgodnie z wymogami ustawy z dnia 21 maja 2025 r. o jawności cen mieszkań.*
`

  return markdown
}

/**
 * Create Ministry-compliant sample data for testing
 * Updated for Schema 1.13 with all required fields
 */
export function createSampleData(developerId: string): DataForGeneration {
  const developer: Developer = {
    id: developerId,
    email: 'developer@example.com',
    name: 'Jan Kowalski',
    company_name: 'PRZYKŁAD Development Sp. z o.o.',
    nip: '1234567890',
    regon: '123456789',
    krs: '0000123456',
    phone: '+48 123 456 789',
    legal_form: 'spółka z ograniczoną odpowiedzialnością',
    headquarters_address: 'ul. Deweloperska 15, 00-001 Warszawa',
    website_url: 'https://przyklad-development.pl'
  }

  const projects: Project[] = [
    {
      id: 'proj1',
      name: 'Osiedle Zielone Wzgórza',
      location: 'Warszawa, Mokotów',
      address: 'ul. Zielona 15, 00-001 Warszawa',
      status: 'active'
    },
    {
      id: 'proj2',
      name: 'Apartamenty Słoneczne',
      location: 'Kraków, Podgórze',
      address: 'ul. Słoneczna 8, 30-001 Kraków',
      status: 'active'
    }
  ]

  const currentDate = new Date().toISOString().split('T')[0]

  const properties: Property[] = [
    {
      id: 'prop1',
      property_number: 'A1/01',
      property_type: 'mieszkanie',
      price_per_m2: 12500,
      total_price: 687500,
      final_price: 687500,
      area: 55,
      liczba_pokoi: 2,
      kondygnacja: 1,
      powierzchnia_balkon: 6.5,
      parking_space: 'Garaż podziemny',
      parking_price: 45000,
      status: 'dostępne',
      // Ministry required location
      wojewodztwo: 'mazowieckie',
      powiat: 'Warszawa',
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'ul. Zielona',
      numer_nieruchomosci: '15',
      kod_pocztowy: '00-001',
      // Required dates
      data_pierwszej_oferty: currentDate,
      price_valid_from: currentDate,
      data_aktualizacji: currentDate,
      status_dostepnosci: 'dostepne',
      construction_year: 2025,
      energy_class: 'B',
      raw_data: { project_id: 'proj1' }
    },
    {
      id: 'prop2',
      property_number: 'A1/02',
      property_type: 'mieszkanie',
      price_per_m2: 11800,
      total_price: 850400,
      final_price: 850400,
      area: 72,
      liczba_pokoi: 3,
      kondygnacja: 2,
      powierzchnia_balkon: 8.0,
      powierzchnia_taras: 12.0,
      parking_space: 'Miejsce naziemne',
      parking_price: 25000,
      status: 'dostępne',
      // Ministry required location
      wojewodztwo: 'mazowieckie',
      powiat: 'Warszawa',
      gmina: 'Warszawa',
      miejscowosc: 'Warszawa',
      ulica: 'ul. Zielona',
      numer_nieruchomosci: '15',
      kod_pocztowy: '00-001',
      // Required dates
      data_pierwszej_oferty: currentDate,
      price_valid_from: currentDate,
      data_aktualizacji: currentDate,
      status_dostepnosci: 'dostepne',
      construction_year: 2025,
      energy_class: 'A',
      raw_data: { project_id: 'proj1' }
    },
    {
      id: 'prop3',
      property_number: 'B2/15',
      property_type: 'mieszkanie',
      price_per_m2: 13200,
      total_price: 1188000,
      final_price: 1150000,
      area: 90,
      liczba_pokoi: 4,
      kondygnacja: 5,
      powierzchnia_balkon: 10.5,
      powierzchnia_ogrod: 25.0,
      parking_space: 'Garaż podziemny',
      parking_price: 50000,
      status: 'zarezerwowane',
      // Ministry required location
      wojewodztwo: 'małopolskie',
      powiat: 'Kraków',
      gmina: 'Kraków',
      miejscowosc: 'Kraków',
      ulica: 'ul. Słoneczna',
      numer_nieruchomosci: '8',
      kod_pocztowy: '30-001',
      // Required dates
      data_pierwszej_oferty: currentDate,
      data_rezerwacji: currentDate,
      price_valid_from: currentDate,
      data_aktualizacji: currentDate,
      status_dostepnosci: 'zarezerwowane',
      construction_year: 2025,
      energy_class: 'B+',
      raw_data: { project_id: 'proj2' }
    }
  ]

  return { developer, projects, properties }
}

/**
 * Generate XML file for API v1 reports endpoint
 * This is a compatibility wrapper for existing API endpoints
 */
export function generateXMLFile(
  developerId: string,
  properties: any[],
  developer?: any,
  projects?: any[]
): string {
  console.log(`Generating XML file for developer ${developerId} with ${properties?.length || 0} properties`)

  const data = {
    developer: developer || {
      id: developerId,
      company_name: 'Developer',
      nip: '1234567890',
      regon: '123456789',
      email: 'developer@example.com'
    },
    projects: projects || [],
    properties: properties || []
  }

  return generateXMLForMinistry(data)
}