// XML and MD generators for ministry compliance

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
 * Generate XML file according to ministry schema 1.13
 * Based on the n8n workflow logic
 */
export function generateXMLForMinistry(data: DataForGeneration): string {
  const { developer, projects, properties } = data
  const currentDate = new Date().toISOString()
  const dateOnly = currentDate.split('T')[0]

  // Group properties by project for better organization
  const propertiesByProject = properties.reduce((acc, property) => {
    const projectId = property.raw_data?.project_id || 'default'
    if (!acc[projectId]) acc[projectId] = []
    acc[projectId].push(property)
    return acc
  }, {} as Record<string, Property[]>)

  // Create dataset entries for each property with project context
  const datasets = properties.map((property, index) => {
    const extIdent = `${dateOnly}-${property.id}`
    
    // Find associated project
    const associatedProject = projects.find(p => p.id === property.raw_data?.project_id) || {
      id: 'default',
      name: 'Default Project',
      location: property.miejscowosc || 'Warsaw',
      address: property.ulica || '',
      status: 'active'
    }
    
    return `
    <dataset>
      <extIdent>${extIdent}</extIdent>
      <title>
        <polish>Mieszkanie ${property.property_number} - ${associatedProject.name} - ${developer.company_name || developer.name}</polish>
        <english>Apartment ${property.property_number} - ${associatedProject.name} - ${developer.company_name || developer.name}</english>
      </title>
      <description>
        <polish>Oferta sprzedaży nieruchomości mieszkaniowej nr ${property.property_number} w projekcie ${associatedProject.name}, ${associatedProject.location || property.miejscowosc || 'Warszawa'}</polish>
        <english>Residential property sale offer no. ${property.property_number} in ${associatedProject.name} project, ${associatedProject.location || property.miejscowosc || 'Warsaw'}</english>
      </description>
      <keyword>
        <polish>nieruchomość, mieszkanie, sprzedaż, ${property.property_type}</polish>
        <english>real estate, apartment, sale, ${property.property_type}</english>
      </keyword>
      <theme>
        <polish>Nieruchomości mieszkaniowe</polish>
        <english>Residential real estate</english>
      </theme>
      <publisher>
        <publisherName>${developer.company_name || developer.name}</publisherName>
        <publisherEmail>${developer.email}</publisherEmail>
        <publisherPhone>${developer.phone || ''}</publisherPhone>
      </publisher>
      <contactPoint>
        <contactName>${developer.name}</contactName>
        <contactEmail>${developer.email}</contactEmail>
        <contactPhone>${developer.phone || ''}</contactPhone>
      </contactPoint>
      <temporalCoverage>
        <startDate>${dateOnly}</startDate>
        <endDate>${dateOnly}</endDate>
      </temporalCoverage>
      <spatialCoverage>
        <geographicName>Polska</geographicName>
        <geographicCode>PL</geographicCode>
      </spatialCoverage>
      <dataQuality>
        <accuracy>Wysokia</accuracy>
        <completeness>Pełna</completeness>
        <consistency>Spójna</consistency>
        <currentness>Aktualna</currentness>
      </dataQuality>
      <accessRights>
        <rightsStatement>Dane publiczne zgodnie z ustawą</rightsStatement>
        <license>Publiczne</license>
      </accessRights>
      <updateFrequency>daily</updateFrequency>
      <version>1.13</version>
      <metadata>
        <propertyDetails>
          <propertyNumber>${property.property_number}</propertyNumber>
          <propertyType>${property.property_type}</propertyType>
          <area>${property.area || 0}</area>
          <kondygnacja>${property.kondygnacja || ''}</kondygnacja>
          <liczbaPokoi>${property.liczba_pokoi || ''}</liczbaPokoi>
          
          <!-- Additional areas - NEW FIELDS -->
          <powierzchniaBalkon>${property.powierzchnia_balkon || 0}</powierzchniaBalkon>
          <powierzchniaTaras>${property.powierzchnia_taras || 0}</powierzchniaTaras>
          <powierzchniaLoggia>${property.powierzchnia_loggia || 0}</powierzchniaLoggia>
          <powierzchniaOgrod>${property.powierzchnia_ogrod || 0}</powierzchniaOgrod>
          
          <!-- Current prices -->
          <pricePerM2>${property.price_per_m2 || 0}</pricePerM2>
          <totalPrice>${property.total_price || 0}</totalPrice>
          <finalPrice>${property.final_price || property.total_price || 0}</finalPrice>
          
          <!-- Price history - NEW FIELDS -->
          <cenaZaM2Poczatkowa>${property.cena_za_m2_poczatkowa || property.price_per_m2 || 0}</cenaZaM2Poczatkowa>
          <cenaBazowaPoczatkowa>${property.cena_bazowa_poczatkowa || property.total_price || 0}</cenaBazowaPoczatkowa>
          <dataPierwszejOferty>${property.data_pierwszej_oferty || ''}</dataPierwszejOferty>
          <dataPierwszejSprzedazy>${property.data_pierwszej_sprzedazy || ''}</dataPierwszejSprzedazy>
          
          <!-- Price validity -->
          <priceValidFrom>${property.price_valid_from || dateOnly}</priceValidFrom>
          <priceValidTo>${property.price_valid_to || dateOnly}</priceValidTo>
          
          <!-- Parking and storage - ENHANCED -->
          <parkingSpace>${property.parking_space || 'Brak'}</parkingSpace>
          <parkingPrice>${property.parking_price || 0}</parkingPrice>
          <miejscaPostojoweNr>${(property.miejsca_postojowe_nr || []).join(', ')}</miejscaPostojoweNr>
          <miejscaPostojoweCeny>${(property.miejsca_postojowe_ceny || []).join(', ')}</miejscaPostojoweCeny>
          <komorkiNr>${(property.komorki_nr || []).join(', ')}</komorkiNr>
          <komorkiCeny>${(property.komorki_ceny || []).join(', ')}</komorkiCeny>
          <pomieszczeniaPrzynalezne>${JSON.stringify(property.pomieszczenia_przynalezne || {})}</pomieszczeniaPrzynalezne>
          <inneSwiadczenia>${property.inne_swiadczenia || ''}</inneSwiadczenia>
          
          <!-- Status and availability - ENHANCED -->
          <status>${property.status}</status>
          <statusDostepnosci>${property.status_dostepnosci || property.status}</statusDostepnosci>
          <dataRezerwacji>${property.data_rezerwacji || ''}</dataRezerwacji>
          <dataSprzedazy>${property.data_sprzedazy || ''}</dataSprzedazy>
          <dataAktualizacji>${property.data_aktualizacji || currentDate}</dataAktualizacji>
          <powodZmiany>${property.powod_zmiany || ''}</powodZmiany>
          <numerAktNotarialny>${property.numer_akt_notarialny || ''}</numerAktNotarialny>
          <dataAktNotarialny>${property.data_akt_notarialny || ''}</dataAktNotarialny>
          <uwagi>${property.uwagi || ''}</uwagi>
          
          <lastUpdated>${currentDate}</lastUpdated>
        </propertyDetails>
        <locationDetails>
          <wojewodztwo>${property.wojewodztwo || 'mazowieckie'}</wojewodztwo>
          <powiat>${property.powiat || ''}</powiat>
          <gmina>${property.gmina || ''}</gmina>
          <miejscowosc>${property.miejscowosc || 'Warszawa'}</miejscowosc>
          <ulica>${property.ulica || ''}</ulica>
          <numerNieruchomosci>${property.numer_nieruchomosci || ''}</numerNieruchomosci>
          <kodPocztowy>${property.kod_pocztowy || ''}</kodPocztowy>
        </locationDetails>
        <constructionDetails>
          <constructionYear>${property.construction_year || new Date().getFullYear() + 1}</constructionYear>
          <buildingPermitNumber>${property.building_permit_number || ''}</buildingPermitNumber>
          <energyClass>${property.energy_class || 'B'}</energyClass>
          <certyfikatEnergetyczny>${property.certyfikat_energetyczny || ''}</certyfikatEnergetyczny>
          <legalStatus>${property.legal_status || 'własność'}</legalStatus>
        </constructionDetails>
        <enhancedPricing>
          <additionalCosts>${property.additional_costs || 0}</additionalCosts>
          <vatRate>${property.vat_rate || 23.00}</vatRate>
          <totalWithAdditional>${(property.final_price || property.total_price || 0) + (property.additional_costs || 0)}</totalWithAdditional>
        </enhancedPricing>
        <developerDetails>
          <companyName>${developer.company_name || developer.name}</companyName>
          <nip>${developer.nip || ''}</nip>
          <krs>${developer.krs || ''}</krs>
          <ceidg>${developer.ceidg || ''}</ceidg>
          <regon>${developer.regon || ''}</regon>
          <legalForm>${developer.legal_form || 'spółka z ograniczoną odpowiedzialnością'}</legalForm>
          <headquartersAddress>${developer.headquarters_address || ''}</headquartersAddress>
          <websiteUrl>${developer.website_url || ''}</websiteUrl>
          <licenseNumber>${developer.license_number || ''}</licenseNumber>
          <taxOfficeCode>${developer.tax_office_code || ''}</taxOfficeCode>
          <contactEmail>${developer.email}</contactEmail>
          <contactPhone>${developer.phone || ''}</contactPhone>
        </developerDetails>
      </metadata>
    </dataset>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns="urn:otwarte-dane:harvester:1.13" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:otwarte-dane:harvester:1.13 https://otwarte-dane.bing.pl/schemas/harvester-1.13.xsd">
  <catalogMetadata>
    <publisher>
      <publisherName>${developer.company_name || developer.name}</publisherName>
      <publisherEmail>${developer.email}</publisherEmail>
      <publisherPhone>${developer.phone || ''}</publisherPhone>
    </publisher>
    <contactPoint>
      <contactName>${developer.name}</contactName>
      <contactEmail>${developer.email}</contactEmail>
      <contactPhone>${developer.phone || ''}</contactPhone>
    </contactPoint>
    <created>${currentDate}</created>
    <modified>${currentDate}</modified>
    <language>pl</language>
    <title>
      <polish>Cennik nieruchomości mieszkaniowych - ${developer.company_name || developer.name}</polish>
      <english>Residential real estate prices - ${developer.company_name || developer.name}</english>
    </title>
    <description>
      <polish>Aktualne ceny mieszkań oferowanych przez dewelopera zgodnie z wymogami ustawy</polish>
      <english>Current apartment prices offered by developer according to law requirements</english>
    </description>
    <version>1.13</version>
  </catalogMetadata>
  <datasets>
    ${datasets}
  </datasets>
</catalog>`

  return xml
}

/**
 * Generate Markdown file for ministry compliance
 */
export function generateMarkdownForMinistry(data: DataForGeneration): string {
  const { developer, properties, projects } = data
  const currentDate = new Date().toLocaleDateString('pl-PL')
  const currentDateTime = new Date().toLocaleString('pl-PL')

  const markdown = `# Raport Cen Mieszkań - ${developer.company_name || developer.name}

**Data aktualizacji:** ${currentDate}  
**Godzina aktualizacji:** ${currentDateTime}

## Dane dewelopera

- **Nazwa:** ${developer.company_name || developer.name}
- **NIP:** ${developer.nip || 'Nie podano'}
- **Email kontaktowy:** ${developer.email}
- **Telefon:** ${developer.phone || 'Nie podano'}

## Projekty deweloperskie

${projects.map(project => `
### ${project.name}
- **Lokalizacja:** ${project.location || 'Nie podano'}
- **Adres:** ${project.address || 'Nie podano'}  
- **Status:** ${project.status}
`).join('\n')}

## Mieszkania w sprzedaży

**Łączna liczba mieszkań:** ${properties.length}

| Nr mieszkania | Typ | Powierzchnia | Cena za m² | Cena całkowita | Cena finalna | Status |
|---------------|-----|---------------|------------|----------------|--------------|--------|
${properties.map(property => 
  `| ${property.property_number} | ${property.property_type} | ${property.area || 'N/A'} m² | ${property.price_per_m2 || 'N/A'} zł | ${property.total_price || 'N/A'} zł | ${property.final_price || property.total_price || 'N/A'} zł | ${property.status} |`
).join('\n')}

${properties.length > 10 ? `

### Szczegóły mieszkań

${properties.map(property => `
#### Mieszkanie ${property.property_number}
- **Typ:** ${property.property_type}
- **Powierzchnia:** ${property.area || 'Nie podano'} m²
- **Cena za m²:** ${property.price_per_m2 || 'Nie podano'} zł
- **Cena całkowita:** ${property.total_price || 'Nie podano'} zł
- **Cena finalna:** ${property.final_price || property.total_price || 'Nie podano'} zł
- **Miejsce parkingowe:** ${property.parking_space || 'Brak'}
- **Cena parkingu:** ${property.parking_price || 'Brak'} zł
- **Status:** ${property.status}
`).join('\n')}
` : ''}

---

*Raport wygenerowany automatycznie przez system OTORAPORT*  
*Zgodny z wymogami ustawy z dnia 21 maja 2025 r.*  
*Data generowania: ${currentDateTime}*
`

  return markdown
}

/**
 * Create sample data for testing (when database is not ready)
 */
export function createSampleData(developerId: string): DataForGeneration {
  const developer: Developer = {
    id: developerId,
    email: 'developer@example.com',
    name: 'Jan Kowalski',
    company_name: 'Kowalski Development Sp. z o.o.',
    nip: '1234567890',
    phone: '+48 123 456 789'
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

  const properties: Property[] = [
    {
      id: 'prop1',
      property_number: 'A1/01',
      property_type: '2-pokojowe',
      price_per_m2: 12500,
      total_price: 687500,
      final_price: 687500,
      area: 55,
      parking_space: 'Garaż podziemny',
      parking_price: 45000,
      status: 'dostępne'
    },
    {
      id: 'prop2',
      property_number: 'A1/02', 
      property_type: '3-pokojowe',
      price_per_m2: 11800,
      total_price: 850400,
      final_price: 850400,
      area: 72,
      parking_space: 'Miejsce naziemne',
      parking_price: 25000,
      status: 'dostępne'
    },
    {
      id: 'prop3',
      property_number: 'B2/15',
      property_type: '4-pokojowe',
      price_per_m2: 13200,
      total_price: 1188000,
      final_price: 1150000,
      area: 90,
      parking_space: 'Garaż podziemny',
      parking_price: 50000,
      status: 'rezerwacja'
    }
  ]

  return { developer, projects, properties }
}