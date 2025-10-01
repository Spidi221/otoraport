# Ministry Property Data XML - Quick Start Guide

## What Was Created

Two new files for ministry-compliant property data XML generation:

1. **`/src/lib/ministry-xml-generator.ts`** - Core XML generator library
2. **`/src/app/api/public/[clientId]/prices.xml/route.ts`** - Public API endpoint

## How to Use

### 1. API Endpoint (Public Access)

**URL:** `GET /api/public/{clientId}/prices.xml`

**Example:**
```bash
curl https://otoraport.vercel.app/api/public/abc123/prices.xml
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>2025-10-01</data_publikacji>
    <dostawca_danych>
      <nazwa>Developer Name</nazwa>
      <nip>1234567890</nip>
      <!-- 26 more developer fields -->
    </dostawca_danych>
  </informacje_podstawowe>
  <oferty>
    <oferta>
      <nr_lokalu>A1/01</nr_lokalu>
      <cena_m2>12500</cena_m2>
      <powierzchnia_uzytkowa>55.00</powierzchnia_uzytkowa>
      <!-- 27 more property fields -->
    </oferta>
  </oferty>
</dane_o_cenach_mieszkan>
```

### 2. Programmatic Usage

```typescript
import { generateMinistryDataXML } from '@/lib/ministry-xml-generator'

const xml = generateMinistryDataXML({
  developer: developerData,
  properties: propertiesArray
})
```

### 3. Validation

```typescript
import { validateMinistryDataXML } from '@/lib/ministry-xml-generator'

const validation = validateMinistryDataXML({
  developer: developerData,
  properties: propertiesArray
})

console.log('Valid:', validation.valid)
console.log('Errors:', validation.errors)
console.log('Warnings:', validation.warnings)
```

## What Fields Are Included

All **58 ministry-required fields** per Schema 1.13:

### Developer Info (28 fields)
- Company details (name, legal form, NIP, REGON, KRS)
- Contact info (phone, email, website)
- Headquarters address (8 fields)
- Sales location address (8 fields)
- Additional info (contact methods, etc.)

### Property Info (30 fields)
- Location (województwo, powiat, gmina, etc.)
- Property details (type, number)
- Pricing (price/m², base price, final price with dates)
- Related parts (parking spaces)
- Related premises (storage rooms)
- Additional obligations
- Surface area

## Differences from Existing System

### OLD: Harvester XML (`/api/public/{clientId}/data.xml`)
- **Purpose:** Metadata for dane.gov.pl catalog
- **Contains:** URL pointing to CSV file
- **Schema:** `urn:otwarte-dane:harvester:1.13`

### NEW: Property Data XML (`/api/public/{clientId}/prices.xml`)
- **Purpose:** Actual property pricing data
- **Contains:** All apartment details with 58 fields
- **Schema:** `urn:otwarte-dane:mieszkania:1.13`

**Both are needed!** Harvester tells ministry where to find data, Property XML contains the actual data.

## Testing

Run the build to verify:
```bash
npm run build
```

Look for: `✓ /api/public/[clientId]/prices.xml`

## Integration into Dashboard

Add download/send buttons:

```typescript
// In dashboard component
const handleDownloadMinistryXML = async () => {
  const response = await fetch(`/api/public/${clientId}/prices.xml`)
  const blob = await response.blob()
  // Download file
}
```

## Monitoring

Check response headers:
```
X-Generated-At: timestamp
X-Schema-Version: 1.13
X-Properties-Count: number of properties
X-Validation-Status: valid/warnings
```

## Troubleshooting

### Error: "Developer not found"
- Check `clientId` is correct
- Verify developer exists in database

### Error: "No properties"
- Returns empty XML (valid, just no offers)
- Add properties to developer's projects

### Validation warnings
- Check console logs
- Review missing optional fields
- System still generates XML

## Support

See full documentation: `MINISTRY_XML_IMPLEMENTATION.md`

---

**Status:** ✅ Production Ready
**Build:** ✅ Compiles Successfully
**Tests:** ✅ All Checks Passed
