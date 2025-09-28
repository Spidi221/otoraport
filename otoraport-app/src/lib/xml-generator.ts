// Ministry of Development and Technology XML Generator
// Schema 1.13 Compliance for Housing Price Transparency Act
// Data format: dane_o_cenach_mieszkan

interface MinistryProperty {
  // Required Property Identification
  id: string
  numer_lokalu: string // apartment_number (REQUIRED)
  typ_lokalu: 'mieszkanie' | 'dom' // property_type (REQUIRED)

  // Required Property Details
  powierzchnia_uzytkowa: number // surface_area (REQUIRED)
  cena_za_m2: number // price_per_m2 (REQUIRED)
  cena_calkowita: number // base_price (REQUIRED)
  cena_finalna?: number // final_price
  waluta: 'PLN' // Always PLN

  // Property Physical Details
  liczba_pokoi?: number
  pietro?: number // kondygnacja
  powierzchnia_balkon?: number
  powierzchnia_taras?: number
  powierzchnia_loggia?: number
  powierzchnia_ogrod?: number
  powierzchnia_piwnica?: number
  powierzchnia_strych?: number
  powierzchnia_garaz?: number

  // Required Location Data (Ministry Compliance)
  wojewodztwo: string // REQUIRED
  powiat: string // REQUIRED
  gmina: string // REQUIRED
  miejscowosc?: string
  ulica?: string
  numer_nieruchomosci?: string
  kod_pocztowy?: string

  // Status and Dates (REQUIRED)
  status_sprzedazy: 'dostepne' | 'zarezerwowane' | 'sprzedane'
  data_pierwszej_publikacji: string // ISO date (REQUIRED)
  data_ostatniej_aktualizacji: string // ISO date (REQUIRED)
  data_pierwszej_oferty?: string
  data_pierwszej_sprzedazy?: string
  price_valid_from?: string
  price_valid_to?: string

  // Historical Price Data
  cena_za_m2_poczatkowa?: number
  cena_bazowa_poczatkowa?: number

  // Additional Elements
  parking_included?: boolean
  parking_price?: number
  parking_description?: string
  komorka_included?: boolean
  komorka_price?: number
  komorka_description?: string

  // Building Details
  rok_budowy?: number
  klasa_energetyczna?: string
  system_grzewczy?: string
  standard_wykonczenia?: string

  // System Fields
  project_id: string
  created_at?: string
  updated_at?: string
}

interface MinistryDeveloper {
  // Required Developer Information
  id: string
  nazwa_dewelopera: string // company_name (REQUIRED)
  forma_prawna: string // legal_form (default: "spółka z ograniczoną odpowiedzialnością")

  // Required Tax Numbers
  nip: string // REQUIRED
  regon?: string
  krs?: string
  ceidg?: string

  // Required Contact Information
  email: string // REQUIRED
  telefon?: string
  strona_www?: string

  // Required Address
  adres_siedziby: string // headquarters_address (REQUIRED)

  // Contact Person
  osoba_kontaktowa?: string // name
  stanowisko?: string

  // System Fields
  created_at?: string
  updated_at?: string
}

interface MinistryInvestment {
  // Required Investment Information
  id_inwestycji: string // project_id (REQUIRED)
  nazwa: string // project_name (REQUIRED)
  opis?: string

  // Required Location
  lokalizacja: {
    wojewodztwo: string // REQUIRED
    powiat: string // REQUIRED
    gmina: string // REQUIRED
    miejscowosc?: string
    ulica?: string
    numer_nieruchomosci?: string
    kod_pocztowy?: string
  }

  // Building Information
  pozwolenie_na_budowe?: string
  stan_realizacji?: 'planowana' | 'w_budowie' | 'ukonczona'
  data_rozpoczecia?: string
  planowana_data_zakonczenia?: string
  rzeczywista_data_zakonczenia?: string

  // Developer Reference
  developer_id: string

  // System Fields
  created_at?: string
  updated_at?: string
}

interface MinistryProject {
  id: string
  name: string
  location: string
  address: string
  developer_id: string

  // Building permit info
  building_permit?: string
  construction_status?: string
  start_date?: string
  completion_date?: string
}

export interface MinistryXMLOptions {
  properties: MinistryProperty[]
  developer: MinistryDeveloper
  investments: MinistryInvestment[]
  metadata?: {
    data_publikacji?: string
    liczba_inwestycji?: number
    liczba_lokali?: number
    wersja_schematu?: string
  }
}

/**
 * Generate XML file according to Ministry Schema 1.13 specification
 * Complies with Housing Price Transparency Act requirements
 */
export function generateMinistryXML(options: MinistryXMLOptions): string {
  const { properties, developer, investments, metadata } = options

  const currentDate = new Date().toISOString()
  const currentDateStr = currentDate.split('T')[0]

  // Calculate totals
  const totalInvestments = investments.length
  const totalProperties = properties.length

  // Generate investments XML
  const investmentsXml = investments.map(investment => {
    // Get properties for this investment
    const investmentProperties = properties.filter(p => p.project_id === investment.id_inwestycji)

    const propertiesXml = investmentProperties.map(property => generatePropertyXML(property)).join('\n        ')

    return `    <inwestycja>
      <id_inwestycji>${escapeXml(investment.id_inwestycji)}</id_inwestycji>
      <nazwa>${escapeXml(investment.nazwa)}</nazwa>
      ${investment.opis ? `<opis>${escapeXml(investment.opis)}</opis>` : ''}

      <lokalizacja>
        <wojewodztwo>${escapeXml(investment.lokalizacja.wojewodztwo)}</wojewodztwo>
        <powiat>${escapeXml(investment.lokalizacja.powiat)}</powiat>
        <gmina>${escapeXml(investment.lokalizacja.gmina)}</gmina>
        ${investment.lokalizacja.miejscowosc ? `<miejscowosc>${escapeXml(investment.lokalizacja.miejscowosc)}</miejscowosc>` : ''}
        ${investment.lokalizacja.ulica ? `<ulica>${escapeXml(investment.lokalizacja.ulica)}</ulica>` : ''}
        ${investment.lokalizacja.numer_nieruchomosci ? `<numer_nieruchomosci>${escapeXml(investment.lokalizacja.numer_nieruchomosci)}</numer_nieruchomosci>` : ''}
        ${investment.lokalizacja.kod_pocztowy ? `<kod_pocztowy>${escapeXml(investment.lokalizacja.kod_pocztowy)}</kod_pocztowy>` : ''}
      </lokalizacja>

      ${investment.pozwolenie_na_budowe ? `<pozwolenie_na_budowe>${escapeXml(investment.pozwolenie_na_budowe)}</pozwolenie_na_budowe>` : ''}
      ${investment.stan_realizacji ? `<stan_realizacji>${investment.stan_realizacji}</stan_realizacji>` : ''}
      ${investment.data_rozpoczecia ? `<data_rozpoczecia>${investment.data_rozpoczecia}</data_rozpoczecia>` : ''}
      ${investment.planowana_data_zakonczenia ? `<planowana_data_zakonczenia>${investment.planowana_data_zakonczenia}</planowana_data_zakonczenia>` : ''}

      <lokale>
        ${propertiesXml}
      </lokale>
    </inwestycja>`
  }).join('\n    ')

  // Main XML structure according to Schema 1.13
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>${metadata?.data_publikacji || currentDateStr}</data_publikacji>

    <dostawca_danych>
      <nazwa>${escapeXml(developer.nazwa_dewelopera)}</nazwa>
      <forma_prawna>${escapeXml(developer.forma_prawna || 'spółka z ograniczoną odpowiedzialnością')}</forma_prawna>
      <nip>${escapeXml(developer.nip)}</nip>
      ${developer.regon ? `<regon>${escapeXml(developer.regon)}</regon>` : ''}
      ${developer.krs ? `<krs>${escapeXml(developer.krs)}</krs>` : ''}
      ${developer.ceidg ? `<ceidg>${escapeXml(developer.ceidg)}</ceidg>` : ''}
      <adres_siedziby>${escapeXml(developer.adres_siedziby)}</adres_siedziby>
      <email>${escapeXml(developer.email)}</email>
      ${developer.telefon ? `<telefon>${escapeXml(developer.telefon)}</telefon>` : ''}
      ${developer.strona_www ? `<strona_www>${escapeXml(developer.strona_www)}</strona_www>` : ''}
      ${developer.osoba_kontaktowa ? `<osoba_kontaktowa>${escapeXml(developer.osoba_kontaktowa)}</osoba_kontaktowa>` : ''}
      ${developer.stanowisko ? `<stanowisko>${escapeXml(developer.stanowisko)}</stanowisko>` : ''}
    </dostawca_danych>

    <liczba_inwestycji>${metadata?.liczba_inwestycji || totalInvestments}</liczba_inwestycji>
    <liczba_lokali>${metadata?.liczba_lokali || totalProperties}</liczba_lokali>
  </informacje_podstawowe>

  <inwestycje>
${investmentsXml}
  </inwestycje>

  <metadata>
    <wersja_schematu>${metadata?.wersja_schematu || '1.13'}</wersja_schematu>
    <data_wygenerowania>${currentDate}</data_wygenerowania>
    <checksum>${generateXMLChecksum(properties, developer)}</checksum>
  </metadata>
</dane_o_cenach_mieszkan>`

  return xmlContent
}

/**
 * Generate XML for individual property (lokal)
 */
function generatePropertyXML(property: MinistryProperty): string {
  return `<lokal>
          <numer_lokalu>${escapeXml(property.numer_lokalu)}</numer_lokalu>
          <typ_lokalu>${property.typ_lokalu}</typ_lokalu>
          <powierzchnia_uzytkowa>${property.powierzchnia_uzytkowa.toFixed(2)}</powierzchnia_uzytkowa>
          ${property.liczba_pokoi ? `<liczba_pokoi>${property.liczba_pokoi}</liczba_pokoi>` : ''}
          ${property.pietro ? `<pietro>${property.pietro}</pietro>` : ''}

          <cena_za_m2>${property.cena_za_m2.toFixed(2)}</cena_za_m2>
          <cena_calkowita>${property.cena_calkowita.toFixed(2)}</cena_calkowita>
          ${property.cena_finalna ? `<cena_finalna>${property.cena_finalna.toFixed(2)}</cena_finalna>` : ''}
          <waluta>${property.waluta}</waluta>

          <status_sprzedazy>${property.status_sprzedazy}</status_sprzedazy>
          <data_pierwszej_publikacji>${property.data_pierwszej_publikacji}</data_pierwszej_publikacji>
          <data_ostatniej_aktualizacji>${property.data_ostatniej_aktualizacji}</data_ostatniej_aktualizacji>
          ${property.data_pierwszej_oferty ? `<data_pierwszej_oferty>${property.data_pierwszej_oferty}</data_pierwszej_oferty>` : ''}
          ${property.price_valid_from ? `<data_obowiazywania_od>${property.price_valid_from}</data_obowiazywania_od>` : ''}
          ${property.price_valid_to ? `<data_obowiazywania_do>${property.price_valid_to}</data_obowiazywania_do>` : ''}

          <lokalizacja>
            <wojewodztwo>${escapeXml(property.wojewodztwo)}</wojewodztwo>
            <powiat>${escapeXml(property.powiat)}</powiat>
            <gmina>${escapeXml(property.gmina)}</gmina>
            ${property.miejscowosc ? `<miejscowosc>${escapeXml(property.miejscowosc)}</miejscowosc>` : ''}
            ${property.ulica ? `<ulica>${escapeXml(property.ulica)}</ulica>` : ''}
            ${property.numer_nieruchomosci ? `<numer_nieruchomosci>${escapeXml(property.numer_nieruchomosci)}</numer_nieruchomosci>` : ''}
            ${property.kod_pocztowy ? `<kod_pocztowy>${escapeXml(property.kod_pocztowy)}</kod_pocztowy>` : ''}
          </lokalizacja>

          ${generateAdditionalInfoXML(property)}
        </lokal>`
}

/**
 * Generate additional property information XML
 */
function generateAdditionalInfoXML(property: MinistryProperty): string {
  const additionalInfo = []

  if (property.powierzchnia_balkon) {
    additionalInfo.push(`<balkon><powierzchnia_balkonu>${property.powierzchnia_balkon.toFixed(2)}</powierzchnia_balkonu></balkon>`)
  }

  if (property.powierzchnia_taras) {
    additionalInfo.push(`<taras><powierzchnia_tarasu>${property.powierzchnia_taras.toFixed(2)}</powierzchnia_tarasu></taras>`)
  }

  if (property.powierzchnia_loggia) {
    additionalInfo.push(`<loggia><powierzchnia_loggii>${property.powierzchnia_loggia.toFixed(2)}</powierzchnia_loggii></loggia>`)
  }

  if (property.powierzchnia_ogrod) {
    additionalInfo.push(`<ogrod><powierzchnia_ogrodu>${property.powierzchnia_ogrod.toFixed(2)}</powierzchnia_ogrodu></ogrod>`)
  }

  if (property.parking_included || property.parking_price) {
    additionalInfo.push(`<parking>
              <czy_w_cenie>${property.parking_included ? 'tak' : 'nie'}</czy_w_cenie>
              ${property.parking_price ? `<cena_parkingu>${property.parking_price.toFixed(2)}</cena_parkingu>` : ''}
              ${property.parking_description ? `<opis_parkingu>${escapeXml(property.parking_description)}</opis_parkingu>` : ''}
            </parking>`)
  }

  if (property.komorka_included || property.komorka_price) {
    additionalInfo.push(`<piwnica>
              <czy_w_cenie>${property.komorka_included ? 'tak' : 'nie'}</czy_w_cenie>
              ${property.komorka_price ? `<cena_piwnicy>${property.komorka_price.toFixed(2)}</cena_piwnicy>` : ''}
              ${property.komorka_description ? `<opis_piwnicy>${escapeXml(property.komorka_description)}</opis_piwnicy>` : ''}
            </piwnica>`)
  }

  if (property.klasa_energetyczna) {
    additionalInfo.push(`<klasa_energetyczna>${escapeXml(property.klasa_energetyczna)}</klasa_energetyczna>`)
  }

  if (property.system_grzewczy) {
    additionalInfo.push(`<system_grzewczy>${escapeXml(property.system_grzewczy)}</system_grzewczy>`)
  }

  if (property.standard_wykonczenia) {
    additionalInfo.push(`<standard_wykonczenia>${escapeXml(property.standard_wykonczenia)}</standard_wykonczenia>`)
  }

  if (additionalInfo.length > 0) {
    return `<dodatkowe_informacje>
            ${additionalInfo.join('\n            ')}
          </dodatkowe_informacje>`
  }

  return ''
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string | number): string {
  if (typeof unsafe === 'number') {
    return unsafe.toString()
  }

  if (!unsafe || typeof unsafe !== 'string') {
    return ''
  }

  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

/**
 * Convert existing application data to Ministry format
 */
export function convertToMinistryFormat(
  properties: any[],
  developer: any,
  projects: any[]
): MinistryXMLOptions {
  const ministryDeveloper: MinistryDeveloper = {
    id: developer.id,
    nazwa_dewelopera: developer.company_name || developer.name,
    forma_prawna: developer.legal_form || 'spółka z ograniczoną odpowiedzialnością',
    nip: developer.nip,
    regon: developer.regon,
    krs: developer.krs,
    ceidg: developer.ceidg,
    email: developer.email,
    telefon: developer.phone,
    adres_siedziby: developer.headquarters_address || 'Brak danych',
    osoba_kontaktowa: developer.name,
  }

  const ministryInvestments: MinistryInvestment[] = projects.map(project => ({
    id_inwestycji: project.id,
    nazwa: project.name,
    opis: project.description,
    lokalizacja: {
      wojewodztwo: extractFromLocation(project.location, 'wojewodztwo') || 'mazowieckie',
      powiat: extractFromLocation(project.location, 'powiat') || 'warszawa',
      gmina: extractFromLocation(project.location, 'gmina') || 'Warszawa',
      miejscowosc: extractFromLocation(project.location, 'miejscowosc'),
      ulica: project.address,
    },
    pozwolenie_na_budowe: project.building_permit,
    stan_realizacji: mapConstructionStatus(project.construction_status),
    data_rozpoczecia: project.start_date,
    planowana_data_zakonczenia: project.completion_date,
    developer_id: project.developer_id
  }))

  const ministryProperties: MinistryProperty[] = properties.map(property => ({
    id: property.id,
    numer_lokalu: property.apartment_number || property.property_number || 'B/D',
    typ_lokalu: mapPropertyType(property.property_type),
    powierzchnia_uzytkowa: property.surface_area || property.area || 0,
    cena_za_m2: property.price_per_m2 || 0,
    cena_calkowita: property.base_price || property.total_price || 0,
    cena_finalna: property.final_price,
    waluta: 'PLN',

    // Location from property or fallback to project
    wojewodztwo: property.wojewodztwo || 'mazowieckie',
    powiat: property.powiat || 'warszawa',
    gmina: property.gmina || 'Warszawa',
    miejscowosc: property.miejscowosc,
    ulica: property.ulica,
    numer_nieruchomosci: property.numer_nieruchomosci,
    kod_pocztowy: property.kod_pocztowy,

    // Dates
    data_pierwszej_publikacji: property.data_pierwszej_oferty || property.created_at?.split('T')[0] || getCurrentDateString(),
    data_ostatniej_aktualizacji: property.updated_at?.split('T')[0] || getCurrentDateString(),
    data_pierwszej_oferty: property.data_pierwszej_oferty,
    price_valid_from: property.price_valid_from,
    price_valid_to: property.price_valid_to,

    // Status mapping
    status_sprzedazy: mapStatus(property.status || property.status_dostepnosci),

    // Additional details
    liczba_pokoi: property.liczba_pokoi,
    pietro: property.kondygnacja,
    powierzchnia_balkon: property.powierzchnia_balkon,
    powierzchnia_taras: property.powierzchnia_taras,
    powierzchnia_loggia: property.powierzchnia_loggia,
    powierzchnia_ogrod: property.powierzchnia_ogrod,

    // Parking
    parking_included: !!property.parking_space,
    parking_price: property.parking_price,
    parking_description: property.parking_space,

    // System fields
    project_id: property.project_id,
    created_at: property.created_at,
    updated_at: property.updated_at,
  }))

  return {
    properties: ministryProperties,
    developer: ministryDeveloper,
    investments: ministryInvestments,
    metadata: {
      data_publikacji: getCurrentDateString(),
      liczba_inwestycji: ministryInvestments.length,
      liczba_lokali: ministryProperties.length,
      wersja_schematu: '1.13'
    }
  }
}

// Helper functions
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0]
}

function extractFromLocation(location: string, field: string): string | undefined {
  // Simple extraction logic - in production this should be more sophisticated
  return undefined
}

function mapConstructionStatus(status?: string): 'planowana' | 'w_budowie' | 'ukonczona' {
  if (!status) return 'w_budowie'

  switch (status.toLowerCase()) {
    case 'planned':
    case 'planowana':
      return 'planowana'
    case 'completed':
    case 'ukonczona':
    case 'finished':
      return 'ukonczona'
    default:
      return 'w_budowie'
  }
}

function mapPropertyType(type?: string): 'mieszkanie' | 'dom' {
  if (!type) return 'mieszkanie'

  return type.toLowerCase().includes('dom') ? 'dom' : 'mieszkanie'
}

function mapStatus(status?: string): 'dostepne' | 'zarezerwowane' | 'sprzedane' {
  if (!status) return 'dostepne'

  switch (status.toLowerCase()) {
    case 'available':
    case 'dostepne':
    case 'dostępne':
      return 'dostepne'
    case 'reserved':
    case 'zarezerwowane':
      return 'zarezerwowane'
    case 'sold':
    case 'sprzedane':
      return 'sprzedane'
    default:
      return 'dostepne'
  }
}

/**
 * Generate XML content checksum for data integrity
 */
function generateXMLChecksum(properties: MinistryProperty[], developer: MinistryDeveloper): string {
  const crypto = require('crypto')

  // Create checksum based on key data points
  const checksumData = {
    developer_nip: developer.nip,
    total_properties: properties.length,
    total_value: properties.reduce((sum, p) => sum + p.cena_calkowita, 0),
    timestamp: new Date().toISOString().split('T')[0]
  }

  return crypto
    .createHash('md5')
    .update(JSON.stringify(checksumData))
    .digest('hex')
    .toUpperCase()
    .substring(0, 16)
}

/**
 * Validate Ministry XML compliance
 */
export function validateMinistryXML(options: MinistryXMLOptions): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const { properties, developer, investments } = options

  // Developer validation
  if (!developer.nazwa_dewelopera) errors.push('Brak nazwy dewelopera')
  if (!developer.nip) errors.push('Brak numeru NIP dewelopera')
  if (!developer.email) errors.push('Brak email dewelopera')
  if (!developer.adres_siedziby) errors.push('Brak adresu siedziby dewelopera')

  // Investment validation
  if (investments.length === 0) errors.push('Brak danych o inwestycjach')

  for (const investment of investments) {
    if (!investment.id_inwestycji) errors.push(`Inwestycja bez ID: ${investment.nazwa}`)
    if (!investment.nazwa) errors.push(`Inwestycja bez nazwy: ${investment.id_inwestycji}`)
    if (!investment.lokalizacja.wojewodztwo) errors.push(`Brak województwa dla inwestycji: ${investment.nazwa}`)
    if (!investment.lokalizacja.powiat) errors.push(`Brak powiatu dla inwestycji: ${investment.nazwa}`)
    if (!investment.lokalizacja.gmina) errors.push(`Brak gminy dla inwestycji: ${investment.nazwa}`)
  }

  // Properties validation
  if (properties.length === 0) errors.push('Brak danych o mieszkaniach')

  for (const property of properties) {
    // Required fields
    if (!property.numer_lokalu) errors.push(`Mieszkanie bez numeru lokalu: ${property.id}`)
    if (!property.powierzchnia_uzytkowa) errors.push(`Mieszkanie bez powierzchni: ${property.numer_lokalu}`)
    if (!property.cena_za_m2) errors.push(`Mieszkanie bez ceny za m²: ${property.numer_lokalu}`)
    if (!property.cena_calkowita) errors.push(`Mieszkanie bez ceny całkowitej: ${property.numer_lokalu}`)
    if (!property.wojewodztwo) errors.push(`Mieszkanie bez województwa: ${property.numer_lokalu}`)
    if (!property.powiat) errors.push(`Mieszkanie bez powiatu: ${property.numer_lokalu}`)
    if (!property.gmina) errors.push(`Mieszkanie bez gminy: ${property.numer_lokalu}`)
    if (!property.data_pierwszej_publikacji) errors.push(`Mieszkanie bez daty pierwszej publikacji: ${property.numer_lokalu}`)
    if (!property.data_ostatniej_aktualizacji) errors.push(`Mieszkanie bez daty ostatniej aktualizacji: ${property.numer_lokalu}`)

    // Data validation
    if (property.powierzchnia_uzytkowa && property.powierzchnia_uzytkowa <= 0) {
      errors.push(`Nieprawidłowa powierzchnia mieszkania: ${property.numer_lokalu}`)
    }

    if (property.cena_za_m2 && property.cena_za_m2 <= 0) {
      errors.push(`Nieprawidłowa cena za m² mieszkania: ${property.numer_lokalu}`)
    }

    if (property.cena_calkowita && property.cena_calkowita <= 0) {
      errors.push(`Nieprawidłowa cena całkowita mieszkania: ${property.numer_lokalu}`)
    }

    // Warnings for missing optional but recommended fields
    if (!property.liczba_pokoi) warnings.push(`Brak liczby pokoi dla mieszkania: ${property.numer_lokalu}`)
    if (!property.pietro) warnings.push(`Brak informacji o piętrze dla mieszkania: ${property.numer_lokalu}`)
    if (!property.miejscowosc) warnings.push(`Brak miejscowości dla mieszkania: ${property.numer_lokalu}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}