// Generator plików Markdown dla ministerstwa
// Czytelna alternatywa dla XML

import { XMLGeneratorOptions } from './xml-generator';

// MINISTRY CSV EXACT COLUMN NAMES (from schema 1.13)
const MINISTRY_COLUMNS = {
  property_number: 'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',
  price_per_m2: 'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]',
  total_price: 'Cena lokalu mieszkalnego lub domu jednorodzinnego [zł]',
  powierzchnia: 'Powierzchnia użytkowa lokalu mieszkalnego lub powierzchnia domu jednorodzinnego [m2]',
  wojewodztwo: 'Województwo - Lokalizacja Inwestycji mieszkaniowej',
  liczba_pokoi: 'Liczba pokoi w lokalu mieszkalnym lub domu jednorodzinnym',
  parking_nr: 'Nr przypisanego miejsca parkingowego / garażu [1]',
  parking_cena: 'Cena przypisanego miejsca parkingowego / garażu [1]',
}

// CRITICAL FIX: Extract fields from nested raw_data JSONB structure
// CSV parser stores: { raw_data: { property_number: X, raw_data: { "CSV Column": value } } }
function extractFromRawData(property: any): any {
  const rawData = (property.raw_data as any) || {}
  const nestedData = rawData.raw_data || rawData // Use nested if exists, otherwise top level

  // Helper: Get value from raw_data with fallback to nested raw_data and top-level
  const getRawField = (field: string, aliases: string[] = [], convertToNumber: boolean = false): any => {
    // Check all possible variations
    for (const alias of [field, ...aliases]) {
      // 1. Check nested data first (ministry CSV columns)
      if (nestedData[alias] !== undefined && nestedData[alias] !== null && nestedData[alias] !== '') {
        const value = nestedData[alias]
        // FILTER SOLD: If value is "X", mark as sold
        if (typeof value === 'string' && value.trim().toLowerCase() === 'x') {
          return 'SOLD'
        }
        // Convert to number if requested
        if (convertToNumber && typeof value === 'string') {
          const parsed = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
          return isNaN(parsed) ? 0 : parsed
        }
        if (convertToNumber && typeof value === 'number') {
          return value
        }
        return value
      }
      // 2. Fallback: check top-level rawData (CSV parser calculated fields like area)
      if (rawData[alias] !== undefined && rawData[alias] !== null && rawData[alias] !== '') {
        const value = rawData[alias]
        // FILTER SOLD: If value is "X", mark as sold
        if (typeof value === 'string' && value.trim().toLowerCase() === 'x') {
          return 'SOLD'
        }
        // Convert to number if requested
        if (convertToNumber && typeof value === 'string') {
          const parsed = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''))
          return isNaN(parsed) ? 0 : parsed
        }
        if (convertToNumber && typeof value === 'number') {
          return value
        }
        return value
      }
    }
    return convertToNumber ? 0 : 'N/A'
  }

  return {
    id: property.id,
    project_id: property.project_id,
    property_number: getRawField('property_number', [
      MINISTRY_COLUMNS.property_number,
      'apartment_number', 'numer_lokalu'
    ], false),
    property_type: getRawField('property_type', ['typ', 'type'], false) || 'mieszkanie',
    area: getRawField('area', [
      MINISTRY_COLUMNS.powierzchnia,
      'surface_area', 'powierzchnia', 'metraz'
    ], true),
    price_per_m2: getRawField('price_per_m2', [
      MINISTRY_COLUMNS.price_per_m2,
      'cena_za_m2', 'cena za m2'
    ], true),
    base_price: getRawField('base_price', [
      MINISTRY_COLUMNS.total_price,
      'total_price', 'cena', 'cena_bazowa'
    ], true),
    final_price: getRawField('final_price', [
      MINISTRY_COLUMNS.total_price,
      'cena_finalna'
    ], true),
    // SMART STATUS DETECTION: Check prices for SOLD markers, then status field
    status: (() => {
      // 1. Check if price fields indicate SOLD
      const pricePerM2 = getRawField('price_per_m2', [MINISTRY_COLUMNS.price_per_m2], false)
      const basePrice = getRawField('base_price', [MINISTRY_COLUMNS.total_price], false)

      if (pricePerM2 === 'SOLD' || pricePerM2 === 'X' ||
          basePrice === 'SOLD' || basePrice === 'X') {
        return 'sold'
      }

      // 2. Check status field if exists
      const statusField = getRawField('status', ['status_sprzedazy', 'dostępność', 'availability'], false)
      if (statusField) {
        const statusLower = String(statusField).toLowerCase()
        if (statusLower.includes('sprzed') || statusLower.includes('sold')) return 'sold'
        if (statusLower.includes('rezerw') || statusLower.includes('reserved')) return 'reserved'
        if (statusLower.includes('dostęp') || statusLower.includes('available')) return 'available'
      }

      // 3. Default to available if has valid price
      return 'available'
    })(),
    parking_space: getRawField('parking_space', [
      MINISTRY_COLUMNS.parking_nr,
      'miejsca_postojowe_nr'
    ], false),
    parking_price: getRawField('parking_price', [
      MINISTRY_COLUMNS.parking_cena,
      'miejsca_postojowe_ceny'
    ], true),
  }
}

export function generateMarkdownFile(options: XMLGeneratorOptions): string {
  const { properties: rawProperties, developer, projects } = options;

  console.log('🔍 MD GENERATOR: Starting generation with', rawProperties.length, 'raw properties')
  console.log('🔍 MD GENERATOR: First raw property:', JSON.stringify(rawProperties[0], null, 2))

  // CRITICAL FIX: Extract data from raw_data JSONB using same logic as XML generator
  const properties = rawProperties.map(extractFromRawData)

  console.log('🔍 MD GENERATOR: After extraction, got', properties.length, 'properties')
  console.log('🔍 MD GENERATOR: First extracted property:', JSON.stringify(properties[0], null, 2))

  const currentDate = new Date().toLocaleDateString('pl-PL');
  const currentYear = new Date().getFullYear();

  // Grupowanie nieruchomości per projekt
  const propertiesByProject = properties.reduce((acc, property) => {
    const project = projects.find(p => p.id === property.project_id);
    const projectName = project?.name || 'Nieznany projekt';

    if (!acc[projectName]) {
      acc[projectName] = {
        project: project,
        properties: []
      };
    }
    acc[projectName].properties.push(property);
    return acc;
  }, {} as Record<string, { project: any, properties: typeof properties }>);

  // IMPROVED FILTERING: Exclude SOLD properties and ensure numeric values
  console.log('🔍 MD GENERATOR: Before filter - properties:', properties.length)
  properties.forEach((p, i) => {
    console.log(`Property ${i}: price_per_m2=${p.price_per_m2}, area=${p.area}, status=${p.status}, valid=${typeof p.price_per_m2 === 'number' && typeof p.area === 'number' && p.status !== 'sold'}`)
  })

  // Filter: Only numeric prices, valid area, not SOLD
  const validProperties = properties.filter(p => {
    const hasNumericPrice = typeof p.price_per_m2 === 'number' && p.price_per_m2 > 0
    const hasValidArea = typeof p.area === 'number' && p.area > 0
    const isNotSold = p.status !== 'sold'

    return hasNumericPrice && hasValidArea && isNotSold
  })
  console.log('🔍 MD GENERATOR: After filter - validProperties:', validProperties.length)

  // Count all properties including SOLD (for total statistics)
  const allPropertiesWithStatus = properties.filter(p =>
    (typeof p.price_per_m2 === 'number' && p.price_per_m2 > 0) || p.status === 'sold'
  )
  const totalProperties = allPropertiesWithStatus.length
  const availableProperties = allPropertiesWithStatus.filter(p => p.status === 'available').length
  const soldProperties = allPropertiesWithStatus.filter(p => p.status === 'sold').length
  const reservedProperties = allPropertiesWithStatus.filter(p => p.status === 'reserved').length

  // Price statistics: ONLY from available properties (not SOLD)
  const numericPrices = validProperties
    .map(p => p.price_per_m2)
    .filter(price => typeof price === 'number' && price > 0)

  const averagePrice = numericPrices.length > 0
    ? numericPrices.reduce((sum, p) => sum + p, 0) / numericPrices.length
    : 0
  const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : 0
  const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : 0

  const markdown = `# Raport Cen Mieszkań - ${developer.company_name}

**Data aktualizacji:** ${currentDate}  
**Generowany przez:** System OTORAPORT  
**Zgodność z ustawą:** Ustawa z dnia 21 maja 2025 r. o zmianie ustawy o ochronie praw nabywcy lokalu mieszkalnego

---

## 📊 Podsumowanie Wykonawcze

### Dane dewelopera
- **Nazwa:** ${developer.company_name}
- **Osoba kontaktowa:** ${developer.name}
- **NIP:** ${developer.nip}
- **Email:** ${developer.email}
${developer.phone ? `- **Telefon:** ${developer.phone}` : ''}

### Statystyki ogólne
- **Liczba projektów:** ${Object.keys(propertiesByProject).length}
- **Wszystkie nieruchomości:** ${totalProperties}
- **Dostępne:** ${availableProperties}
- **Sprzedane:** ${soldProperties}
- **Zarezerwowane:** ${reservedProperties}

### Analiza cenowa
- **Średnia cena za m²:** ${averagePrice.toLocaleString('pl-PL')} zł
- **Najniższa cena za m²:** ${minPrice.toLocaleString('pl-PL')} zł
- **Najwyższa cena za m²:** ${maxPrice.toLocaleString('pl-PL')} zł

---

## 🏗️ Projekty Deweloperskie

${Object.entries(propertiesByProject).map(([projectName, data]) => {
  const { project, properties: projectProperties } = data;
  
  return `### ${projectName}

${project ? `**Lokalizacja:** ${project.location}  
**Adres:** ${project.address}` : ''}

**Liczba mieszkań:** ${projectProperties.length}  
**Dostępne:** ${projectProperties.filter(p => p.status === 'available').length}  
**Sprzedane:** ${projectProperties.filter(p => p.status === 'sold').length}  
**Zarezerwowane:** ${projectProperties.filter(p => p.status === 'reserved').length}

#### Cennik mieszkań

| Nr lokalu | Typ | Powierzchnia | Cena/m² | Cena całkowita | Status | Miejsce parkingowe |
|-----------|-----|--------------|---------|----------------|--------|--------------------|
${projectProperties.map(property => {
  // Safe formatting: handle both numeric prices and "SOLD" strings
  const pricePerM2Display = typeof property.price_per_m2 === 'number'
    ? `${property.price_per_m2.toLocaleString('pl-PL')} zł`
    : property.price_per_m2 === 'SOLD' ? 'Sprzedane' : 'N/A'

  const finalPriceDisplay = typeof property.final_price === 'number'
    ? `${property.final_price.toLocaleString('pl-PL')} zł`
    : property.final_price === 'SOLD' ? 'Sprzedane' : 'N/A'

  const parkingDisplay = property.parking_space || 'N/A'
  const parkingPriceDisplay = property.parking_price && typeof property.parking_price === 'number'
    ? ` (${property.parking_price.toLocaleString('pl-PL')} zł)`
    : ''

  return `| ${property.property_number} | ${property.property_type} | ${property.area}m² | ${pricePerM2Display} | ${finalPriceDisplay} | ${getStatusLabel(property.status)} | ${parkingDisplay}${parkingPriceDisplay} |`
}).join('\n')}

**Analiza cenowa projektu ${projectName}:**
${(() => {
  // Filter only properties with numeric prices for analysis
  const numericProjectPrices = projectProperties
    .map(p => p.price_per_m2)
    .filter(price => typeof price === 'number' && price > 0)

  if (numericProjectPrices.length === 0) {
    return '- Brak danych cenowych (wszystkie nieruchomości sprzedane lub brak cen)'
  }

  const avgPrice = numericProjectPrices.reduce((sum, p) => sum + p, 0) / numericProjectPrices.length
  const minPrice = Math.min(...numericProjectPrices)
  const maxPrice = Math.max(...numericProjectPrices)

  return `- Średnia cena za m²: ${avgPrice.toLocaleString('pl-PL')} zł
- Najniższa cena za m²: ${minPrice.toLocaleString('pl-PL')} zł
- Najwyższa cena za m²: ${maxPrice.toLocaleString('pl-PL')} zł`
})()}

`;
}).join('\n---\n\n')}

---

## 📈 Szczegółowa Analiza Rynkowa

### Rozkład powierzchni mieszkań
${generateSurfaceAnalysis(validProperties)}

### Rozkład cen za m²
${generatePriceAnalysis(validProperties)}

### Trendy sprzedaży
- **Wskaźnik dostępności:** ${((availableProperties / totalProperties) * 100).toFixed(1)}%
- **Wskaźnik sprzedaży:** ${((soldProperties / totalProperties) * 100).toFixed(1)}%
- **Wskaźnik rezerwacji:** ${((reservedProperties / totalProperties) * 100).toFixed(1)}%

---

## 📋 Informacje Techniczne

### Metodologia
- Dane pochodzą z systemu zarządzania nieruchomościami dewelopera
- Aktualizacja: automatyczna, przy każdej zmianie statusu lub ceny
- Format danych: zgodny z wymogami ustawy mieszkaniowej
- Walidacja: automatyczna weryfikacja poprawności danych

### Źródło danych
- **System:** OTORAPORT - Automatyzacja raportowania cen nieruchomości
- **URL danych XML:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/data.xml\`
- **URL tego raportu:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/data.md\`

### Licencja i prawa autorskie
- **Licencja:** Creative Commons BY 4.0
- **Prawa autorskie:** © ${currentYear} ${developer.company_name}
- **Wykorzystanie:** Dozwolone wykorzystanie z podaniem źródła

---

## 🔗 Linki i Kontakt

### Dane kontaktowe
- **Email:** [${developer.email}](mailto:${developer.email})
${developer.phone ? `- **Telefon:** [${developer.phone}](tel:${developer.phone})` : ''}

### Zasoby online
- **Portal dewelopera:** \`https://ceny-sync.vercel.app/developer/${developer.id}\`
- **API endpointy:** \`https://ceny-sync.vercel.app/api/public/${developer.id}/\`
- **Dokumentacja systemu:** [OTORAPORT Documentation](https://ceny-sync.vercel.app/docs)

---

*Ten raport został wygenerowany automatycznie przez system OTORAPORT w dniu ${currentDate}.*  
*Wszystkie dane są aktualne na moment generowania raportu.*  
*W przypadku pytań prosimy o kontakt z deweloperem pod adresem: ${developer.email}*

---

**Zgodność prawna:** Ten raport spełnia wymogi ustawy z dnia 21 maja 2025 r. o zmianie ustawy o ochronie praw nabywcy lokalu mieszkalnego w zakresie obowiązku publikacji aktualnych cen mieszkań przez deweloperów.`;

  return markdown;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return '🟢 Dostępne';
    case 'sold': return '🔴 Sprzedane';
    case 'reserved': return '🟡 Zarezerwowane';
    default: return '⚪ Nieznany';
  }
}

function generateSurfaceAnalysis(properties: any[]): string {
  const surfaceRanges = {
    'do 30m²': properties.filter(p => p.area <= 30).length,
    '31-50m²': properties.filter(p => p.area > 30 && p.area <= 50).length,
    '51-70m²': properties.filter(p => p.area > 50 && p.area <= 70).length,
    '71-90m²': properties.filter(p => p.area > 70 && p.area <= 90).length,
    'ponad 90m²': properties.filter(p => p.area > 90).length,
  };

  return Object.entries(surfaceRanges)
    .map(([range, count]) => `- **${range}:** ${count} mieszkań`)
    .join('\n');
}

function generatePriceAnalysis(properties: any[]): string {
  const priceRanges = {
    'do 8000 zł/m²': properties.filter(p => p.price_per_m2 <= 8000).length,
    '8001-10000 zł/m²': properties.filter(p => p.price_per_m2 > 8000 && p.price_per_m2 <= 10000).length,
    '10001-12000 zł/m²': properties.filter(p => p.price_per_m2 > 10000 && p.price_per_m2 <= 12000).length,
    '12001-15000 zł/m²': properties.filter(p => p.price_per_m2 > 12000 && p.price_per_m2 <= 15000).length,
    'ponad 15000 zł/m²': properties.filter(p => p.price_per_m2 > 15000).length,
  };

  return Object.entries(priceRanges)
    .map(([range, count]) => `- **${range}:** ${count} mieszkań`)
    .join('\n');
}