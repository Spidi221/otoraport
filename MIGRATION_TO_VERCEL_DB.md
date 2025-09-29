# 🚀 MIGRATION TO VERCEL POSTGRES DATABASE

## Problem with Supabase
- Persistent PGRST002 "Could not query the database for the schema cache" errors
- 503 Service Unavailable on REST API calls
- PostgREST schema cache issues after restarts

## Solution: Vercel Postgres + Next.js

### Step 1: Install Vercel Postgres
```bash
npm install @vercel/postgres
npm install drizzle-orm drizzle-kit
```

### Step 2: Create Vercel Database
```bash
# In Vercel Dashboard:
# 1. Go to Storage tab
# 2. Create New Database → Postgres
# 3. Copy connection string
```

### Step 3: Environment Variables
```env
# Add to .env.local
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NO_SSL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

### Step 4: Database Schema
```sql
-- Create tables in Vercel Postgres
CREATE TABLE developers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  client_id VARCHAR(100) UNIQUE NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'trial',
  nip VARCHAR(20),
  xml_url VARCHAR(500),
  md_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID REFERENCES developers(id),
  property_number VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'mieszkanie',
  area DECIMAL(8,2) NOT NULL,
  price_per_m2 DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  final_price DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  wojewodztwo VARCHAR(50) NOT NULL,
  powiat VARCHAR(50) NOT NULL,
  gmina VARCHAR(100) NOT NULL,
  miejscowosc VARCHAR(100),
  ulica VARCHAR(200),
  kod_pocztowy VARCHAR(10),
  price_valid_from DATE NOT NULL,
  price_valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID REFERENCES developers(id),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 5: Replace Supabase Client
```typescript
// lib/vercel-db.ts
import { sql } from '@vercel/postgres';

export async function getDeveloperByEmail(email: string) {
  const { rows } = await sql`
    SELECT * FROM developers WHERE email = ${email}
  `;
  return rows[0] || null;
}

export async function createDeveloper(data: any) {
  const { rows } = await sql`
    INSERT INTO developers (user_id, email, company_name, client_id)
    VALUES (${data.user_id}, ${data.email}, ${data.company_name}, ${data.client_id})
    RETURNING *
  `;
  return rows[0];
}

export async function getPropertiesByDeveloper(developerId: string) {
  const { rows } = await sql`
    SELECT * FROM properties WHERE developer_id = ${developerId}
    ORDER BY created_at DESC
  `;
  return rows;
}
```

### Step 6: Update API Routes
```typescript
// Replace all Supabase calls with Vercel Postgres
import { getDeveloperByEmail, createDeveloper } from '@/lib/vercel-db';

// Instead of:
// const { data } = await supabase.from('developers').select('*')

// Use:
// const developer = await getDeveloperByEmail(email)
```

### Benefits of Vercel Postgres:
✅ No PostgREST schema cache issues
✅ Direct SQL queries (no REST API layer)
✅ Better performance on Vercel
✅ Built-in connection pooling
✅ Same hosting provider as frontend
✅ No more 503 Service Unavailable errors

### Migration Timeline:
- **Phase 1**: Set up Vercel DB + migrate core tables (2 hours)
- **Phase 2**: Update auth system (1 hour)
- **Phase 3**: Migrate API routes (2 hours)
- **Phase 4**: Test & deploy (1 hour)
- **Total: ~6 hours for complete migration**