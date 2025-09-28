# 🔧 Wymagania Techniczne API - CenySync

## 🌐 **Endpointy Publiczne**

### 1. XML Endpoint (dla ministerstwa)
```
GET https://cenysync.pl/api/public/{client_id}/data.xml
```

**Wymagania:**
- **Content-Type:** `application/xml; charset=utf-8`
- **Encoding:** UTF-8 BOM
- **Cache-Control:** `public, max-age=3600`
- **Czas odpowiedzi:** <200ms (p95)
- **Dostępność:** 99.95% SLA

**Przykładowa implementacja:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  const data = await getPropertiesData(params.clientId);
  const xmlData = generateXML113(data);
  
  return new Response(xmlData, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Schema-Version': '1.13',
      'X-Generated-At': new Date().toISOString()
    }
  });
}
```

### 2. Markdown Endpoint (dla ludzi)
```
GET https://cenysync.pl/api/public/{client_id}/data.md
```

**Wymagania:**
- **Content-Type:** `text/markdown; charset=utf-8`
- **Czas odpowiedzi:** <150ms
- **SEO-friendly:** strukturalny markdown z metadanymi

**Format odpowiedzi:**
```markdown
# Cennik Mieszkań - {Nazwa Inwestycji}

## 📊 Podsumowanie
- **Deweloper:** {Nazwa firmy}
- **Lokalizacja:** {Adres}
- **Data aktualizacji:** {YYYY-MM-DD}
- **Dostępne lokale:** {liczba}

## 🏠 Lista Mieszkań

### Mieszkanie nr {numer}
- **Powierzchnia:** {XX.X} m²
- **Pokoje:** {X}
- **Piętro:** {X}
- **Cena:** {XXX,XXX} PLN ({X,XXX} PLN/m²)
- **Status:** {dostępny/zarezerwowany/sprzedany}
```

### 3. JSON API (dla aplikacji)
```
GET https://cenysync.pl/api/public/{client_id}/data.json
```

**Struktura odpowiedzi:**
```json
{
  "developer": {
    "name": "string",
    "nip": "string",
    "contact": { ... }
  },
  "projects": [
    {
      "id": "string",
      "name": "string", 
      "location": { ... },
      "properties": [
        {
          "number": "string",
          "area": "number",
          "rooms": "number",
          "floor": "number",
          "price_per_m2": "number",
          "total_price": "number",
          "status": "enum",
          "features": { ... }
        }
      ]
    }
  ],
  "metadata": {
    "schema_version": "1.13",
    "generated_at": "ISO-8601",
    "total_properties": "number"
  }
}
```

---

## 🔍 **Walidacja i Monitoring**

### Schema Validation
```typescript
import Ajv from 'ajv';

const schema = {
  type: 'object',
  required: ['developer', 'projects', 'metadata'],
  properties: {
    developer: {
      type: 'object',
      required: ['name', 'nip'],
      properties: {
        name: { type: 'string', minLength: 1 },
        nip: { type: 'string', pattern: '^[0-9]{10}$' }
      }
    },
    projects: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'name', 'properties'],
        properties: {
          properties: {
            type: 'array',
            items: {
              type: 'object',
              required: ['number', 'area', 'total_price', 'status'],
              properties: {
                area: { type: 'number', minimum: 10, maximum: 500 },
                total_price: { type: 'number', minimum: 50000 },
                status: { enum: ['available', 'reserved', 'sold'] }
              }
            }
          }
        }
      }
    }
  }
};

const ajv = new Ajv();
const validate = ajv.compile(schema);
```

### Health Check Endpoint
```
GET https://cenysync.pl/api/health
```

**Odpowiedź:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-11T21:30:00Z",
  "version": "1.13.0",
  "dependencies": {
    "database": "healthy",
    "file_storage": "healthy",
    "email_service": "healthy"
  },
  "performance": {
    "avg_response_time": "120ms",
    "error_rate": "0.01%",
    "uptime": "99.97%"
  }
}
```

### Metrics & Alerts
```typescript
// Prometheus metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeDeployments = new prometheus.Gauge({
  name: 'cenysync_active_developers',
  help: 'Number of active developers'
});

// Alert conditions
const alerts = [
  {
    name: 'HighResponseTime',
    condition: 'avg_response_time > 500ms for 5min',
    action: 'notify_ops_team'
  },
  {
    name: 'LowAvailability', 
    condition: 'uptime < 99.5% for 15min',
    action: 'escalate_to_oncall'
  },
  {
    name: 'ErrorRateHigh',
    condition: 'error_rate > 5% for 2min',
    action: 'auto_rollback'
  }
];
```

---

## 🔐 **Bezpieczeństwo API**

### Rate Limiting
```typescript
const rateLimits = {
  '/api/public/*': {
    windowMs: 60000, // 1 minute
    max: 100, // requests per window
    message: 'Too many requests, try again later'
  },
  '/api/admin/*': {
    windowMs: 60000,
    max: 20,
    keyGenerator: (req) => req.ip + ':' + req.headers.authorization
  }
};
```

### CORS Policy
```typescript
const corsOptions = {
  origin: [
    'https://dane.gov.pl',
    'https://*.ministerstwo.gov.pl', 
    'https://cenysync.pl',
    /^https:\/\/.*\.cenysync\.pl$/
  ],
  methods: ['GET', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
```

### Authentication (Admin endpoints)
```typescript
// JWT token dla admin operacji
const authMiddleware = async (req: Request) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return null; // Continue
  } catch (error) {
    return new Response('Invalid token', { status: 403 });
  }
};
```

---

## 📊 **Performance Requirements**

### Response Times (95th percentile)
- **XML endpoint:** <200ms
- **MD endpoint:** <150ms  
- **JSON endpoint:** <100ms
- **Health check:** <50ms

### Throughput
- **Peak load:** 1000 req/sec per endpoint
- **Sustained load:** 100 req/sec
- **Concurrent users:** 10,000

### Storage & Caching
```typescript
// Redis cache configuration
const cacheConfig = {
  xml_data: {
    ttl: 3600, // 1 hour
    key_pattern: 'xml:{client_id}:{hash}'
  },
  md_data: {
    ttl: 1800, // 30 minutes  
    key_pattern: 'md:{client_id}:{hash}'
  },
  health_status: {
    ttl: 60, // 1 minute
    key_pattern: 'health:status'
  }
};

// CDN cache headers
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=3600, max-age=1800',
  'CDN-Cache-Control': 'max-age=86400',
  'Cloudflare-CDN-Cache-Control': 'max-age=86400',
  'ETag': generateETag(content),
  'Last-Modified': lastModified.toUTCString()
};
```

---

## 🚀 **Deployment & Infrastructure**

### Vercel Configuration
```javascript
// vercel.json
{
  "functions": {
    "src/app/api/public/[clientId]/data.xml/route.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  "headers": [
    {
      "source": "/api/public/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=3600, max-age=1800"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/robots.txt",
      "destination": "/api/robots"
    }
  ]
}
```

### Environment Variables
```bash
# Production
NEXT_PUBLIC_API_URL=https://cenysync.pl
NEXT_PUBLIC_CDN_URL=https://cdn.cenysync.pl

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Monitoring  
SENTRY_DSN=https://xxx@sentry.io/xxx
PROMETHEUS_PUSH_GATEWAY=https://prometheus.cenysync.pl

# Performance
REDIS_URL=redis://redis.cenysync.pl:6379
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=5000
```

---

## ✅ **Testing Strategy**

### Load Testing (k6)
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 }, // Ramp up
    { duration: '10m', target: 1000 }, // Peak load
    { duration: '5m', target: 0 } // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% under 200ms
    http_req_failed: ['rate<0.01'], // <1% errors
  }
};

export default function() {
  const response = http.get('https://cenysync.pl/api/public/demo_client_123/data.xml');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'content type is XML': (r) => r.headers['Content-Type'].includes('application/xml'),
    'contains required elements': (r) => r.body.includes('<dane_o_cenach_mieszkan>'),
  });
}
```

### Integration Tests
```typescript
describe('API Integration Tests', () => {
  test('XML endpoint returns valid schema 1.13', async () => {
    const response = await fetch('/api/public/demo_client_123/data.xml');
    const xmlText = await response.text();
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(xmlText).toContain('<wersja_schematu>1.13</wersja_schematu>');
    
    // XML Schema validation
    const isValid = validateXMLSchema(xmlText, SCHEMA_1_13);
    expect(isValid).toBe(true);
  });
  
  test('Markdown endpoint renders correctly', async () => {
    const response = await fetch('/api/public/demo_client_123/data.md');
    const markdown = await response.text();
    
    expect(response.status).toBe(200);
    expect(markdown).toContain('# Cennik Mieszkań');
    expect(markdown).toContain('## 📊 Podsumowanie');
    expect(markdown).toMatch(/\*\*Cena:\*\* \d{1,3}(,\d{3})* PLN/);
  });
});
```

**Status:** ✅ **Production Ready**  
**Wersja API:** 1.13.0  
**Ostatnia aktualizacja:** 11.09.2025