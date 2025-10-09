# 📊 OTORAPORT v2 - GAP ANALYSIS & FEATURE ROADMAP PRD

**Dokument:** Product Requirements Document
**Data:** 2025-10-08
**Wersja:** 1.0
**Status:** Draft for Task Master Parsing
**Autor:** AI Analysis + Competitive Research

---

## 🎯 EXECUTIVE SUMMARY

Ten dokument analizuje obecny stan aplikacji OTORAPORT v2, identyfikuje luki funkcjonalne w porównaniu z obietnicami landing page oraz konkurencją, i definiuje roadmap development dla osiągnięcia production-ready SaaS w pełni zgodnego z najlepszymi praktykami rynku 2025.

**Status obecny:** 10/10 tasków core ukończonych (Tasks 36-45)
**Główne braki:** Trial system, wymagana karta przy rejestracji, admin panel, analytics, price history
**Priorytet:** Security, trial enforcement, subscription limits, admin tools

---

## 📋 SPIS TREŚCI

1. [Analiza 10 Pytań Klienta](#1-analiza-10-pytań-klienta)
2. [Competitive Insights Summary](#2-competitive-insights-summary)
3. [Gap Analysis Matrix](#3-gap-analysis-matrix)
4. [Feature Roadmap (Phases 46-60)](#4-feature-roadmap-phases-46-60)
5. [Technical Requirements](#5-technical-requirements)
6. [Security & Compliance Recommendations](#6-security--compliance-recommendations)
7. [Admin Panel Specifications](#7-admin-panel-specifications)
8. [Analytics & Monitoring](#8-analytics--monitoring)
9. [Pricing & Trial Implementation](#9-pricing--trial-implementation)
10. [Success Metrics](#10-success-metrics)

---

## 1. ANALIZA 10 PYTAŃ KLIENTA

### ❓ PYTANIE 1: Usuwanie plików i aktualizacja danych ministerstwa

**Status obecny:** ✅ CZĘŚCIOWO ZAIMPLEMENTOWANE

**Co działa:**
- DELETE endpoint dla pojedynczych properties (`DELETE /api/properties?id={propertyId}`)
- RLS enforcement (`.eq('developer_id', developer.id)`)
- UI: Properties Table z możliwością bulk selection (checkbox)

**Co NIE działa:**
- ❌ Brak bulk delete API endpoint
- ❌ Brak "Delete All" confirmation flow w UI
- ❌ XML/CSV/MD5 nie aktualizują się automatycznie po usunięciu (cache problem)
- ❌ Brak historii operacji delete (audit log)

**Rekomendacja:**
```typescript
// TASK 46: Implement Bulk Delete & Cache Invalidation
// Priority: HIGH

// 1. New API endpoint
POST /api/properties/bulk-delete
Body: { propertyIds: string[] }

// 2. Cache invalidation strategy
// - Revalidate XML/CSV/MD5 endpoints on delete
// - Update revalidate timestamp w DB

// 3. UI enhancements
// - "Delete Selected" button w Properties Table
// - Confirmation modal z preview liczby properties
// - Success/error toast notifications
```

---

### ❓ PYTANIE 2: Normy bezpieczeństwa

**Status obecny:** ✅ BARDZO DOBRE

**Zaimplementowane security features:**

1. **Authentication & Authorization:**
   - ✅ Supabase Auth (email/password + Google OAuth)
   - ✅ Row Level Security (RLS) na wszystkich tabelach
   - ✅ User ID verification w każdym API endpoint

2. **Data Protection:**
   - ✅ HTTPS everywhere
   - ✅ Environment variables (secrets never committed)
   - ✅ Input validation (Zod schemas)
   - ✅ SQL injection prevention (Supabase client escaping)
   - ✅ XSS prevention (sanitizeInput, sanitizeInputAdvanced)

3. **Rate Limiting:**
   - ✅ Upstash Redis rate limiting
   - ✅ Auth endpoints: 5 req/15min
   - ✅ API endpoints: 100 req/15min
   - ✅ Public ministry: 60 req/1min
   - ✅ Upload endpoints: 10 req/hour

4. **Security Headers:**
   - ✅ X-Frame-Options: DENY
   - ✅ X-Content-Type-Options: nosniff
   - ✅ X-XSS-Protection: 1; mode=block
   - ✅ Content-Security-Policy
   - ✅ Referrer-Policy

5. **Password & Validation:**
   - ✅ Password strength validation
   - ✅ NIP/REGON validation
   - ✅ Email validation
   - ✅ File type/size validation

**Braki:**
- ❌ Brak 2FA (Two-Factor Authentication)
- ❌ Brak session timeout enforcement
- ❌ Brak IP whitelisting (dla admin)
- ❌ Brak CAPTCHA na signup/login
- ❌ Brak automated vulnerability scanning

**Rekomendacja:**
```typescript
// TASK 47: Enhanced Security Features
// Priority: MEDIUM

// 1. Implement 2FA via Supabase Auth
// 2. Add session timeout (30min inactivity)
// 3. IP whitelist dla admin routes
// 4. Google reCAPTCHA v3 na signup/login
// 5. Snyk/Dependabot automated scanning
```

**Verdict:** 🟢 **Normy bezpieczeństwa SPEŁNIONE** (production-ready)

---

### ❓ PYTANIE 3: Funkcje z landing page vs. implementacja

**Landing Page Promises:**

1. ✅ **"Gotowe endpointy dla dane.gov.pl"**
   - ZAIMPLEMENTOWANE: `/api/public/[clientId]/data.xml`, `.csv`, `.md5`

2. ✅ **"XML format 1.13 zgodny z COI"**
   - ZAIMPLEMENTOWANE: Harvester XML generator z 58 polami

3. ✅ **"Smart CSV Parser z 58 polami"**
   - ZAIMPLEMENTOWANE: `smart-csv-parser.ts` z automatic column detection

4. ✅ **"Konfiguracja poniżej 10 minut"**
   - ZAIMPLEMENTOWANE: Upload → Parse → Endpoints (działa)

5. ✅ **"Wsparcie CSV, XML i Excel"**
   - ZAIMPLEMENTOWANE: PapaParse (CSV), XML, XLSX support

6. ✅ **"Zero ręcznej pracy"**
   - ZAIMPLEMENTOWANE: Automatic refresh co 60s (XML), CSV auto-generated

7. ⚠️ **"14 dni za darmo"**
   - CZĘŚCIOWO: Pricing page pokazuje "14-day trial", ale **NIE MA ENFORCEMENT**

8. ⚠️ **"Zaawansowane analytics"** (Pro plan promise)
   - CZĘŚCIOWO: Dashboard Statistics Cards (Task 42), ale brak:
     - Historical trends charts
     - Competitor benchmarking
     - Predictive analytics
     - Export to PDF/Excel

9. ⚠️ **"Historia cen"** (Pro plan promise)
   - NIE ZAIMPLEMENTOWANE: Brak price history tracking

10. ❌ **"Priority support"** (Pro/Enterprise plan)
    - NIE ZAIMPLEMENTOWANE: Support system nie istnieje

11. ❌ **"Custom subdomena z cenami"** (Enterprise plan)
    - NIE ZAIMPLEMENTOWANE: White label nie istnieje

12. ❌ **"API access"** (Enterprise plan)
    - NIE ZAIMPLEMENTOWANE: Public API dla third-party nie istnieje

**Gap Summary:**
- ✅ Core compliance functionality: 100% OK
- ⚠️ Trial & subscription enforcement: 40% OK
- ❌ Advanced features (analytics, API, white label): 10% OK

---

### ❓ PYTANIE 4: System pakietów i limitów

**Status obecny:** ✅ ZAIMPLEMENTOWANE (Subscription Plans)

**Istniejące plany (subscription-plans.ts):**

```typescript
// PODSTAWA DZIAŁAŁA - subscription-plans.ts

basic: {
  price: 14900, // 149zł
  propertiesLimit: 20,
  projectsLimit: 1,
  features: ['Do 20 mieszkań', '1 inwestycja', 'Automatyczne XML/MD5', ...]
}

pro: {
  price: 24900, // 249zł
  propertiesLimit: null, // unlimited
  projectsLimit: 2,
  additionalProjectFee: 5000, // +50zł za projekt
  features: ['Unlimited mieszkania', '2 inwestycje bazowo', ...]
}

enterprise: {
  price: 39900, // 399zł
  propertiesLimit: null,
  projectsLimit: null,
  features: ['Unlimited wszystko', 'Custom subdomena', ...]
}
```

**Funkcje sprawdzania limitów:**
- ✅ `canAddProperty()` - checks property limit
- ✅ `canAddProject()` - checks project limit
- ✅ `checkSubscriptionLimits()` - async DB query dla actual usage
- ✅ `calculateMonthlyCost()` - oblicza koszt z additional projects

**PROBLEM:** ❌ **Limity NIE SĄ EGZEKWOWANE w API endpoints!**

**Upload endpoint (`/api/upload/route.ts`):**
```typescript
// CURRENT CODE - NO LIMIT CHECK! ❌
export async function POST(request: NextRequest) {
  // ... auth ...
  // ... developer profile ...

  // ❌ BRAKUJE:
  // const limitCheck = await checkSubscriptionLimits(developer.id);
  // if (!limitCheck.withinLimits) {
  //   return NextResponse.json({ error: 'Limit exceeded' }, { status: 403 });
  // }

  // ... parse and insert properties ...
}
```

**Properties API (`/api/properties/route.ts`):**
```typescript
// GET endpoint - no filtering by plan! ❌
// Should paginate differently dla basic (max 20 show) vs pro (all)
```

**Rekomendacja:**
```typescript
// TASK 48: Enforce Subscription Limits Across All Endpoints
// Priority: HIGH (CRITICAL)

// 1. Create middleware dla limit checking
export async function enforceSubscriptionLimits(
  request: NextRequest,
  developer: Developer
) {
  const limits = await checkSubscriptionLimits(developer.id);

  if (!limits.withinLimits) {
    return NextResponse.json({
      error: 'Subscription limit exceeded',
      limits: limits.limits,
      currentUsage: limits.currentUsage,
      recommendations: limits.recommendations,
      upgradeUrl: '/dashboard/settings#subscription'
    }, { status: 403 });
  }
}

// 2. Apply to endpoints:
// - /api/upload (before parse)
// - /api/properties/bulk (before insert)
// - /api/properties/route.ts POST (before create)

// 3. UI enforcement:
// - Disable upload button if limit reached
// - Show upgrade modal instead of error
// - Display progress bars (18/20 properties used)
```

**Verdict:** 🟡 **System pakietów ISTNIEJE, ale NIE DZIAŁA** (needs enforcement)

---

### ❓ PYTANIE 5: 14-dniowy trial period

**Status obecny:** ❌ NIE ZAIMPLEMENTOWANE

**Co mamy:**
- Landing page: "14 dni za darmo"
- Landing page: "Bez zobowiązań"
- Stripe checkout session (`create-checkout-session/route.ts`)

**Co NIE działa:**
- ❌ Brak trial period tracking w DB
- ❌ Brak `trial_ends_at` timestamp w `developers` table
- ❌ Brak automatycznego sprawdzania trial status
- ❌ Brak blokowania dostępu po trial expiry
- ❌ Brak reminder emails (3 dni przed końcem trial)
- ❌ Brak "Trial 7 days left" banner w dashboard

**Stripe Checkout:**
```typescript
// CURRENT CODE - NO TRIAL! ❌
const session = await stripe().checkout.sessions.create({
  mode: 'subscription',
  // ❌ Brakuje:
  // subscription_data: {
  //   trial_period_days: 14,
  //   trial_settings: {
  //     end_behavior: {
  //       missing_payment_method: 'cancel'
  //     }
  //   }
  // }
})
```

**Rekomendacja:**
```typescript
// TASK 49: Implement 14-Day Trial System
// Priority: HIGH (CRITICAL - obietnica na landing page!)

// 1. Database schema update
ALTER TABLE developers ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE developers ADD COLUMN trial_status TEXT DEFAULT 'active';
  CHECK (trial_status IN ('active', 'expired', 'converted'));

// 2. Stripe configuration
subscription_data: {
  trial_period_days: 14,
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel' // Cancel if no card
    }
  }
}

// 3. Middleware dla trial checking
export async function checkTrialStatus(developer: Developer) {
  if (!developer.trial_ends_at) return { valid: true };

  const now = new Date();
  const trialEnd = new Date(developer.trial_ends_at);

  if (now > trialEnd && developer.trial_status === 'active') {
    // Update DB
    await updateTrialStatus(developer.id, 'expired');

    // Block access
    return {
      valid: false,
      message: 'Trial expired. Subscribe to continue.',
      daysRemaining: 0
    };
  }

  const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  return { valid: true, daysRemaining };
}

// 4. UI components
// - Trial countdown banner (days remaining)
// - "Upgrade Now" CTA
// - Trial expired blocker screen

// 5. Email notifications
// - Day 1: Welcome email
// - Day 7: Midway reminder
// - Day 11: "3 days left" alert
// - Day 14: Trial expired notice
```

**Competitive Analysis:**
- ASARI CRM: ✅ "Free trial (no credit card)"
- EstiCRM: ❌ No free trial
- Eksporta.pl: ❌ Unknown (contact sales)

**Verdict:** 🔴 **Trial system BRAK** (landing page kłamie!)

---

### ❓ PYTANIE 6: Wymagana karta przy rejestracji (0zł → 14 dni → charge)

**Status obecny:** ❌ NIE ZAIMPLEMENTOWANE

**Standard SaaS flow (Stripe):**
1. User rejestruje się
2. Wybiera plan (Basic/Pro/Enterprise)
3. **Podaje kartę kredytową** (authorization 0zł)
4. Trial 14 dni (no charge)
5. Po 14 dniach: automatic charge (149zł/249zł/399zł)
6. Jeśli nie chce płacić: cancel przed końcem trial

**Co mamy obecnie:**
```typescript
// create-checkout-session/route.ts

// ❌ PROBLEM: Brak trial configuration
const session = await stripe().checkout.sessions.create({
  mode: 'subscription',
  // Brakuje trial_period_days!
  // Brakuje trial_settings!
})

// ❌ PROBLEM: Można anulować checkout
// User może kliknąć X i używać app bez karty
```

**Co trzeba zmienić:**

**1. Signup flow:**
```typescript
// auth/signup/page.tsx

// CURRENT: Email → Password → Signup → Dashboard ✅
// SHOULD BE: Email → Password → Signup → Select Plan → Add Card → Dashboard

// New flow:
1. User submits email/password (creates auth.users)
2. Redirect to /onboarding/select-plan
3. User selects Basic/Pro/Enterprise
4. Redirect to /onboarding/payment
5. Stripe Checkout (with trial_period_days: 14)
6. On success → redirect to /dashboard
7. On cancel → redirect to /onboarding/payment (blocker)
```

**2. Stripe Checkout:**
```typescript
// TASK 50: Require Card on Signup with 14-Day Trial
// Priority: HIGH

const session = await stripe().checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],

  // ✅ Add trial configuration
  subscription_data: {
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel' // Important!
      }
    },
    metadata: {
      developer_id: developer.id,
      selected_plan: 'basic' // or 'pro', 'enterprise'
    }
  },

  // ✅ Require complete payment info upfront
  payment_method_collection: 'always',

  // ✅ Prevent skipping (no cancel_url that allows bypass)
  cancel_url: `${baseUrl}/onboarding/payment?error=payment_required`,
  success_url: `${baseUrl}/dashboard?trial=started`
})
```

**3. Database tracking:**
```typescript
// developers table additions

ALTER TABLE developers ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE developers ADD COLUMN subscription_status TEXT;
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid'));
ALTER TABLE developers ADD COLUMN trial_start DATE;
ALTER TABLE developers ADD COLUMN trial_end DATE;
ALTER TABLE developers ADD COLUMN next_billing_date DATE;
```

**4. Webhook handling:**
```typescript
// /api/stripe/webhook/route.ts

// Handle these events:
switch (event.type) {
  case 'customer.subscription.created':
    // Trial started (card added successfully)
    await updateDeveloper({
      subscription_status: 'trialing',
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end
    });
    break;

  case 'customer.subscription.trial_will_end':
    // 3 days before trial ends
    await sendTrialEndingEmail(developer, 3);
    break;

  case 'invoice.payment_succeeded':
    // First payment after trial
    await updateDeveloper({
      subscription_status: 'active',
      trial_end: null
    });
    await sendPaymentConfirmationEmail(developer);
    break;

  case 'invoice.payment_failed':
    // Payment declined
    await updateDeveloper({ subscription_status: 'past_due' });
    await sendPaymentFailedEmail(developer);
    break;

  case 'customer.subscription.deleted':
    // User canceled
    await updateDeveloper({ subscription_status: 'canceled' });
    await sendCancellationConfirmationEmail(developer);
    break;
}
```

**5. Access control:**
```typescript
// Middleware dla blocking access

export async function checkSubscriptionAccess(developer: Developer) {
  const { subscription_status, trial_end } = developer;

  // Allow access during trial
  if (subscription_status === 'trialing') {
    const now = new Date();
    const trialEnd = new Date(trial_end);

    if (now <= trialEnd) {
      return { allowed: true, type: 'trial', daysRemaining: daysDiff(now, trialEnd) };
    } else {
      return { allowed: false, reason: 'trial_expired' };
    }
  }

  // Allow access for active subs
  if (subscription_status === 'active') {
    return { allowed: true, type: 'paid' };
  }

  // Block for past_due, canceled, unpaid
  return {
    allowed: false,
    reason: subscription_status,
    action: subscription_status === 'past_due' ? 'update_payment' : 'resubscribe'
  };
}
```

**Rekomendacja:**
```typescript
// TASK 50: Implement Card-Required Trial Flow
// Priority: HIGH (CRITICAL)

// Subtasks:
// 50.1: Update signup flow (add plan selection + payment step)
// 50.2: Configure Stripe Checkout dla trial
// 50.3: Add DB columns dla subscription tracking
// 50.4: Implement webhook handlers (trial events)
// 50.5: Create access control middleware
// 50.6: Build blocker screens (trial expired, payment failed)
// 50.7: Email automation (trial reminders, payment confirmations)
```

**Competitive Analysis:**
- **Standard SaaS:** Stripe/Paddle require card upfront (Shopify, ClickUp, Notion)
- **ASARI CRM:** "Free trial (no credit card)" ← Different model!
- **Most competitors:** Unknown (contact sales model)

**Decision:**
User wants: "Karta przy rejestracji → 0zł auth → 14 dni → auto-charge"

**Verdict:** 🔴 **Card requirement BRAK** (must implement for production)

---

### ❓ PYTANIE 7: Analityka (Vercel Analytics, Google Analytics, Sentry)

**Status obecny:** ⚠️ CZĘŚCIOWO ZAIMPLEMENTOWANE

**Co JEST w kodzie:**

1. **Sentry (Error Tracking):**
```typescript
// sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
// ✅ Configured dla client, server, edge
// ✅ DSN: NEXT_PUBLIC_SENTRY_DSN w env
```

2. **Performance Monitoring:**
```typescript
// src/lib/performance.ts
// ✅ measureWebVitals() - tracks LCP, FID, CLS
// ✅ measureAPIResponseTime()
// ✅ Basic logging
```

3. **Analytics Library:**
```typescript
// src/lib/analytics.ts
// ✅ trackEvent() function
// ❌ NIE JEST UŻYWANE nigdzie w app!
```

**Co NIE DZIAŁA:**

1. ❌ **Google Analytics:** Brak GA4 tracking code
2. ❌ **Vercel Analytics:** Brak @vercel/analytics package
3. ❌ **PostHog/Mixpanel:** Brak advanced product analytics
4. ❌ **Event tracking:** analytics.ts exists ale nie jest używane
5. ❌ **User behavior tracking:** Brak heatmaps, session recordings
6. ❌ **Conversion tracking:** Brak signup/upload/payment funnels

**Rekomendacja:**
```typescript
// TASK 51: Implement Comprehensive Analytics Stack
// Priority: MEDIUM (important for product decisions)

// 1. Google Analytics 4
// - Add GA4 tracking code to layout.tsx
// - Track pageviews automatically
// - Custom events: signup, upload_success, subscription_start

// 2. Vercel Analytics
npm install @vercel/analytics

// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />

// 3. PostHog (Product Analytics)
npm install posthog-js

// Key events to track:
// - User signup
// - File upload (success/failure)
// - Property status change
// - Subscription upgrade
// - Dashboard visit frequency
// - Feature adoption (notifications, statistics)

// 4. Sentry improvements
// - Add user context (developer ID, email)
// - Add breadcrumbs (navigation, API calls)
// - Performance transactions

// 5. Custom dashboard analytics
// - User retention (DAU/WAU/MAU)
// - Upload success rate
// - Ministry endpoint health
// - Subscription churn rate
```

**Competitive Insights:**
- **Modern SaaS:** GA4 + PostHog/Mixpanel + Sentry (standard stack)
- **Real estate CRM:** Custom analytics dashboards (EstiCRM, ASARI)
- **Best practice:** Track everything, decide later what matters

**Verdict:** 🟡 **Analytics CZĘŚCIOWO OK** (Sentry configured, ale GA4/Vercel brak)

---

### ❓ PYTANIE 8: Historia cen mieszkań (Price History Tracking)

**Status obecny:** ❌ NIE ZAIMPLEMENTOWANE

**Landing page promise (Pro plan):**
- "Historia cen" - listed jako feature

**Current database schema:**
```sql
-- properties table

CREATE TABLE properties (
  id UUID PRIMARY KEY,
  price NUMERIC NOT NULL,
  price_per_m2 NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- ❌ BRAK: price_history JSON[] or separate table
);
```

**Problem:**
- Jeśli deweloper updateuje `price` property, **stara cena jest tracona**
- Brak tracking zmian cen w czasie
- Niemożliwe pokazanie trendu "cena wzrosła o 5% w tym miesiącu"

**Rekomendacja:**
```typescript
// TASK 52: Implement Price History Tracking
// Priority: MEDIUM (Pro plan feature)

// 1. Create price_history table

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,

  -- Price data
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  old_price_per_m2 NUMERIC NOT NULL,
  new_price_per_m2 NUMERIC NOT NULL,

  -- Change tracking
  change_percent NUMERIC, -- calculated
  change_reason TEXT, -- 'manual_update', 'bulk_import', 'api_sync'
  changed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT price_history_property_id_idx ON price_history(property_id),
  CONSTRAINT price_history_developer_id_idx ON price_history(developer_id),
  CONSTRAINT price_history_changed_at_idx ON price_history(changed_at DESC)
);

-- RLS policies
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view own price history"
  ON price_history FOR SELECT
  USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

// 2. Trigger dla automatic tracking

CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if price actually changed
  IF OLD.price != NEW.price THEN
    INSERT INTO price_history (
      property_id,
      developer_id,
      old_price,
      new_price,
      old_price_per_m2,
      new_price_per_m2,
      change_percent,
      change_reason,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.developer_id,
      OLD.price,
      NEW.price,
      OLD.price_per_m2,
      NEW.price_per_m2,
      ((NEW.price - OLD.price) / OLD.price) * 100,
      'manual_update', -- or from trigger context
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_change_tracker
  AFTER UPDATE OF price ON properties
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

// 3. API endpoint

GET /api/properties/[id]/price-history
Response: {
  property: { id, apartment_number, current_price },
  history: [
    {
      date: "2025-10-01",
      old_price: 450000,
      new_price: 460000,
      change_percent: 2.22,
      change_reason: "manual_update"
    },
    // ...
  ]
}

// 4. UI component - PriceHistoryChart

// - Line chart (Recharts)
// - X-axis: dates
// - Y-axis: price
// - Tooltip: detailed change info
// - Export to CSV button

// 5. Dashboard integration

// - "Price Trends" card
// - Show properties with biggest price changes
// - Alert dla suspicious changes (>20% in 1 day)
```

**Competitive Insights:**
- **voxCRM:** History tracking (unknown details)
- **Modern SaaS:** Audit logs standard (price changes, status changes)
- **Best practice:** Track ALL changes (not just price)

**Verdict:** 🔴 **Price history BRAK** (Pro plan feature not delivered)

---

### ❓ PYTANIE 9: Admin Panel i uprawnienia

**Status obecny:** ⚠️ CZĘŚCIOWO ZAIMPLEMENTOWANE

**Co JEST:**
```typescript
// src/components/admin/admin-dashboard.tsx
// ✅ File exists (UI component dla admin dashboard)

// .env
ADMIN_EMAILS=admin@otoraport.pl
// ✅ Admin emails configured
```

**Co NIE DZIAŁA:**

1. ❌ **Brak admin route** (`/admin/dashboard` nie istnieje)
2. ❌ **Brak admin middleware** (checking if user is admin)
3. ❌ **Brak admin API endpoints** (manage users, view all properties, etc.)
4. ❌ **Admin panel UI nie jest podłączony** do żadnej route

**Email chudziszewski221@gmail.com jako admin:**
```typescript
// ❌ PROBLEM: Hardcoded w .env
ADMIN_EMAILS=admin@otoraport.pl

// ✅ SHOULD BE:
ADMIN_EMAILS=admin@otoraport.pl,chudziszewski221@gmail.com

// ✅ BETTER: DB table 'admins' with roles
```

**Rekomendacja:**
```typescript
// TASK 53: Build Complete Admin Panel
// Priority: HIGH (critical for management)

// 1. Database schema dla admin roles

CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
    CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Example permissions:
{
  "developers": {
    "view": true,
    "edit": true,
    "delete": false
  },
  "properties": {
    "view": true,
    "edit": false,
    "delete": false
  },
  "subscriptions": {
    "view": true,
    "edit": true,
    "refund": true
  },
  "system": {
    "view_logs": true,
    "modify_settings": true
  }
}

// 2. Admin middleware

// src/middleware/admin.ts
export async function requireAdmin(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect('/auth/signin');
  }

  // Check if user is admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role, permissions')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) {
    return NextResponse.redirect('/dashboard?error=unauthorized');
  }

  // Attach admin context
  request.adminRole = adminRole;
  return NextResponse.next();
}

// 3. Admin routes

// app/admin/layout.tsx (with middleware)
// app/admin/dashboard/page.tsx
// app/admin/users/page.tsx
// app/admin/properties/page.tsx
// app/admin/subscriptions/page.tsx
// app/admin/settings/page.tsx
// app/admin/logs/page.tsx

// 4. Admin API endpoints

// GET /api/admin/users
// - List all developers
// - Search/filter (by email, subscription, status)
// - Pagination

// PATCH /api/admin/users/[id]
// - Update user subscription
// - Grant/revoke permissions
// - Suspend/activate account

// GET /api/admin/properties
// - View ALL properties (cross-developer)
// - Filter by status, price range, location
// - Export to CSV

// GET /api/admin/analytics
// - System-wide metrics
// - Revenue dashboard
// - User growth charts
// - Top developers (by revenue)

// GET /api/admin/logs
// - Audit logs (all user actions)
// - Error logs (Sentry integration)
// - API call logs

// POST /api/admin/notifications
// - Send system-wide announcements
// - Email all users
// - In-app notification broadcast

// 5. Admin Panel Features (must-have)

**User Management:**
- View all users (developers)
- Search by email/company name
- Filter by subscription plan
- View user details (properties count, subscription status)
- Edit user subscription (upgrade/downgrade)
- Suspend/delete account
- Impersonate user (for support)
- View user activity log

**Property Management:**
- View all properties across all developers
- Search by address, apartment number
- Filter by status, price range
- Bulk actions (approve, reject, delete)
- Export filtered results to CSV

**Subscription Management:**
- View all subscriptions
- Revenue dashboard (MRR, ARR)
- Churn analytics
- Failed payments list
- Refund management
- Coupon/promo code creation

**Analytics Dashboard:**
- User growth (signups/day, week, month)
- Revenue trends
- Upload success rate
- Ministry endpoint health (uptime)
- Top errors (from Sentry)
- Feature adoption (which features are used most)

**System Settings:**
- Update pricing plans (prices, limits)
- Manage feature flags (enable/disable features)
- Configure email templates
- Update ministry XML schema version
- View system status (DB health, Redis, Stripe)

**Audit Logs:**
- All user actions (login, upload, delete)
- All admin actions (user edits, subscription changes)
- API calls (with response times)
- Error logs (with stack traces)
- Export logs to CSV

**Notifications:**
- Send system announcements (in-app banner)
- Email broadcasts (all users or filtered)
- Scheduled maintenance notices

// 6. RBAC (Role-Based Access Control)

const roles = {
  super_admin: {
    // Full access to everything
    permissions: ['*']
  },
  admin: {
    // Most things except system settings
    permissions: [
      'users.view', 'users.edit',
      'properties.view', 'properties.delete',
      'subscriptions.view', 'subscriptions.edit',
      'analytics.view',
      'logs.view'
    ]
  },
  support: {
    // Read-only + user impersonation
    permissions: [
      'users.view', 'users.impersonate',
      'properties.view',
      'subscriptions.view',
      'logs.view'
    ]
  },
  viewer: {
    // Read-only analytics
    permissions: [
      'analytics.view'
    ]
  }
};
```

**Competitive Insights:**
- **Modern SaaS:** Advanced admin panels (Retool, Forest Admin)
- **CRM systems:** Built-in admin (EstiCRM, ASARI have admin features)
- **Best practice:** Separate admin subdomain (admin.otoraport.pl)

**Verdict:** 🟡 **Admin panel EXISTS (code) ale NIE DZIAŁA** (no routes, no DB)

---

### ❓ PYTANIE 10: Research konkurencji - co jeszcze powinniśmy mieć?

**Summary z competitive research:**

**Top Missing Features (vs. competitors):**

1. **White Label / Custom Domains** (Enterprise feature)
   - Galactica Virgo: ✅ Dedykowane strony www
   - WykazCen.pl: ✅ Subdomain (developer.wykazcen.pl)
   - OTORAPORT: ❌ Brak

2. **Third-Party Integrations**
   - Eksporta.pl: ✅ API dla CRM (EstiCRM, Galactica, ASARI)
   - EstiCRM: ✅ Integracja z 60+ portalami (1-click export)
   - OTORAPORT: ❌ Brak public API

3. **Mobile Apps**
   - voxCRM: ✅ Aplikacja mobilna
   - EstiCRM: ✅ Aplikacja mobilna
   - ASARI: ✅ Mobile CRM
   - OTORAPORT: ❌ Brak

4. **Advanced Analytics**
   - ASARI: ✅ Business analytics
   - Propertyware: ✅ Customizable dashboards
   - OTORAPORT: ⚠️ Basic statistics cards only

5. **Predictive Features (AI/ML)**
   - PropTech 2024 trend: Predictive maintenance, rent predictions
   - OTORAPORT: ❌ Brak AI features

6. **Multi-Language Support**
   - International SaaS: Multi-language standard
   - OTORAPORT: ❌ Polish only

7. **Team Collaboration**
   - Modern SaaS: Multi-user accounts, permissions
   - OTORAPORT: ❌ Single-user only

**Recommended Additions:**

```typescript
// PHASE 3 FEATURES (Post-MVP, Competitive Differentiation)

// TASK 54: Public API dla Third-Party Integrations
// - REST API endpoints (GET /api/v1/properties, etc.)
// - API keys generation
// - Rate limiting per API key
// - API documentation (Swagger/OpenAPI)
// - SDK dla JavaScript/Python

// TASK 55: Webhooks System
// - Subscribe to events (property.created, property.updated, etc.)
// - Webhook delivery with retry logic
// - Webhook logs (dla debugging)

// TASK 56: White Label / Custom Domains (Enterprise)
// - Custom subdomain (client.otoraport.pl)
// - Custom domain (ceny.developerXYZ.pl)
// - SSL/TLS certificate management
// - Custom branding (logo, colors)

// TASK 57: Team Management & Collaboration
// - Invite team members
// - Role-based permissions (Owner, Editor, Viewer)
// - Activity log (who did what, when)
// - Shared workspace

// TASK 58: Advanced Analytics Dashboard
// - Historical charts (price trends over time)
// - Competitor benchmarking (aggregate anonymous data)
// - Predictive analytics (ML models dla price trends)
// - Export reports to PDF/Excel

// TASK 59: Mobile App (React Native)
// - View properties on-the-go
// - Upload photos for properties
// - Push notifications (upload success, errors)
// - QR code scanner (dla quick property access)

// TASK 60: AI-Powered Features
// - Automatic price recommendations (based on market data)
// - Smart column mapping (CSV → DB fields)
// - Anomaly detection (suspicious price changes)
// - Natural language queries ("Show me properties in Warsaw under 500k")
```

---

## 2. COMPETITIVE INSIGHTS SUMMARY

**Market Position:**
- **Direct competitors:** 4-5 (Eksporta.pl, WykazCen.pl, JawneCenyMieszkan.pl, Deweloper Online)
- **CRM with compliance:** 5+ (voxCRM, EstiCRM, ASARI, Galactica Virgo, etc.)
- **Market maturity:** YOUNG (ustawa from July 2025)
- **Barriers to entry:** LOW (API is public, spec is open)

**Competitive Advantages:**
1. ✅ **Technical excellence** - TypeScript, RLS, modern stack
2. ✅ **Security first** - production-grade from day 1
3. ⚠️ **Transparent pricing** - should be public (currently "contact sales" mentality)
4. ❌ **Developer-first** - public API missing
5. ⚠️ **Modern UX** - good dashboard, but missing onboarding
6. ❌ **Analytics** - basic stats, no insights

**Weaknesses vs. Competition:**
1. ❌ **No integrations** - competitors integrate with CRM
2. ❌ **No mobile app** - competitors have mobile
3. ❌ **No white label** - competitors offer branded solutions
4. ❌ **No team features** - single-user only
5. ⚠️ **No trial enforcement** - competitors have working trials

**Pricing Benchmark:**
- EstiCRM: 129 PLN/month (all-in-one, cheapest)
- ASARI: 97-223 PLN/user/month (per-user pricing)
- OTORAPORT: 149 PLN (Basic), 249 PLN (Pro), 399 PLN (Enterprise)

**Verdict:** OTORAPORT is **competitive on core features**, but **lacks ecosystem play** (API, integrations, mobile).

---

## 3. GAP ANALYSIS MATRIX

| Feature Category | Promised (Landing Page) | Implemented | Gap | Priority |
|-----------------|------------------------|-------------|-----|----------|
| **Core Compliance** |
| XML/CSV/MD5 endpoints | ✅ | ✅ | None | ✅ DONE |
| Smart CSV parser | ✅ | ✅ | None | ✅ DONE |
| 58 ministry fields | ✅ | ✅ | None | ✅ DONE |
| Automatic refresh | ✅ | ✅ | None | ✅ DONE |
| **Subscription & Billing** |
| 14-day free trial | ✅ | ❌ | NO TRIAL SYSTEM | 🔴 CRITICAL |
| Card required at signup | ✅ (implied) | ❌ | NO CARD REQUIREMENT | 🔴 CRITICAL |
| Subscription limits | ✅ | ⚠️ | NOT ENFORCED | 🔴 CRITICAL |
| Stripe integration | ✅ | ✅ | Checkout works | ✅ DONE |
| **Security & Compliance** |
| RLS policies | ✅ | ✅ | None | ✅ DONE |
| Rate limiting | ✅ | ✅ | None | ✅ DONE |
| Input validation | ✅ | ✅ | None | ✅ DONE |
| GDPR compliance | ✅ | ✅ | None | ✅ DONE |
| 2FA | ❌ | ❌ | Nice-to-have | 🟡 MEDIUM |
| **Analytics & Insights** |
| Basic dashboard | ✅ | ✅ | None | ✅ DONE |
| Statistics cards | ✅ | ✅ | None | ✅ DONE |
| Historical charts | ✅ (Pro) | ❌ | NO CHARTS | 🟡 MEDIUM |
| Price history | ✅ (Pro) | ❌ | NO TRACKING | 🟡 MEDIUM |
| Competitor benchmarking | ❌ | ❌ | Future feature | 🔵 LOW |
| **Admin & Management** |
| Admin panel UI | ❌ | ⚠️ | EXISTS BUT NOT WIRED | 🔴 CRITICAL |
| User management | ❌ | ❌ | NO ADMIN ROUTES | 🔴 CRITICAL |
| Audit logs | ❌ | ❌ | NO LOGGING | 🟡 MEDIUM |
| System monitoring | ❌ | ⚠️ | SENTRY ONLY | 🟡 MEDIUM |
| **Advanced Features** |
| Public API | ✅ (Enterprise) | ❌ | NO API | 🟡 MEDIUM |
| Webhooks | ❌ | ❌ | Future feature | 🔵 LOW |
| White label | ✅ (Enterprise) | ❌ | NO CUSTOM DOMAINS | 🔵 LOW |
| Mobile app | ❌ | ❌ | Future feature | 🔵 LOW |
| Team collaboration | ❌ | ❌ | Single-user only | 🟡 MEDIUM |
| **User Experience** |
| Onboarding flow | ❌ | ❌ | NO GUIDED TOUR | 🟡 MEDIUM |
| Help center | ❌ | ❌ | NO DOCS | 🟡 MEDIUM |
| In-app support | ✅ (ChatWidget) | ✅ | ChatGPT bot exists | ✅ DONE |
| Email notifications | ✅ | ✅ | Basic emails work | ✅ DONE |
| **Integrations** |
| CRM integrations | ❌ | ❌ | Future feature | 🔵 LOW |
| Portal exports | ❌ | ❌ | Not needed for MVP | 🔵 LOW |
| **Monitoring** |
| Google Analytics | ❌ | ❌ | NO GA4 | 🟡 MEDIUM |
| Vercel Analytics | ❌ | ❌ | NO PACKAGE | 🟡 MEDIUM |
| Sentry (errors) | ❌ | ✅ | Configured | ✅ DONE |
| PostHog (product) | ❌ | ❌ | NO TRACKING | 🟡 MEDIUM |

---

## 4. FEATURE ROADMAP (PHASES 46-60)

### 🔴 CRITICAL - MUST HAVE FOR PRODUCTION (Tasks 46-50)

**TASK 46: Implement Bulk Delete & Cache Invalidation**
- **Priority:** HIGH
- **Effort:** 2 days
- **Dependencies:** None
- **Description:**
  - Create `POST /api/properties/bulk-delete` endpoint
  - Accept array of property IDs
  - Revalidate XML/CSV/MD5 endpoints after delete
  - Add "Delete Selected" button to Properties Table
  - Confirmation modal with preview
  - Success/error notifications

**TASK 47: Enhanced Security Features (2FA, Session Timeout, CAPTCHA)**
- **Priority:** MEDIUM (nice-to-have)
- **Effort:** 3 days
- **Dependencies:** None
- **Description:**
  - Implement 2FA via Supabase Auth
  - Add 30min inactivity session timeout
  - IP whitelist dla admin routes
  - Google reCAPTCHA v3 na signup/login
  - Snyk/Dependabot automated scanning

**TASK 48: Enforce Subscription Limits Across All Endpoints**
- **Priority:** CRITICAL (blocks production)
- **Effort:** 3 days
- **Dependencies:** None
- **Description:**
  - Create middleware `enforceSubscriptionLimits()`
  - Apply to `/api/upload`, `/api/properties`, bulk endpoints
  - Return 403 with upgrade message if limit exceeded
  - UI: Disable upload button if limit reached
  - UI: Show progress bars (18/20 properties used)
  - UI: Upgrade modal instead of error toast

**TASK 49: Implement 14-Day Trial System**
- **Priority:** CRITICAL (landing page promise)
- **Effort:** 4 days
- **Dependencies:** None
- **Description:**
  - Add DB columns: `trial_ends_at`, `trial_status`
  - Create middleware `checkTrialStatus()`
  - Block access for expired trials
  - UI: Trial countdown banner (days remaining)
  - UI: Trial expired blocker screen
  - Email: Day 1, 7, 11, 14 notifications

**TASK 50: Implement Card-Required Trial Flow**
- **Priority:** CRITICAL (SaaS standard)
- **Effort:** 5 days
- **Dependencies:** TASK 49
- **Description:**
  - Update signup flow: Email → Password → Plan Selection → Payment → Dashboard
  - Configure Stripe Checkout with `trial_period_days: 14`
  - Add DB columns: `stripe_subscription_id`, `subscription_status`, `next_billing_date`
  - Implement webhook handlers (trial events, payments)
  - Access control middleware (trialing vs active vs past_due)
  - Blocker screens (trial expired, payment failed)
  - Email automation (trial reminders, payment confirmations)

---

### 🟡 HIGH PRIORITY - SHOULD HAVE (Tasks 51-53)

**TASK 51: Implement Comprehensive Analytics Stack**
- **Priority:** MEDIUM (important for decisions)
- **Effort:** 2 days
- **Dependencies:** None
- **Description:**
  - Add Google Analytics 4 tracking code
  - Install @vercel/analytics package
  - Install PostHog for product analytics
  - Track key events: signup, upload, subscription
  - Sentry: add user context, breadcrumbs
  - Custom dashboard: retention, upload success rate, churn

**TASK 52: Implement Price History Tracking**
- **Priority:** MEDIUM (Pro plan feature)
- **Effort:** 3 days
- **Dependencies:** None
- **Description:**
  - Create `price_history` table with RLS
  - Trigger dla automatic price change tracking
  - API endpoint `GET /api/properties/[id]/price-history`
  - UI component: PriceHistoryChart (Recharts line chart)
  - Dashboard integration: "Price Trends" card
  - Alert dla suspicious changes (>20% in 1 day)

**TASK 53: Build Complete Admin Panel**
- **Priority:** HIGH (critical for management)
- **Effort:** 7 days
- **Dependencies:** None
- **Description:**
  - Create `admin_roles` table with permissions
  - Admin middleware (`requireAdmin()`)
  - Admin routes: `/admin/dashboard`, `/admin/users`, `/admin/properties`, etc.
  - Admin API endpoints (manage users, properties, subscriptions)
  - User management (view, edit, suspend, impersonate)
  - Property management (view all, search, bulk actions)
  - Subscription management (revenue dashboard, refunds)
  - Analytics dashboard (system-wide metrics)
  - System settings (pricing, feature flags, email templates)
  - Audit logs (all actions, API calls, errors)
  - Notifications (announcements, email broadcasts)
  - RBAC (super_admin, admin, support, viewer roles)

---

### 🔵 MEDIUM PRIORITY - NICE TO HAVE (Tasks 54-58)

**TASK 54: Public API dla Third-Party Integrations**
- **Priority:** MEDIUM (Enterprise feature)
- **Effort:** 5 days
- **Dependencies:** None
- **Description:**
  - REST API endpoints (`/api/v1/properties`, etc.)
  - API keys generation (developers table)
  - Rate limiting per API key
  - API documentation (Swagger/OpenAPI)
  - SDK dla JavaScript/Python
  - Sandbox environment (testing)

**TASK 55: Webhooks System**
- **Priority:** MEDIUM (modern SaaS feature)
- **Effort:** 3 days
- **Dependencies:** TASK 54
- **Description:**
  - Subscribe to events (property.created, property.updated, etc.)
  - Webhook delivery with retry logic (exponential backoff)
  - Webhook logs (dla debugging)
  - UI: Webhook management (add, test, delete)
  - Webhook signatures (HMAC verification)

**TASK 56: White Label / Custom Domains (Enterprise)**
- **Priority:** LOW (Enterprise only)
- **Effort:** 7 days
- **Dependencies:** None
- **Description:**
  - Custom subdomain (client.otoraport.pl)
  - Custom domain (ceny.developerXYZ.pl)
  - SSL/TLS certificate management (Vercel, Cloudflare)
  - Custom branding (logo, colors, fonts)
  - Branded login/dashboard
  - Custom email templates
  - Domain ownership validation

**TASK 57: Team Management & Collaboration**
- **Priority:** MEDIUM (multi-user feature)
- **Effort:** 5 days
- **Dependencies:** None
- **Description:**
  - Invite team members (email invitations)
  - Role-based permissions (Owner, Editor, Viewer)
  - Activity log (who did what, when)
  - Shared workspace (team sees same properties)
  - User avatar/profile management
  - Team settings page

**TASK 58: Advanced Analytics Dashboard**
- **Priority:** MEDIUM (Pro/Enterprise feature)
- **Effort:** 5 days
- **Dependencies:** TASK 52
- **Description:**
  - Historical charts (price trends over 6 months)
  - Competitor benchmarking (aggregate anonymous data)
  - Predictive analytics (ML models dla price trends)
  - Export reports to PDF/Excel
  - Custom date ranges
  - Drill-down capabilities

---

### 🌟 FUTURE - COMPETITIVE DIFFERENTIATION (Tasks 59-60)

**TASK 59: Mobile App (React Native)**
- **Priority:** LOW (future roadmap)
- **Effort:** 15 days
- **Dependencies:** TASK 54 (API needed)
- **Description:**
  - React Native app (iOS + Android)
  - View properties on-the-go
  - Upload photos for properties
  - Push notifications (upload success, errors)
  - QR code scanner (dla quick property access)
  - Offline mode (basic viewing)

**TASK 60: AI-Powered Features**
- **Priority:** LOW (differentiation)
- **Effort:** 10 days
- **Dependencies:** TASK 52, 58
- **Description:**
  - Automatic price recommendations (based on market data)
  - Smart column mapping (AI-assisted CSV → DB fields)
  - Anomaly detection (suspicious price changes)
  - Natural language queries ("Show me properties in Warsaw under 500k")
  - Predictive churn modeling (which users might cancel)
  - Smart email subject lines (A/B tested by AI)

---

## 5. TECHNICAL REQUIREMENTS

### 5.1 Database Schema Updates

**New Tables:**

```sql
-- Trial tracking
ALTER TABLE developers
  ADD COLUMN trial_ends_at TIMESTAMPTZ,
  ADD COLUMN trial_status TEXT DEFAULT 'active'
    CHECK (trial_status IN ('active', 'expired', 'converted'));

-- Subscription tracking
ALTER TABLE developers
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN subscription_status TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  ADD COLUMN trial_start DATE,
  ADD COLUMN trial_end DATE,
  ADD COLUMN next_billing_date DATE;

-- Price history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  old_price_per_m2 NUMERIC NOT NULL,
  new_price_per_m2 NUMERIC NOT NULL,
  change_percent NUMERIC,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_property_id ON price_history(property_id);
CREATE INDEX idx_price_history_developer_id ON price_history(developer_id);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at DESC);

-- Admin roles
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- API keys (dla public API)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt hash
  key_prefix TEXT NOT NULL, -- "pk_live_abc..." (first 12 chars)
  name TEXT NOT NULL, -- "Production API Key"
  permissions JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  developer_id UUID REFERENCES developers(id),
  action TEXT NOT NULL, -- 'property.created', 'subscription.updated', etc.
  resource_type TEXT NOT NULL, -- 'property', 'developer', 'subscription'
  resource_id UUID,
  changes JSONB, -- before/after values
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_developer_id ON audit_logs(developer_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

### 5.2 API Endpoints Required

**New Endpoints:**

```typescript
// Bulk operations
POST /api/properties/bulk-delete
Body: { propertyIds: string[] }

// Price history
GET /api/properties/[id]/price-history
Query: ?from=2025-01-01&to=2025-12-31

// Trial & subscription management
GET /api/user/trial-status
PATCH /api/user/subscription
DELETE /api/user/subscription (cancel)

// Admin endpoints (requires admin role)
GET /api/admin/users
GET /api/admin/users/[id]
PATCH /api/admin/users/[id]
DELETE /api/admin/users/[id]
GET /api/admin/properties
GET /api/admin/analytics
GET /api/admin/logs
POST /api/admin/notifications (broadcast)

// Public API v1 (Enterprise feature)
GET /api/v1/properties
POST /api/v1/properties
PATCH /api/v1/properties/[id]
DELETE /api/v1/properties/[id]
GET /api/v1/webhooks
POST /api/v1/webhooks
DELETE /api/v1/webhooks/[id]
```

---

### 5.3 Environment Variables

**Required additions:**

```bash
# Stripe Trial Configuration
STRIPE_TRIAL_PERIOD_DAYS=14

# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Admin Panel
ADMIN_EMAILS=admin@otoraport.pl,chudziszewski221@gmail.com

# API Keys (dla public API)
API_KEY_SALT=random-secret-for-bcrypt

# Feature Flags
FEATURE_WEBHOOKS_ENABLED=false
FEATURE_WHITE_LABEL_ENABLED=false
FEATURE_PUBLIC_API_ENABLED=false
```

---

## 6. SECURITY & COMPLIANCE RECOMMENDATIONS

### 6.1 Additional Security Layers

1. **2FA (Two-Factor Authentication):**
   - Use Supabase Auth built-in 2FA
   - Require dla admin accounts
   - Optional dla regular users

2. **Session Management:**
   - 30min inactivity timeout
   - Force logout on password change
   - Device fingerprinting (suspicious login detection)

3. **IP Whitelisting:**
   - Admin routes accessible only from allowed IPs
   - Configurable per admin user
   - Bypass option (for emergencies)

4. **CAPTCHA:**
   - Google reCAPTCHA v3 na signup/login
   - Invisible (no user interaction)
   - Score-based (block low scores)

5. **Vulnerability Scanning:**
   - Snyk integration (npm packages)
   - Dependabot alerts (GitHub)
   - Weekly automated scans

---

### 6.2 GDPR Compliance Enhancements

1. **Data Portability:**
   - Export all user data (JSON/CSV)
   - Include properties, audit logs, emails sent

2. **Right to Deletion:**
   - Cascade delete (properties, logs, API keys)
   - Anonymize instead of delete (dla compliance logs)
   - 30-day retention dla deleted accounts (backup)

3. **Consent Management:**
   - Cookie banner (functional, analytics, marketing)
   - Email preferences (in settings)
   - Audit log of consents

4. **Data Minimization:**
   - Don't store unnecessary data
   - Auto-delete old logs (>1 year)
   - Encrypt PII (email, phone, address)

---

## 7. ADMIN PANEL SPECIFICATIONS

### 7.1 Admin Dashboard (Home)

**Widgets:**

1. **System Health:**
   - DB status (green/yellow/red)
   - Redis status
   - Stripe API status
   - Ministry endpoints uptime

2. **Key Metrics:**
   - Total users (active/inactive)
   - MRR/ARR
   - Signups today/this week
   - Failed payments

3. **Recent Activity:**
   - Last 10 user signups
   - Last 10 subscriptions
   - Last 10 errors (from Sentry)

4. **Quick Actions:**
   - Send announcement
   - Create coupon code
   - Impersonate user (support)

---

### 7.2 User Management

**List View:**
- Table: Email, Company, Subscription, Status, Created
- Search by email/company
- Filter by subscription plan
- Filter by status (active/trial/past_due)
- Pagination (20 per page)

**Detail View:**
- User info (email, company, NIP, phone)
- Subscription details (plan, status, next billing)
- Usage stats (properties count, uploads count)
- Properties list (inline table)
- Activity log (last 50 actions)
- Quick actions:
  - Edit subscription (upgrade/downgrade)
  - Suspend account
  - Delete account (with confirmation)
  - Impersonate (for support)

---

### 7.3 Subscription Management

**Revenue Dashboard:**
- MRR/ARR charts (monthly/annual revenue)
- Churn rate (cancellations/active users)
- Upgrade/downgrade trends
- Top customers (by revenue)

**Failed Payments:**
- List of past_due subscriptions
- Retry payment (manually)
- Send reminder email
- Suspend access (if >7 days overdue)

**Coupon Management:**
- Create coupon (% off or amount off)
- Set expiration date
- Usage limits (per user or total)
- View coupon usage stats

---

### 7.4 Analytics Dashboard

**User Growth:**
- Signups chart (daily/weekly/monthly)
- Active users (DAU/WAU/MAU)
- Retention cohorts

**Revenue Trends:**
- MRR/ARR over time
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)
- Customer acquisition cost (CAC) - manual input

**Feature Adoption:**
- Upload usage (% of users who uploaded)
- Notification usage (% who enabled notifications)
- Statistics page views

**Ministry Endpoints:**
- Uptime (% over last 30 days)
- Response times (avg, p95, p99)
- Error rate (4xx, 5xx)

---

## 8. ANALYTICS & MONITORING

### 8.1 Analytics Stack

**Google Analytics 4:**
- Pageviews (all pages)
- Custom events:
  - `signup` (method: email/google)
  - `upload_start`
  - `upload_success` (properties_count)
  - `upload_error` (error_type)
  - `subscription_start` (plan)
  - `subscription_upgrade` (from, to)
  - `subscription_cancel` (reason)

**Vercel Analytics:**
- Core Web Vitals (LCP, FID, CLS)
- Real user monitoring (RUM)
- Geographic distribution

**PostHog (Product Analytics):**
- Feature flags (A/B testing)
- Funnels:
  - Signup funnel (land → signup → upload)
  - Subscription funnel (trial → paid)
- User paths (where do users go after signup?)
- Cohort analysis (retention over time)

**Sentry (Error Tracking):**
- JavaScript errors (client-side)
- API errors (server-side)
- Performance transactions (slow API calls)
- Breadcrumbs (user actions before error)
- User context (developer ID, email)

---

### 8.2 Custom Metrics

**Tracked in DB (audit_logs table):**

1. **Upload Success Rate:**
   - Total uploads
   - Successful uploads
   - Failed uploads (by error type)

2. **Ministry Endpoint Health:**
   - XML endpoint calls/day
   - CSV endpoint calls/day
   - MD5 endpoint calls/day
   - Average response time

3. **User Retention:**
   - Day 1 retention (% who return next day)
   - Day 7 retention
   - Day 30 retention

4. **Feature Adoption:**
   - % users who viewed statistics
   - % users who enabled notifications
   - % users who changed property status

5. **Subscription Metrics:**
   - Trial-to-paid conversion rate
   - Churn rate (monthly)
   - Upgrade rate (basic → pro)
   - Downgrade rate (pro → basic)

---

## 9. PRICING & TRIAL IMPLEMENTATION

### 9.1 Stripe Configuration

**Products & Prices:**

```javascript
// Stripe Dashboard setup

Product: OTORAPORT Basic
Price: 149 PLN/month
ID: price_basic_monthly

Product: OTORAPORT Pro
Price: 249 PLN/month
ID: price_pro_monthly

Product: OTORAPORT Enterprise
Price: 399 PLN/month
ID: price_enterprise_monthly

Product: Additional Project (Pro add-on)
Price: 50 PLN/month
ID: price_additional_project
```

**Trial Configuration:**

```typescript
// Checkout session with trial

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_basic_monthly', quantity: 1 }],

  // Trial configuration
  subscription_data: {
    trial_period_days: 14,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel' // Cancel if no card
      }
    }
  },

  // Require payment method upfront
  payment_method_collection: 'always',

  // Customer creation
  customer_email: developer.email,

  // URLs
  success_url: `${baseUrl}/dashboard?trial=started`,
  cancel_url: `${baseUrl}/onboarding/payment?error=payment_required`
});
```

---

### 9.2 Signup Flow Implementation

**New User Journey:**

```
1. Landing Page
   ↓ Click "Wypróbuj za darmo"

2. /auth/signup
   - Email
   - Password
   - Agree to Terms
   ↓ Submit

3. /onboarding/welcome
   - "Witaj w OTORAPORT! Wybierz plan:"
   - Radio buttons: Basic / Pro / Enterprise
   - Show pricing comparison
   ↓ Select plan

4. /onboarding/payment
   - Stripe Checkout (embedded or redirect)
   - "Dodaj kartę kredytową"
   - "Pierwsze 14 dni za darmo, potem 149zł/miesiąc"
   - "Możesz anulować w dowolnym momencie"
   ↓ Add card & confirm

5. /onboarding/complete
   - "Dziękujemy! Twoja karta została dodana."
   - "Trial period: 14 dni (do 2025-10-22)"
   - "Następna płatność: 149zł (2025-10-22)"
   ↓ Proceed to dashboard

6. /dashboard
   - Trial countdown banner: "14 dni pozostało w trial"
   - Full access to features
```

---

### 9.3 Trial Email Automation

**Email Sequence:**

```typescript
// Day 0 (Signup)
Subject: "Witaj w OTORAPORT! 🎉"
Body:
  - Potwierdzenie rejestracji
  - Trial period: 14 dni
  - Link do dashboardu
  - Link do dokumentacji

// Day 7 (Midway)
Subject: "Połowa trial period minęła - jak Ci się podoba OTORAPORT?"
Body:
  - Przypomnienie: 7 dni pozostało
  - Najważniejsze features (które może nie odkrył)
  - Link do support (if questions)

// Day 11 (3 days left)
Subject: "Tylko 3 dni trial period! 🕐"
Body:
  - Przypomnienie: trial kończy się za 3 dni
  - Podsumowanie użycia (properties uploaded, uploads count)
  - Link do anulowania subskrypcji (if doesn't want to continue)
  - Link do upgrade planu (if likes it)

// Day 14 (Trial ended, payment succeeded)
Subject: "Dziękujemy za zaufanie! 💳"
Body:
  - Potwierdzenie pierwszej płatności (149zł)
  - Następna płatność: 2025-11-08
  - Link do invoice (Stripe PDF)
  - Link do zarządzania subskrypcją

// Day 14 (Trial ended, payment failed)
Subject: "Ups! Płatność nie powiodła się 😟"
Body:
  - Informacja o failed payment
  - Przyczyna (card declined, insufficient funds, etc.)
  - Link do aktualizacji karty
  - Suspension notice (if not updated within 3 days)
```

---

## 10. SUCCESS METRICS

### 10.1 Launch Readiness Checklist

**MUST HAVE (Blockers for production):**
- ✅ Core compliance (XML/CSV/MD5) works
- ✅ RLS policies active
- ✅ Stripe integration works
- ❌ Trial system enforced
- ❌ Card required at signup
- ❌ Subscription limits enforced
- ❌ Admin panel functional

**SHOULD HAVE (Important but not blockers):**
- ✅ Email notifications work
- ✅ Dashboard statistics
- ❌ Analytics (GA4, PostHog)
- ❌ Price history tracking
- ❌ Audit logs

**NICE TO HAVE (Post-launch):**
- Public API
- Webhooks
- White label
- Mobile app
- AI features

---

### 10.2 Key Performance Indicators (KPIs)

**Month 1 (MVP Launch):**
- 10 beta users (invited)
- 80% upload success rate
- 99% ministry endpoint uptime
- 0 critical bugs

**Month 3:**
- 50 paying users
- 70% trial-to-paid conversion
- 95% upload success rate
- <5% churn rate

**Month 6:**
- 200 paying users
- 10,000 zł MRR
- 75% trial-to-paid conversion
- 2 integrations live (CRM partnerships)

**Month 12:**
- 500 paying users
- 50,000 zł MRR
- Public API released
- Mobile app beta

---

### 10.3 Definition of Done (Production Ready)

**OTORAPORT v2 is production-ready when:**

1. ✅ All CRITICAL tasks (46-50) completed
2. ✅ 14-day trial enforcement works
3. ✅ Card required at signup works
4. ✅ Subscription limits enforced
5. ✅ Admin panel functional (user management, analytics)
6. ✅ Security audit passed (no critical vulnerabilities)
7. ✅ GDPR compliance verified (data export, deletion works)
8. ✅ Email automation tested (trial reminders, payment confirmations)
9. ✅ Analytics stack configured (GA4, Vercel, Sentry)
10. ✅ Load testing passed (100 concurrent users)

---

## 📌 FINAL RECOMMENDATIONS

### Priority Order dla Implementation:

**Week 1-2: CRITICAL FIXES**
- TASK 48: Enforce subscription limits
- TASK 49: Implement 14-day trial
- TASK 50: Card-required signup flow

**Week 3-4: ADMIN & ANALYTICS**
- TASK 53: Build admin panel
- TASK 51: Add GA4/PostHog tracking

**Week 5-6: NICE-TO-HAVES**
- TASK 52: Price history tracking
- TASK 46: Bulk delete & cache invalidation

**Month 2+: DIFFERENTIATION**
- TASK 54: Public API
- TASK 55: Webhooks
- TASK 57: Team management
- TASK 58: Advanced analytics

**Future (6-12 months):**
- TASK 59: Mobile app
- TASK 60: AI features
- TASK 56: White label

---

## 🎯 CONCLUSION

OTORAPORT v2 has **excellent technical foundation** (RLS, security, compliance), but lacks **essential SaaS business features** (trial enforcement, admin panel, analytics).

**Critical path to production:**
1. Implement trial & card requirement (Tasks 49-50)
2. Enforce subscription limits (Task 48)
3. Build admin panel (Task 53)
4. Add analytics (Task 51)

**Estimated time to production-ready:** 4-6 weeks

**Competitive position after fixes:** ✅ **Best-in-class** (technical excellence + modern UX + transparent pricing)

---

**END OF DOCUMENT**

*Ready for parsing into Task Master for task generation.*
