import crypto from 'crypto'

/**
 * Harvester XML Generator for Ministry Compliance
 *
 * Generates XML metadata file that points to CSV data endpoint.
 * This is the file that the ministry's harvester will fetch first.
 *
 * Schema: urn:otwarte-dane:harvester:1.13
 *
 * UWAGA: To jest HARVESTER XML (metadane), NIE Property Data XML!
 * Harvester XML wskazuje na URL pliku CSV z danymi.
 */

export interface HarvesterXMLParams {
  developer: {
    name: string
    client_id: string
  }
  csvUrl: string
  date: string // YYYY-MM-DD
}

/**
 * Generate a unique 32-character identifier for the dataset
 * Uses client_id and date to create a consistent MD5 hash
 */
function generateExtIdent(clientId: string, date: string): string {
  const source = `${clientId}-${date}`
  const hash = crypto.createHash('md5').update(source).digest('hex')
  return hash // MD5 hash is exactly 32 characters
}

export function generateHarvesterXML(params: HarvesterXMLParams): string {
  const { developer, csvUrl, date } = params

  // Generate unique 32-character identifier
  const extIdent = generateExtIdent(developer.client_id, date)

  // Generate filename for the CSV resource
  const csvFileName = `Ceny-ofertowe-mieszkan-${developer.client_id}-${date}.csv`

  // Build XML with proper namespace and structure
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13">
  <dataset status="published">
    <extIdent>${extIdent}</extIdent>
    <extTitle>Ceny ofertowe mieszkań - ${developer.name} - ${date}</extTitle>
    <extSchemaType>mieszkania</extSchemaType>
    <extSchemaVersion>1.13</extSchemaVersion>
    <resources>
      <resource>
        <url>${csvUrl}</url>
        <name>${csvFileName}</name>
        <format>CSV</format>
      </resource>
    </resources>
  </dataset>
</ns2:datasets>`

  return xml
}

/**
 * Validate that generated XML has required fields
 * Useful for testing and debugging
 */
export function validateHarvesterXML(xml: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check namespace
  if (!xml.includes('xmlns:ns2="urn:otwarte-dane:harvester:1.13"')) {
    errors.push('Missing or incorrect namespace')
  }

  // Check required elements
  const requiredElements = [
    'extIdent',
    'extTitle',
    'extSchemaType',
    'extSchemaVersion',
    'url',
    'format'
  ]

  requiredElements.forEach(element => {
    if (!xml.includes(`<${element}>`)) {
      errors.push(`Missing required element: ${element}`)
    }
  })

  // Check extSchemaType value
  if (xml.includes('<extSchemaType>') && !xml.includes('<extSchemaType>mieszkania</extSchemaType>')) {
    errors.push('extSchemaType must be "mieszkania"')
  }

  // Check extSchemaVersion value
  if (xml.includes('<extSchemaVersion>') && !xml.includes('<extSchemaVersion>1.13</extSchemaVersion>')) {
    errors.push('extSchemaVersion must be "1.13"')
  }

  // Check extIdent length (should be 32 characters)
  const extIdentMatch = xml.match(/<extIdent>([^<]+)<\/extIdent>/)
  if (extIdentMatch && extIdentMatch[1].length !== 32) {
    errors.push('extIdent must be exactly 32 characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
