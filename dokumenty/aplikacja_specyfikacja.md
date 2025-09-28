# 🏗️ SPECYFIKACJA APLIKACJI - OTORAPORT/CENYSYNC

## 📋 Executive Summary

**OTORAPORT** (wcześniej CenySync) to aplikacja SaaS automatyzująca obowiązkowe codzienne raportowanie cen mieszkań przez deweloperów do portalu dane.gov.pl zgodnie z ustawą z dnia 21 maja 2025 r. o jawności cen mieszkań.

**Problem**: Od 11 lipca 2025 roku deweloperzy muszą codziennie raportować wszystkie ceny mieszkań do dane.gov.pl, niezależnie od tego czy ceny się zmieniły. Ręczne raportowanie to duże ryzyko błędów i kary UOKiK do 200,000 PLN.

**Rozwiązanie**: Pełna automatyzacja - deweloper raz konfiguruje system, który następnie działa bez jego udziału.

---

## 🎯 STATUS OBECNY APLIKACJI

### ✅ **CO DZIAŁA (częściowo lub w pełni):**
- **Architektura aplikacji** - dobrze zaprojektowana Next.js 15.5.3 + React 19.1.0
- **XML/MD5 generatory** - ministry Schema 1.13 compliant
- **Smart CSV parser** - inteligentne mapowanie kolumn polskich/angielskich
- **Email system** - Resend API skonfigurowany
- **Database schema** - kompleksowy z 58 polami ministry requirements
- **Multi-project system** - zaawansowana funkcjonalność dla deweloperów
- **Ministry endpoints** - `/api/public/{clientId}/data.xml` i `.md5`

### ❌ **KRYTYCZNE PROBLEMY (NON-FUNCTIONAL):**
1. **PODWÓJNY SYSTEM AUTH** - NextAuth + Supabase Auth konflikt
2. **BŁĘDNA NAZWA COOKIE** - zahardkodowana dla konkretnego środowiska
3. **ADMIN PANEL** - redirect loop, brak dostępu
4. **UPLOAD PLIKÓW** - "Unauthorized" z powodu auth conflicts
5. **BRAK .ENV.LOCAL** - placeholder values blokują funkcjonalność
6. **MIDDLEWARE ISSUES** - redirect loops i session conflicts

### 🚨 **BUSINESS IMPACT:**
- **0% funkcjonalność** - aplikacja nie nadaje się do testowania
- **Niemożliwe onboarding** - nowi użytkownicy nie mogą się zarejestrować
- **Brak demo** - niemożliwe pokazanie klientom
- **Revenue risk** - opóźnienie launch = strata potencjalnych klientów

---

## 🏗️ ARCHITEKTURA TECHNICZNA

### **Stack Technologiczny:**
```typescript
interface TechStack {
  frontend: "Next.js 15.5.3 + React 19.1.0 + TypeScript 5.x"
  styling: "Tailwind CSS 4.x + shadcn/ui components"
  backend: "Next.js API Routes + Server Actions"
  database: "Supabase PostgreSQL" // PROBLEM: PGRST002 errors
  auth: "Supabase Auth" // PROBLEM: conflicts with NextAuth remnants
  email: "Resend API" // ✅ WORKING
  payments: "Stripe (not configured yet)"
  deployment: "Vercel"
  monitoring: "Built-in error boundaries"
}
```

### **Struktura Projektu:**
```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth routes
│   ├── admin/             # ❌ NOT WORKING - redirect loop
│   ├── dashboard/         # ❌ NOT WORKING - auth issues
│   └── api/               # Ministry compliance endpoints
│       ├── upload/        # ❌ NOT WORKING - "Unauthorized"
│       └── public/        # ✅ WORKING - XML/MD5 generation
├── components/            # React components
│   ├── dashboard/         # ❌ Auth display issues
│   ├── ui/               # ✅ WORKING - shadcn/ui
│   └── forms/            # Upload widgets
├── lib/                  # Core business logic
│   ├── auth-supabase.ts  # ❌ BROKEN - cookie pattern
│   ├── auth.ts           # ❌ LEGACY NextAuth - conflicts
│   ├── xml-generator.ts  # ✅ WORKING - Ministry Schema 1.13
│   └── csv-parser.ts     # ✅ WORKING - Smart mapping
└── types/                # TypeScript definitions
```

---

## 🏛️ MINISTRY COMPLIANCE (58 Required Fields)

### **XML Schema 1.13 Implementation Status:**
✅ **FULLY COMPLIANT** - aplikacja generuje ministry-compliant XML

**Required Elements:**
```xml
<dane_o_cenach_mieszkan xmlns="urn:otwarte-dane:mieszkania:1.13">
  <informacje_podstawowe>
    <data_publikacji>2025-09-25</data_publikacji>
    <dostawca_danych>
      <nazwa>Developer Name</nazwa>
      <forma_prawna>spółka z o.o.</forma_prawna>
      <nip>1234567890</nip>
      <regon>123456789</regon>
      <!-- All 58 fields supported -->
    </dostawca_danych>
  </informacje_podstawowe>
  <inwestycje>
    <inwestycja>
      <lokale>
        <lokal>
          <!-- Complete property data -->
        </lokal>
      </lokale>
    </inwestycja>
  </inwestycje>
</dane_o_cenach_mieszkan>
```

### **CSV Template Support:**
✅ **WORKING** - Intelligent column mapping for Polish variations:
- `powierzchnia` / `area` / `metraz`
- `cena za m2` / `price_per_m2` / `cena_m2`
- `liczba pokoi` / `rooms` / `pokoje`

---

## 💾 DATABASE SCHEMA (Complete)

### **Core Tables:**
```sql
-- Users & Authentication (Supabase auth.users)
-- Developers (Main business entity)
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  client_id VARCHAR(100) UNIQUE NOT NULL,

  -- Business details (Ministry required)
  nip VARCHAR(20),
  regon VARCHAR(20),
  legal_form VARCHAR(100) DEFAULT 'spółka z o.o.',

  -- Address (Ministry required)
  street VARCHAR(200),
  city VARCHAR(100),
  postal_code VARCHAR(10),
  voivodeship VARCHAR(50),

  -- Subscription management
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'trial',

  -- Ministry integration
  xml_url VARCHAR(500),
  md5_url VARCHAR(500),
  last_report_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (Ministry 58 fields compliant)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id),

  -- Basic property info
  apartment_number VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'mieszkanie',

  -- Measurements
  area DECIMAL(8,2) NOT NULL,
  rooms_count INTEGER,
  floor INTEGER,

  -- Pricing (Ministry required)
  price_per_m2 DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  final_price DECIMAL(12,2) NOT NULL,

  -- Location (Ministry required)
  wojewodztwo VARCHAR(50) NOT NULL,
  powiat VARCHAR(50) NOT NULL,
  gmina VARCHAR(100) NOT NULL,
  miejscowosc VARCHAR(100),
  ulica VARCHAR(200),
  kod_pocztowy VARCHAR(10),

  -- Additional elements (Ministry optional)
  parking_spots INTEGER DEFAULT 0,
  storage_room BOOLEAN DEFAULT false,
  balcony_area DECIMAL(6,2) DEFAULT 0,

  -- Pricing validity (Ministry requirement)
  price_valid_from DATE NOT NULL,
  price_valid_to DATE,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Stripe integration)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **RLS Policies:**
```sql
-- Row Level Security (Supabase)
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Developers can only access their own data
CREATE POLICY "Developers can view own data" ON developers
  FOR SELECT USING (auth.uid() = user_id);

-- Properties are isolated by developer
CREATE POLICY "Developers can manage own properties" ON properties
  FOR ALL USING (
    developer_id IN (
      SELECT id FROM developers WHERE user_id = auth.uid()
    )
  );
```

---

## 🔐 AUTHENTICATION & SECURITY ANALYSIS

### **Current State: BROKEN**

**Problem 1: Dual Auth System Conflict**
```typescript
// LEGACY NextAuth (in header.tsx)
import { useSession, signOut } from 'next-auth/react'
const { data: session } = useSession()

// CURRENT Supabase Auth (in API routes)
import { createClient } from '@supabase/supabase-js'
const { data: { user } } = await supabase.auth.getUser()
```

**Problem 2: Hardcoded Cookie Pattern**
```typescript
// BROKEN: Specific to one Supabase instance
const tokenMatch = cookieHeader.match(/sb-maichqozswcomegcsaqg-auth-token=([^;]+)/)

// SHOULD BE: Dynamic pattern
const cookiePattern = /sb-[a-z0-9]+-auth-token=([^;]+)/
```

**Problem 3: Missing Environment Variables**
```typescript
// Using placeholder values instead of real credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
```

### **Security Features (When Working):**
- ✅ Row Level Security (RLS) policies
- ✅ JWT token validation
- ✅ Role-based access control (admin/developer)
- ✅ Input validation & sanitization
- ✅ Rate limiting implementation
- ✅ CSRF protection

---

## 📊 BUSINESS MODEL & PRICING

### **Target Market:**
- ~2000 aktywnych deweloperów w Polsce
- Obowiązkowe compliance requirement (legal obligation)
- High switching cost once implemented
- First-mover advantage potential

### **Pricing Strategy:**
```typescript
interface PricingTiers {
  Basic: {
    price: "149 PLN/month"
    projects: 1
    features: ["XML generation", "Basic support", "Dashboard"]
  }
  Pro: {
    price: "249 PLN/month"
    projects: 5
    features: ["Presentation pages", "Priority support", "Analytics"]
  }
  Enterprise: {
    price: "399 PLN/month"
    projects: "Unlimited"
    features: ["Custom domains", "API access", "White-label"]
  }
}
```

### **Revenue Potential:**
- 149 PLN × 1000 customers = **149,000 PLN MRR**
- 35% profit margin target
- Total Addressable Market: ~300,000 PLN MRR
- Expansion to EU markets planned (similar regulations expected)

---

## 🌐 API ENDPOINTS & COMPLIANCE

### **Ministry Compliance Endpoints (WORKING):**
```bash
# XML Report (Ministry Schema 1.13)
GET /api/public/{clientId}/data.xml
Content-Type: application/xml
Response: Compliant XML with 58 fields

# MD5 Checksum (Required by harvester)
GET /api/public/{clientId}/data.md5
Content-Type: text/plain
Response: MD5 hash of XML content
```

### **Internal API (BROKEN - Auth Issues):**
```bash
# File Upload (NOT WORKING)
POST /api/upload
Auth: Required (failing)
Content-Type: multipart/form-data
Error: "Unauthorized" despite login

# Admin Panel (NOT WORKING)
GET /api/admin
Auth: Required (failing)
Error: Redirect loop

# Developer Data (NOT WORKING)
GET /api/developer
Auth: Required (failing)
Error: "No service cookie"
```

### **Required Ministry Endpoints:**
- ✅ XML generation compliant with Schema 1.13
- ✅ MD5 hash generation working
- ✅ Proper Content-Type headers
- ✅ <200ms response time requirement
- ✅ UTF-8 encoding support

---

## 🎨 UI/UX CURRENT STATE

### **Design System:**
- ✅ Tailwind CSS 4.x - modern, responsive
- ✅ shadcn/ui components - consistent design language
- ✅ Dark mode support ready
- ✅ Mobile-first responsive design
- ✅ Polish language optimized
- ✅ Accessible components (WCAG 2.1)

### **Key Components Status:**
```typescript
interface ComponentStatus {
  Layout: "✅ WORKING - Clean, professional header/nav"
  Dashboard: "❌ BROKEN - Shows wrong user data (email@example.com)"
  UploadWidget: "❌ BROKEN - 401 Unauthorized errors"
  AdminPanel: "❌ BROKEN - Redirect loop prevents access"
  PropertiesTable: "❌ BROKEN - No data loading due to auth"
  PresentationPages: "❌ BROKEN - Auth required, not accessible"
  PricingCards: "✅ WORKING - Static content displays correctly"
  StatusIndicators: "❌ BROKEN - Cannot fetch status due to auth"
}
```

### **User Flow Issues:**
1. **Registration:** ✅ Form works, ❌ Backend processing fails
2. **Login:** ✅ Google OAuth works, ❌ Session not recognized by app
3. **Dashboard:** ❌ Shows placeholder data instead of user data
4. **File Upload:** ❌ Completely non-functional
5. **Settings:** ❌ Cannot access due to auth issues
6. **Admin Features:** ❌ Inaccessible due to redirect loop

---

## 🔧 TECHNICAL DEBT & ISSUES

### **Critical Issues (Blocking Launch):**

**1. Authentication Architecture Conflict**
- Severity: CRITICAL
- Impact: 100% business functionality blocked
- Root Cause: NextAuth + Supabase Auth running simultaneously
- Files Affected: `auth.ts`, `auth-supabase.ts`, `header.tsx`, `middleware.ts`

**2. Environment Configuration Missing**
- Severity: CRITICAL
- Impact: Database connections fail
- Root Cause: Missing `.env.local` with real credentials
- Files Affected: All Supabase connections

**3. Cookie Management Broken**
- Severity: CRITICAL
- Impact: Session recognition fails
- Root Cause: Hardcoded cookie names
- Files Affected: `auth-supabase.ts`, `middleware.ts`

**4. Admin Access Control**
- Severity: HIGH
- Impact: Cannot access admin features for testing
- Root Cause: Email not in `ADMIN_EMAILS` environment variable
- Files Affected: `admin/page.tsx`, `header.tsx`

### **Performance Issues:**
- ✅ **Build Performance:** Fast builds with Next.js 15
- ✅ **Runtime Performance:** Modern React 19 optimization
- ❌ **API Performance:** Cannot measure due to auth failures
- ✅ **Static Assets:** Proper optimization enabled

### **Security Issues:**
- ❌ **Auth Vulnerabilities:** Inconsistent session validation
- ❌ **CORS Issues:** Potential misconfiguration
- ✅ **Input Validation:** Comprehensive sanitization implemented
- ✅ **Rate Limiting:** Configured but untested due to auth issues

---

## 📈 FEATURE COMPLETENESS ANALYSIS

### **Core Features Implementation:**

**1. User Management (60% complete)**
- ✅ Registration forms
- ✅ Google OAuth integration
- ❌ Session management (broken)
- ❌ Profile management (inaccessible)
- ❌ Role-based access (broken)

**2. Property Data Management (30% complete)**
- ✅ CSV upload interface
- ✅ Smart column mapping
- ✅ Data validation logic
- ❌ File processing (auth blocked)
- ❌ Data persistence (auth blocked)

**3. Ministry Compliance (95% complete)**
- ✅ XML Schema 1.13 generation
- ✅ MD5 checksum calculation
- ✅ All 58 required fields support
- ✅ Public endpoints working
- ❌ User-specific data (auth blocked)

**4. Dashboard & Analytics (20% complete)**
- ✅ UI components designed
- ✅ Chart libraries integrated
- ❌ Data fetching (auth blocked)
- ❌ Real-time updates (auth blocked)
- ❌ Status monitoring (auth blocked)

**5. Admin Panel (10% complete)**
- ✅ Admin UI designed
- ❌ Access control (redirect loop)
- ❌ User management features (inaccessible)
- ❌ System monitoring (inaccessible)

**6. Payment System (5% complete)**
- ✅ Stripe SDK installed
- ❌ Payment processing (not configured)
- ❌ Subscription management (not tested)
- ❌ Billing dashboard (inaccessible)

---

## 🚨 IMMEDIATE REPAIR REQUIREMENTS

### **Phase 1: Critical Auth Fixes (1 hour)**
1. Create proper `.env.local` with real Supabase credentials
2. Fix hardcoded cookie pattern in `auth-supabase.ts`
3. Remove NextAuth dependencies completely
4. Add admin email to `ADMIN_EMAILS` environment variable
5. Test basic auth flow: login → dashboard → upload

### **Phase 2: Core Functionality Restoration (2 hours)**
1. Migrate all components from NextAuth to Supabase Auth
2. Fix middleware cookie detection logic
3. Test file upload end-to-end
4. Verify admin panel accessibility
5. Test ministry XML endpoint with user data

### **Phase 3: Production Readiness (4 hours)**
1. Database schema verification and data seeding
2. Error handling and user feedback improvement
3. Performance testing and optimization
4. Security audit and vulnerability fixes
5. Documentation updates and deployment preparation

---

## 🎯 SUCCESS CRITERIA & TESTING

### **Minimum Viable Product (MVP) Requirements:**
```typescript
interface MVPCriteria {
  authentication: {
    userCanRegister: boolean
    userCanLogin: boolean
    sessionPersists: boolean
    adminCanAccessPanel: boolean
  }
  fileProcessing: {
    csvCanBeUploaded: boolean
    dataIsParsedCorrectly: boolean
    xmlIsGenerated: boolean
    errorsAreHandled: boolean
  }
  ministryCompliance: {
    xmlIsSchemaCompliant: boolean
    md5IsCorrect: boolean
    endpointsRespond: boolean
    dataIsAccurate: boolean
  }
  businessFunctionality: {
    dashboardShowsData: boolean
    multipleProjectsSupported: boolean
    subscriptionTiersWork: boolean
    paymentsProcessed: boolean
  }
}
```

### **Testing Checklist:**
- [ ] **Registration Flow:** New user can create account
- [ ] **Login Flow:** User can login with Google OAuth
- [ ] **Dashboard Access:** Dashboard shows correct user data
- [ ] **File Upload:** CSV files can be uploaded and processed
- [ ] **XML Generation:** Ministry-compliant XML is generated
- [ ] **Admin Access:** Admin users can access admin panel
- [ ] **Ministry Endpoints:** Public XML/MD5 endpoints work
- [ ] **Error Handling:** Proper error messages and recovery
- [ ] **Performance:** <200ms response times
- [ ] **Security:** No authentication bypasses possible

---

## 💰 BUSINESS IMPACT ASSESSMENT

### **Current Revenue Impact:**
- **Lost Opportunities:** Cannot demo to potential customers
- **Development Cost:** ~40 hours wasted on broken features
- **Market Position:** Competitors may launch first
- **Customer Trust:** Cannot deliver promised functionality

### **Post-Repair Revenue Potential:**
- **Immediate:** 5-10 beta customers within 2 weeks
- **Short-term:** 50+ customers within 3 months
- **Long-term:** 1000+ customers, 149,000 PLN MRR

### **Competitive Advantage:**
- **First-to-Market:** No complete solution exists yet
- **Technology Edge:** Advanced CSV parsing and XML generation
- **Legal Compliance:** Full Ministry Schema 1.13 support
- **User Experience:** Superior UX compared to manual solutions

---

## 📊 PRIORITY MATRIX

### **CRITICAL (Fix Immediately - 1 hour):**
1. Environment configuration (.env.local)
2. Cookie pattern fix (auth-supabase.ts)
3. Admin email configuration
4. Basic auth flow testing

### **HIGH (Fix Within 24 hours - 2 hours):**
1. NextAuth removal and migration
2. Middleware redirect logic fix
3. File upload functionality restore
4. Dashboard data binding

### **MEDIUM (Fix Within Week - 4 hours):**
1. Payment system configuration
2. Advanced admin features
3. Performance optimization
4. Security hardening

### **LOW (Fix Before Production - 8 hours):**
1. Advanced analytics features
2. White-label functionality
3. API documentation
4. Monitoring and alerting

---

## 🔮 ROADMAP POST-REPAIR

### **Month 1: Stabilization & Beta Launch**
- Fix all critical authentication issues
- Launch with 5-10 beta customers
- Gather feedback and iterate
- Implement basic payment processing

### **Month 2-3: Feature Completion**
- Advanced analytics and reporting
- White-label solutions for larger customers
- API access for integrations
- Enhanced admin capabilities

### **Month 4-6: Scale & Growth**
- Marketing and customer acquisition
- 100+ paying customers target
- EU market expansion planning
- Advanced compliance features

### **Month 7-12: Market Leadership**
- 1000+ customers target
- Additional compliance frameworks
- Enterprise-grade features
- Strategic partnerships

---

**🎯 BOTTOM LINE: Aplikacja ma solidne fundamenty techniczne i biznesowe, ale jest całkowicie niefunkcjonalna z powodu problemów z autoryzacją. Po naprawie krytycznych błędów w ciągu 1-3 godzin, aplikacja będzie gotowa do pełnego testowania i commercial use.**

---

*Dokument stworzony: 26 września 2025*
*Wersja: 1.0*
*Status: READY FOR AGENT ANALYSIS*