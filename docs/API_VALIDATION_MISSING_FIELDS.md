# API Documentation: `/api/validation/missing-fields`

**Task #90.1** - API Endpoint Contract and Response Schema

## Overview

This endpoint analyzes a developer's properties and returns a comprehensive summary of missing required ministerial fields, format errors, and business logic warnings. It uses the `ministry-validation.ts` service (Task #89) for validation.

## Endpoint

```
GET /api/validation/missing-fields
```

## Authentication

Requires authenticated user session (Supabase Auth).

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `developerId` | UUID | No | Developer ID to analyze. If omitted, uses authenticated user's developer profile. |

## Response Schema

### Success Response (200 OK)

```typescript
{
  success: true,
  data: {
    summary: {
      totalProperties: number         // Total properties analyzed
      propertiesWithIssues: number    // Properties with validation errors/warnings
      propertiesValid: number         // Fully compliant properties
      complianceScore: number         // 0-100% ministry compliance score
    },
    missingFieldsSummary: {
      [fieldName: string]: {
        count: number                 // How many properties are missing this field
        percentage: number            // Percentage of properties (0-100)
        severity: 'critical' | 'warning' | 'info'
        fieldLabel: string            // Human-readable field name (Polish)
      }
    },
    properties: Array<{
      id: string                      // Property UUID
      propertyNumber: string          // Apartment/unit number
      address: string                 // Formatted address
      status: 'valid' | 'invalid'     // Overall validation status
      errors: Array<{
        field: string
        message: string               // Polish error message
        severity: 'critical' | 'warning' | 'info'
        value?: string | number       // Actual value (if applicable)
      }>
      warnings: Array<{...}>          // Same structure as errors
      missingRequired: string[]       // Array of required field names missing
      missingRecommended: string[]    // Array of recommended field names missing
      invalidFormats: string[]        // Array of fields with format errors
    }>
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Developer profile not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Example Request

```bash
# Using authenticated user's developer profile
GET /api/validation/missing-fields

# Using specific developer ID
GET /api/validation/missing-fields?developerId=550e8400-e29b-41d4-a716-446655440000
```

## Example Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProperties": 150,
      "propertiesWithIssues": 23,
      "propertiesValid": 127,
      "complianceScore": 87
    },
    "missingFieldsSummary": {
      "kod_pocztowy": {
        "count": 15,
        "percentage": 10.0,
        "severity": "critical",
        "fieldLabel": "Kod pocztowy"
      },
      "ulica": {
        "count": 8,
        "percentage": 5.3,
        "severity": "info",
        "fieldLabel": "Ulica"
      }
    },
    "properties": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "propertyNumber": "B5/2",
        "address": "Bolszewo, ul. Strażacka",
        "status": "invalid",
        "errors": [
          {
            "field": "kod_pocztowy",
            "message": "Kod pocztowy jest wymagany",
            "severity": "critical"
          }
        ],
        "warnings": [
          {
            "field": "price_consistency",
            "message": "Niezgodność cen: cena całkowita (299000 zł) różni się od iloczynu ceny za m² × powierzchnia (295000 zł, różnica: 1.3%)",
            "severity": "warning"
          }
        ],
        "missingRequired": ["kod_pocztowy"],
        "missingRecommended": ["ulica"],
        "invalidFormats": []
      }
    ]
  }
}
```

## Validation Rules

### Required Fields (Critical)
- Województwo (voivodeship)
- Powiat (county)
- Gmina (municipality)
- Miejscowość (city/town)
- Kod pocztowy (postal code, format: XX-XXX)
- Cena za m² (price per m²)
- Cena całkowita (total price)
- Powierzchnia (area in m²)
- Nr lokalu (property/apartment number)
- Nazwa dewelopera (developer name)
- NIP (tax ID, 10 digits with checksum validation)

### Conditionally Required Fields
- **Nr KRS**: Required for Sp. z o.o., S.A., S.K.A. (corporations)
- **Nr CEIDG**: Required for sole proprietorships

### Recommended Fields (Warning)
- Ulica (street)
- Numer nieruchomości (building number)
- Data pierwszej oferty (first offer date)
- Rodzaj nieruchomości (property type)
- Liczba pokoi (rooms count)
- Kondygnacja (floor level)
- Cena bazowa (base price)
- Cena finalna (final price)
- Rok budowy (construction year)

### Format Validations
- **NIP**: 10 digits with Polish checksum algorithm
- **REGON**: 9 or 14 digits
- **Kod pocztowy**: XX-XXX format (e.g., 84-230)
- **Email**: Valid email format
- **Dates**: YYYY-MM-DD format, not in future
- **Phone**: Polish format (+48 XXX XXX XXX)
- **KRS**: 10 digits
- **CEIDG**: 5-20 characters

### Business Logic Validations
- **Price consistency**: `price_per_m2 × area ≈ total_price` (±5% tolerance)
- **Area range**: 10-500 m² (warning if outside)
- **Price range**: 1,000-50,000 zł/m² (warning if outside)
- **Rooms count**: 1-20 rooms
- **Construction year**: 1900 to current year + 5

## Integration with Ministry Validation Service

This endpoint uses the comprehensive validation service from Task #89:

```typescript
import { validateProperties } from '@/lib/ministry-validation'

// Convert database properties to ParsedProperty format
const validationResult = validateProperties(parsedProperties)

// Use validation results to build response
```

## Use Cases

1. **Dashboard Quality Widget**: Show compliance score and top missing fields
2. **Property Upload Feedback**: Immediate validation feedback after CSV upload
3. **Ministry Submission Pre-check**: Verify data quality before XML/MD5 generation
4. **Data Quality Reports**: Periodic reports for developers to improve compliance

## Performance Considerations

- For developers with >1000 properties, consider pagination
- Results can be cached for 5 minutes (properties change infrequently)
- Validation runs in-memory (no database writes)

## Security

- RLS policies enforce data isolation (developers see only their properties)
- Admin users can specify `developerId` to audit any developer
- Regular users must use their own developer profile
