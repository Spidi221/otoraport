// Ministry of Development and Technology XML Generator
// HARVESTER Schema 1.13 Compliance for Housing Price Transparency Act
// Format: Harvester metadata XML pointing to CSV file (NOT property data)

export interface XMLGeneratorOptions {
  properties: any[] // Not used in Harvester XML, but kept for API compatibility
  developer: {
    id: string
    company_name: string
    nip: string
    email: string
    [key: string]: any
  }
  projects: any[] // Not used in Harvester XML
}

/**
 * Generate Harvester XML file according to Ministry Schema 1.13 specification
 * This is metadata XML that points to CSV file, NOT property data XML
 *
 * CRITICAL: Ministerstwo wymaga:
 * 1. XML Harvester (ten plik) - METADANE o datasecie
 * 2. CSV file - DANE o mieszkaniach (58 kolumn)
 *
 * XML zawiera tylko URL do CSV, nie zawiera danych mieszkań!
 */
export function generateXMLFile(options: XMLGeneratorOptions): string {
  const { developer } = options

  const currentDate = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  // Generate unique identifiers
  const extIdent = generateExtIdent(developer.id, developer.nip)
  const resourceExtIdent = `${extIdent}_${currentDate.replace(/-/g, '')}`

  // CSV file URL (where ministry harvester will download data from)
  const csvUrl = `https://ceny-sync.vercel.app/api/public/${developer.id}/data.csv`

  // Generate Harvester XML (METADATA, not property data)
  const xmlContent = `<?xml version='1.0' encoding='UTF-8'?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<dataset status="published">
\t\t<extIdent>${escapeXml(extIdent)}</extIdent>
\t\t<title>
\t\t\t<polish>Ceny ofertowe mieszkań dewelopera ${escapeXml(developer.company_name)} w ${currentYear} r.</polish>
\t\t\t<english>Offer prices of apartments of developer ${escapeXml(developer.company_name)} in ${currentYear}.</english>
\t\t</title>
\t\t<description>
\t\t\t<polish>Zbiór danych zawiera informacje o cenach ofertowych mieszkań dewelopera ${escapeXml(developer.company_name)} udostępniane zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</polish>
\t\t\t<english>The dataset contains information on offer prices of apartments of the developer ${escapeXml(developer.company_name)} made available in accordance with art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</english>
\t\t</description>
\t\t<updateFrequency>daily</updateFrequency>
\t\t<hasDynamicData>false</hasDynamicData>
\t\t<hasHighValueData>true</hasHighValueData>
\t\t<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
\t\t<hasResearchData>false</hasResearchData>
\t\t<categories>
\t\t\t<category>ECON</category>
\t\t</categories>
\t\t<resources>
\t\t\t<resource status="published">
\t\t\t\t<extIdent>${escapeXml(resourceExtIdent)}</extIdent>
\t\t\t\t<url>${escapeXml(csvUrl)}</url>
\t\t\t\t<title>
\t\t\t\t\t<polish>Ceny ofertowe mieszkań dewelopera ${escapeXml(developer.company_name)} ${currentDate}</polish>
\t\t\t\t\t<english>Offer prices for developer's apartments ${escapeXml(developer.company_name)} ${currentDate}</english>
\t\t\t\t</title>
\t\t\t\t<description>
\t\t\t\t\t<polish>Dane dotyczące cen ofertowych mieszkań dewelopera ${escapeXml(developer.company_name)} udostępnione ${currentDate} zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</polish>
\t\t\t\t\t<english>Data on offer prices of apartments of the developer ${escapeXml(developer.company_name)} made available ${currentDate} in accordance with art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</english>
\t\t\t\t</description>
\t\t\t\t<availability>local</availability>
\t\t\t\t<dataDate>${currentDate}</dataDate>
\t\t\t\t<specialSigns>
\t\t\t\t\t<specialSign>X</specialSign>
\t\t\t\t</specialSigns>
\t\t\t\t<hasDynamicData>false</hasDynamicData>
\t\t\t\t<hasHighValueData>true</hasHighValueData>
\t\t\t\t<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
\t\t\t\t<hasResearchData>false</hasResearchData>
\t\t\t\t<containsProtectedData>false</containsProtectedData>
\t\t\t</resource>
\t\t</resources>
\t\t<tags>
\t\t\t<tag lang="pl">Deweloper</tag>
\t\t</tags>
\t</dataset>
</ns2:datasets>
`

  return xmlContent
}

/**
 * Generate unique 36-character identifier for dataset
 * Based on developer ID and NIP for uniqueness
 */
function generateExtIdent(developerId: string, nip: string): string {
  // Create deterministic 36-char ID from developer data
  const baseStr = `${developerId}_${nip}_otoraport`

  // Simple hash to ensure 36 characters
  let hash = 0
  for (let i = 0; i < baseStr.length; i++) {
    const char = baseStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  const hashStr = Math.abs(hash).toString(36).toUpperCase()
  const paddedHash = hashStr.padEnd(36, '0').substring(0, 36)

  return paddedHash
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
 * Validate Harvester XML compliance
 */
export function validateHarvesterXML(developer: any): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Developer validation
  if (!developer.company_name) errors.push('Brak nazwy dewelopera (company_name)')
  if (!developer.nip) errors.push('Brak numeru NIP dewelopera')
  if (!developer.id) errors.push('Brak ID dewelopera')
  if (!developer.email) warnings.push('Brak email dewelopera (opcjonalne, ale zalecane)')

  // ExtIdent validation
  const extIdent = generateExtIdent(developer.id || '', developer.nip || '')
  if (extIdent.length !== 36) {
    errors.push(`ExtIdent ma nieprawidłową długość: ${extIdent.length} (wymagane: 36)`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// LEGACY EXPORTS (for backward compatibility)
// These are deprecated and should not be used in new code

/**
 * @deprecated Use generateXMLFile instead
 * This function generates wrong format (property data XML instead of Harvester metadata)
 */
export function generateMinistryXML(options: any): string {
  console.warn('⚠️ generateMinistryXML is DEPRECATED - generates WRONG format!')
  console.warn('Use generateXMLFile instead for Harvester Schema 1.13 compliance')
  return generateXMLFile(options)
}

/**
 * @deprecated Not needed for Harvester XML format
 */
export function convertToMinistryFormat(properties: any[], developer: any, projects: any[]): XMLGeneratorOptions {
  console.warn('⚠️ convertToMinistryFormat is DEPRECATED - not needed for Harvester format')
  return {
    properties,
    developer,
    projects
  }
}

/**
 * @deprecated Use validateHarvesterXML instead
 */
export function validateMinistryXML(options: any): { valid: boolean; errors: string[]; warnings: string[] } {
  console.warn('⚠️ validateMinistryXML is DEPRECATED - use validateHarvesterXML instead')
  return validateHarvesterXML(options.developer)
}