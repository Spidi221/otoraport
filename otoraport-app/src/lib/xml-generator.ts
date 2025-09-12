// Generator plików XML zgodnie z schema dane.gov.pl 1.13
// Bazowany na workflow n8n z dokumentacji

interface Property {
  id: string;
  property_number: string;
  property_type: string;
  price_per_m2: number;
  total_price: number;
  final_price: number;
  area: number;
  parking_space?: string;
  parking_price?: number;
  status: 'available' | 'sold' | 'reserved';
  project_id: string;
}

interface Developer {
  id: string;
  name: string;
  company_name: string;
  nip: string;
  email: string;
  phone?: string;
}

interface Project {
  id: string;
  name: string;
  location: string;
  address: string;
  developer_id: string;
}

export interface XMLGeneratorOptions {
  properties: Property[];
  developer: Developer;
  projects: Project[];
}

export function generateXMLFile(options: XMLGeneratorOptions): string {
  const { properties, developer, projects } = options;
  
  // Tworzenie datasets zgodnie z n8n workflow
  const datasets = properties.map((property) => {
    const project = projects.find(p => p.id === property.project_id);
    const currentDate = new Date().toISOString().split('T')[0];
    
    return {
      extIdent: `${currentDate}-${property.id}`,
      title: {
        polish: `Mieszkanie ${property.property_number} - ${project?.name || 'Unknown'} - ${developer.company_name}`,
        english: `Apartment ${property.property_number} - ${project?.name || 'Unknown'} - ${developer.company_name}`
      },
      description: {
        polish: `Mieszkanie o powierzchni ${property.area}m² w ${project?.location || 'lokalizacji'}. Cena: ${property.final_price.toLocaleString('pl-PL')} PLN`,
        english: `Apartment with area ${property.area}m² in ${project?.location || 'location'}. Price: ${property.final_price.toLocaleString('en-US')} PLN`
      },
      keywords: [
        'mieszkanie',
        'nieruchomość',
        'deweloper',
        property.property_type.toLowerCase(),
        project?.location?.toLowerCase() || '',
        developer.company_name.toLowerCase()
      ].filter(Boolean),
      issued: new Date().toISOString(),
      modified: new Date().toISOString(),
      publisher: {
        name: developer.company_name,
        mbox: developer.email,
        type: 'http://xmlns.com/foaf/0.1/Organization'
      },
      contactPoint: {
        fn: developer.name,
        hasEmail: developer.email,
        hasTelephone: developer.phone || '',
        type: 'http://www.w3.org/2006/vcard/ns#Individual'
      },
      landingPage: `https://ceny-sync.vercel.app/property/${property.id}`,
      theme: 'http://publications.europa.eu/resource/authority/data-theme/ECON',
      keyword: property.property_type,
      distribution: [
        {
          title: {
            polish: `Dane cenowe mieszkania ${property.property_number}`,
            english: `Price data for apartment ${property.property_number}`
          },
          description: {
            polish: `Szczegółowe dane o cenie mieszkania ${property.property_number}`,
            english: `Detailed price information for apartment ${property.property_number}`
          },
          issued: new Date().toISOString(),
          modified: new Date().toISOString(),
          format: 'application/json',
          mediaType: 'application/json',
          downloadURL: `https://ceny-sync.vercel.app/api/public/${developer.id}/property/${property.id}.json`,
          accessURL: `https://ceny-sync.vercel.app/api/public/${developer.id}/property/${property.id}`,
          license: 'http://creativecommons.org/licenses/by/4.0/',
          rights: `© ${new Date().getFullYear()} ${developer.company_name}`,
          byteSize: Math.floor(Math.random() * 1000) + 500, // Symulowane
          checksum: {
            algorithm: 'SHA-256',
            checksumValue: generateChecksum(property.id)
          }
        }
      ],
      spatial: project?.location || '',
      temporal: `${currentDate}/${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}`,
      accrualPeriodicity: 'http://purl.org/cld/freq/monthly',
      hasVersion: '1.0',
      isVersionOf: `https://ceny-sync.vercel.app/dataset/${property.id}`,
      source: `https://ceny-sync.vercel.app/api/public/${developer.id}/data`,
      provenance: 'Dane pochodzą z systemu zarządzania nieruchomościami dewelopera',
      page: `https://ceny-sync.vercel.app/property/${property.id}`,
      conformsTo: 'https://dane.gov.pl/schema/1.13',
      qualifiedRelation: []
    };
  });

  // Generowanie XML zgodnie z schema 1.13
  const datasetsXml = datasets.map(dataset => 
    `    <dcat:Dataset rdf:about="https://ceny-sync.vercel.app/dataset/${dataset.extIdent}">
      <dct:identifier>${dataset.extIdent}</dct:identifier>
      <dct:title xml:lang="pl">${escapeXml(dataset.title.polish)}</dct:title>
      <dct:title xml:lang="en">${escapeXml(dataset.title.english)}</dct:title>
      <dct:description xml:lang="pl">${escapeXml(dataset.description.polish)}</dct:description>
      <dct:description xml:lang="en">${escapeXml(dataset.description.english)}</dct:description>
      ${dataset.keywords.map(kw => `<dcat:keyword xml:lang="pl">${escapeXml(kw)}</dcat:keyword>`).join('\n      ')}
      <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${dataset.issued}</dct:issued>
      <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${dataset.modified}</dct:modified>
      <dct:publisher>
        <foaf:Organization>
          <foaf:name>${escapeXml(dataset.publisher.name)}</foaf:name>
          <foaf:mbox rdf:resource="mailto:${dataset.publisher.mbox}"/>
        </foaf:Organization>
      </dct:publisher>
      <dcat:contactPoint>
        <vcard:Individual>
          <vcard:fn>${escapeXml(dataset.contactPoint.fn)}</vcard:fn>
          <vcard:hasEmail rdf:resource="mailto:${dataset.contactPoint.hasEmail}"/>
          ${dataset.contactPoint.hasTelephone ? `<vcard:hasTelephone rdf:resource="tel:${dataset.contactPoint.hasTelephone}"/>` : ''}
        </vcard:Individual>
      </dcat:contactPoint>
      <dcat:landingPage rdf:resource="${dataset.landingPage}"/>
      <dcat:theme rdf:resource="${dataset.theme}"/>
      <dct:spatial xml:lang="pl">${escapeXml(dataset.spatial)}</dct:spatial>
      <dct:temporal>${dataset.temporal}</dct:temporal>
      <dct:accrualPeriodicity rdf:resource="${dataset.accrualPeriodicity}"/>
      <dcat:distribution>
        <dcat:Distribution>
          <dct:title xml:lang="pl">${escapeXml(dataset.distribution[0].title.polish)}</dct:title>
          <dct:title xml:lang="en">${escapeXml(dataset.distribution[0].title.english)}</dct:title>
          <dct:description xml:lang="pl">${escapeXml(dataset.distribution[0].description.polish)}</dct:description>
          <dct:description xml:lang="en">${escapeXml(dataset.distribution[0].description.english)}</dct:description>
          <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${dataset.distribution[0].issued}</dct:issued>
          <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${dataset.distribution[0].modified}</dct:modified>
          <dct:format>${dataset.distribution[0].format}</dct:format>
          <dcat:mediaType>${dataset.distribution[0].mediaType}</dcat:mediaType>
          <dcat:downloadURL rdf:resource="${dataset.distribution[0].downloadURL}"/>
          <dcat:accessURL rdf:resource="${dataset.distribution[0].accessURL}"/>
          <dct:license rdf:resource="${dataset.distribution[0].license}"/>
          <dct:rights xml:lang="pl">${escapeXml(dataset.distribution[0].rights)}</dct:rights>
          <dcat:byteSize rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">${dataset.distribution[0].byteSize}</dcat:byteSize>
        </dcat:Distribution>
      </dcat:distribution>
      <dct:conformsTo rdf:resource="${dataset.conformsTo}"/>
    </dcat:Dataset>`
  ).join('\n\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF 
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:dcat="http://www.w3.org/ns/dcat#"
  xmlns:dct="http://purl.org/dc/terms/"
  xmlns:foaf="http://xmlns.com/foaf/0.1/"
  xmlns:vcard="http://www.w3.org/2006/vcard/ns#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#">
  
  <dcat:Catalog rdf:about="https://ceny-sync.vercel.app/catalog/${developer.id}">
    <dct:title xml:lang="pl">Katalog danych cenowych - ${escapeXml(developer.company_name)}</dct:title>
    <dct:title xml:lang="en">Price data catalog - ${escapeXml(developer.company_name)}</dct:title>
    <dct:description xml:lang="pl">Katalog zawiera dane o cenach mieszkań oferowanych przez ${escapeXml(developer.company_name)}</dct:description>
    <dct:description xml:lang="en">Catalog contains price data for apartments offered by ${escapeXml(developer.company_name)}</dct:description>
    <dct:publisher>
      <foaf:Organization>
        <foaf:name>${escapeXml(developer.company_name)}</foaf:name>
        <foaf:mbox rdf:resource="mailto:${developer.email}"/>
      </foaf:Organization>
    </dct:publisher>
    <dct:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${new Date().toISOString()}</dct:issued>
    <dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">${new Date().toISOString()}</dct:modified>
    <dct:license rdf:resource="http://creativecommons.org/licenses/by/4.0/"/>
    <dct:rights xml:lang="pl">© ${new Date().getFullYear()} ${escapeXml(developer.company_name)}</dct:rights>
    <foaf:homepage rdf:resource="https://ceny-sync.vercel.app"/>
    <dct:language rdf:resource="http://publications.europa.eu/resource/authority/language/POL"/>
    
${datasetsXml}
    
  </dcat:Catalog>
</rdf:RDF>`;

  return xmlContent;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateChecksum(propertyId: string): string {
  // Prosta symulacja checksuma (w produkcji użyj crypto.createHash)
  let hash = 0;
  for (let i = 0; i < propertyId.length; i++) {
    const char = propertyId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}