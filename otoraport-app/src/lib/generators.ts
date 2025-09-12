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
}

interface Developer {
  id: string
  email: string
  name: string
  company_name?: string | null
  nip?: string | null
  phone?: string | null
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
  const { developer, properties } = data
  const currentDate = new Date().toISOString()
  const dateOnly = currentDate.split('T')[0]

  // Create dataset entries for each property
  const datasets = properties.map((property, index) => {
    const extIdent = `${dateOnly}-${property.id}`
    
    return `
    <dataset>
      <extIdent>${extIdent}</extIdent>
      <title>
        <polish>Mieszkanie ${property.property_number} - ${developer.company_name || developer.name}</polish>
        <english>Apartment ${property.property_number} - ${developer.company_name || developer.name}</english>
      </title>
      <description>
        <polish>Oferta sprzedaży nieruchomości mieszkaniowej nr ${property.property_number}</polish>
        <english>Residential property sale offer no. ${property.property_number}</english>
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
          <pricePerM2>${property.price_per_m2 || 0}</pricePerM2>
          <totalPrice>${property.total_price || 0}</totalPrice>
          <finalPrice>${property.final_price || property.total_price || 0}</finalPrice>
          <area>${property.area || 0}</area>
          <parkingSpace>${property.parking_space || 'Brak'}</parkingSpace>
          <parkingPrice>${property.parking_price || 0}</parkingPrice>
          <status>${property.status}</status>
          <lastUpdated>${currentDate}</lastUpdated>
        </propertyDetails>
        <developerDetails>
          <companyName>${developer.company_name || developer.name}</companyName>
          <nip>${developer.nip || ''}</nip>
          <contactEmail>${developer.email}</contactEmail>
          <contactPhone>${developer.phone || ''}</contactPhone>
        </developerDetails>
      </metadata>
    </dataset>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog xmlns="http://www.dane.gov.pl/schema/1.13" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.dane.gov.pl/schema/1.13 https://dane.gov.pl/schema/dataset-1.13.xsd">
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