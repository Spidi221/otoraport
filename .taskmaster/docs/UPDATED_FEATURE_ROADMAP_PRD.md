# 📊 OTORAPORT v2 - UPDATED FEATURE ROADMAP PRD

**Dokument:** Product Requirements Document (Updated)
**Data:** 2025-10-08
**Wersja:** 2.0
**Status:** Ready for Task Master Parsing
**Autor:** Business Requirements Update

---

## 🎯 EXECUTIVE SUMMARY

Ten dokument definiuje zaktualizowany roadmap development OTORAPORT v2 z uwzględnieniem zmienionych planów cenowych i feature set dla każdego planu subskrypcji.

**Kluczowe zmiany:**
- Zaktualizowane plany Basic/Pro/Enterprise
- Wykluczenie AI features (mobile app, AI) z tego etapu
- Wykluczenie integracji CRM (na razie tylko CSV upload)
- Focus na landing page update + enforcement w kodzie
- 20+ tasków z subtaskami dla kompleksowej implementacji

---

## 📦 UPDATED SUBSCRIPTION PLANS

### Plan Basic (149 zł/msc)
**Limits:**
- 1 inwestycja
- Maximum 20 mieszkań
- Manual submission (dopóki ministerstwo nie odpisze)

**Features:**
- Automatyczne XML/CSV/MD5 dla dane.gov.pl
- Smart CSV Parser (58 pól ministerstwa)
- Dashboard z podstawowymi statystykami
- Notyfikacje email o upload success/error
- Support przez email

### Plan Pro (249 zł/msc)
**Limits:**
- 2 inwestycje bazowo (bez limitu mieszkań w każdej)
- +50 zł za każdą dodatkową inwestycję/miesiąc
- Unlimited properties per inwestycja

**Features:**
- Wszystko z Basic +
- Subdomena otoraport.pl (nazwa-dewelopera.otoraport.pl)
- Historia cen 6 miesięcy
- Zaawansowane statystyki
- Priority email support

### Plan Enterprise (399 zł/msc)
**Limits:**
- Unlimited inwestycje
- Unlimited mieszkania

**Features:**
- Wszystko z Pro +
- Custom domains (ceny.developerXYZ.pl) - nie subdomena!
- Pełna historia cen (unlimited)
- Zaawansowana analityka w aplikacji
- Dedykowany account manager
- SLA 99.9% uptime
- Phone support

---

## 🚫 EXCLUDED FROM THIS PHASE

1. **Mobile App** - Future roadmap (6-12 months)
2. **AI Features** - Future roadmap (differentiation)
3. **CRM Integration** - Future (na razie CSV upload wystarcza)
4. **Webhook system** - Moved to Phase 3
5. **Public API v1** - Moved to Phase 3 (Enterprise feature)

**Rationale:**
- Focus na core SaaS functionality first
- Landing page promises + payment enforcement
- Admin panel dla zarządzania
- Analytics dla business decisions
- Ministerstwo compliance (manual dla wszystkich)

---

## 📋 FEATURE ROADMAP - TASKS 46-70

### PHASE 1: CRITICAL FIXES (Tasks 46-55) - Week 1-3

#### TASK 46: Update Landing Page with Correct Pricing & Features
**Priority:** CRITICAL
**Effort:** 2 days
**Description:**
Zaktualizować landing page żeby odzwierciedlała nowe plany cenowe i features.

**Subtasks:**
- 46.1: Update pricing section (Basic: 1 inv/20 mieszkań, Pro: 2 inv/unlimited mieszkań, Enterprise: unlimited/unlimited)
- 46.2: Update features comparison table (dodać subdomeny Pro, custom domains Enterprise, historia cen)
- 46.3: Add pricing calculator (Pro: base 249zł + 50zł za dodatkową inwestycję)
- 46.4: Update FAQ section (pytania o limity, dodatkowe inwestycje, subdomeny)
- 46.5: Add testimonials section (placeholders dla social proof)

**Acceptance Criteria:**
- Landing page pokazuje poprawne ceny i limity
- Features comparison jasno pokazuje różnice między planami
- Kalkulator działa (Pro plan z dodatkowymi inwestycjami)
- Mobile responsive
- SEO optimized (meta tags, structured data)

---

#### TASK 47: Update Subscription Plans in Code
**Priority:** CRITICAL
**Effort:** 1 day
**Dependencies:** None
**Description:**
Zaktualizować subscription-plans.ts żeby odzwierciedlał nowe limity.

**Subtasks:**
- 47.1: Update SUBSCRIPTION_PLANS object (Basic: projectsLimit=1, propertiesLimit=20)
- 47.2: Update Pro plan (projectsLimit=2, propertiesLimit=null, additionalProjectFee=5000)
- 47.3: Update Enterprise plan (projectsLimit=null, propertiesLimit=null)
- 47.4: Update features arrays (dodać subdomeny, custom domains, historia)
- 47.5: Add new helper function calculateProPlanCost(baseProjects, additionalProjects)

**Acceptance Criteria:**
- subscription-plans.ts ma poprawne limity
- TypeScript types updated
- calculateProPlanCost() działa poprawnie (249 + 50*dodatkoweInwestycje)
- Unit tests pass

---

#### TASK 48: Enforce Subscription Limits in Upload & Properties APIs
**Priority:** CRITICAL
**Effort:** 3 days
**Dependencies:** TASK 47
**Description:**
Wymuszać limity pakietów w API endpoints (properties count, projects count).

**Subtasks:**
- 48.1: Create middleware enforcePropertyLimit() (sprawdza czy user nie przekroczył limitu mieszkań)
- 48.2: Create middleware enforceProjectLimit() (sprawdza czy user nie przekroczył limitu inwestycji)
- 48.3: Apply enforcePropertyLimit() do POST /api/upload i POST /api/properties
- 48.4: Apply enforceProjectLimit() do endpoint tworzenia nowych inwestycji
- 48.5: Return 403 z detailed error message (current: X/20, upgrade to Pro dla unlimited)

**Acceptance Criteria:**
- Basic user nie może dodać 21. mieszkania (error 403)
- Pro user może dodać unlimited mieszkań w ramach 2 inwestycji
- Enterprise user ma unlimited wszystko
- Error message jest helpful (pokazuje current usage + upgrade link)
- API response includes { error, limits, currentUsage, upgradeUrl }

---

#### TASK 49: Implement 14-Day Trial System
**Priority:** CRITICAL
**Effort:** 4 days
**Dependencies:** TASK 47
**Description:**
Zaimplementować 14-dniowy trial period dla wszystkich planów.

**Subtasks:**
- 49.1: Add DB columns (trial_ends_at, trial_status) do developers table
- 49.2: Create middleware checkTrialStatus() (sprawdza czy trial expired)
- 49.3: Block dashboard access for expired trials (redirect do /trial-expired)
- 49.4: Create /trial-expired page z upgrade CTA
- 49.5: Create trial countdown banner component (pokazuje days remaining)

**Acceptance Criteria:**
- developers table ma trial_ends_at i trial_status columns
- checkTrialStatus() middleware działa (blocks expired trials)
- /trial-expired page istnieje z helpful message
- Dashboard pokazuje trial countdown (np. "14 dni pozostało")
- Trial status visible w user profile

---

#### TASK 50: Implement Card-Required Signup Flow
**Priority:** CRITICAL
**Effort:** 5 days
**Dependencies:** TASK 49
**Description:**
Wymuszać dodanie karty przy rejestracji (Stripe Checkout z trial).

**Subtasks:**
- 50.1: Create /onboarding/select-plan page (wybór Basic/Pro/Enterprise)
- 50.2: Create /onboarding/payment page (Stripe Checkout embed/redirect)
- 50.3: Configure Stripe Checkout z trial_period_days: 14
- 50.4: Add DB columns (stripe_subscription_id, subscription_status, next_billing_date)
- 50.5: Implement Stripe webhooks (customer.subscription.created, invoice.payment_succeeded, etc.)

**Acceptance Criteria:**
- Signup flow: Email/Password → Select Plan → Add Card → Dashboard
- Stripe Checkout pokazuje "First 14 days free, then 149zł/month"
- User nie może ominąć dodania karty (no bypass)
- Webhook handlers działają (trial start, payment success/failed)
- DB tracks subscription_status (trialing, active, past_due, canceled)

---

#### TASK 51: Implement Trial Email Automation
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** TASK 49, TASK 50
**Description:**
Automatyczne emaile w trakcie trial period.

**Subtasks:**
- 51.1: Day 0 email (Welcome, trial started)
- 51.2: Day 7 email (Midway reminder, feature tips)
- 51.3: Day 11 email (3 days left warning)
- 51.4: Day 14 email (Trial ended - payment success confirmation)
- 51.5: Day 14 email (Trial ended - payment failed notice)

**Acceptance Criteria:**
- Resend templates created dla wszystkich 5 emaili
- Vercel Cron jobs configured (daily check dla trial stages)
- Emails wysyłane automatycznie w odpowiednich dniach
- Emails zawierają personal data (name, trial_ends_at, usage stats)
- Unsubscribe link w każdym emailu

---

#### TASK 52: Implement Bulk Delete & Cache Invalidation
**Priority:** HIGH
**Effort:** 2 days
**Dependencies:** None
**Description:**
Dodać bulk delete dla properties z cache invalidation.

**Subtasks:**
- 52.1: Create POST /api/properties/bulk-delete endpoint
- 52.2: Accept { propertyIds: string[] } w body
- 52.3: Delete properties w transaction (all or nothing)
- 52.4: Revalidate XML/CSV/MD5 endpoints po delete
- 52.5: Add "Delete Selected" button do Properties Table z confirmation modal

**Acceptance Criteria:**
- Bulk delete endpoint działa (może usunąć 1-100 properties naraz)
- Transaction ensures atomicity (all deleted or none)
- Cache invalidated (XML/CSV/MD5 show updated data)
- UI: confirmation modal pokazuje preview (ile properties zostanie usuniętych)
- Success toast notification po delete

---

#### TASK 53: Implement Projects (Inwestycje) System
**Priority:** CRITICAL
**Effort:** 5 days
**Dependencies:** TASK 47, TASK 48
**Description:**
Zaimplementować system inwestycji (projects) jako grupowanie properties.

**Subtasks:**
- 53.1: Create projects table (id, developer_id, name, address, created_at)
- 53.2: Add project_id column do properties table (foreign key)
- 53.3: Create POST /api/projects endpoint (create new project)
- 53.4: Create GET /api/projects endpoint (list user's projects)
- 53.5: Update /api/properties/route.ts (filter by project_id)

**Acceptance Criteria:**
- projects table created z RLS policies
- Properties można przypisać do projektu (project_id)
- Dashboard pokazuje projects list
- User może utworzyć nowy projekt (z enforced limits: Basic=1, Pro=2, Enterprise=unlimited)
- Properties Table filtruje po projekcie

---

#### TASK 54: Implement Additional Projects Billing (Pro Plan)
**Priority:** HIGH
**Effort:** 3 days
**Dependencies:** TASK 53
**Description:**
Billing za dodatkowe inwestycje w planie Pro (50zł/inwestycja/miesiąc).

**Subtasks:**
- 54.1: Create Stripe Price dla "Additional Project" (price_additional_project, 50zł/month)
- 54.2: Add additional_projects_count column do developers table
- 54.3: Update calculateMonthlyCost() (Pro: 249 + 50*additional_projects)
- 54.4: API endpoint POST /api/projects/add-additional (dla Pro users)
- 54.5: Stripe subscription update (add line item dla additional project)

**Acceptance Criteria:**
- Pro user może kupić dodatkową inwestycję (+50zł/msc)
- Stripe subscription updated z nowym line item
- Next invoice shows: Pro Plan 249zł + Additional Project 50zł = 299zł
- Dashboard pokazuje current projects count i billing breakdown
- Basic/Enterprise users nie mogą kupić additional projects (Basic: upgrade, Enterprise: unlimited free)

---

#### TASK 55: Build Admin Panel - User Management
**Priority:** CRITICAL
**Effort:** 4 days
**Dependencies:** None
**Description:**
Admin panel dla zarządzania userami.

**Subtasks:**
- 55.1: Create admin_roles table z RBAC permissions
- 55.2: Create admin middleware requireAdmin() (sprawdza czy user jest adminem)
- 55.3: Create /admin/dashboard route z protected layout
- 55.4: Create /admin/users page (lista wszystkich userów)
- 55.5: Create GET /api/admin/users endpoint (search, filter, pagination)

**Acceptance Criteria:**
- admin_roles table created (user_id, role, permissions)
- chudziszewski221@gmail.com dodany jako super_admin
- /admin/dashboard dostępny tylko dla adminów (others get 403)
- /admin/users pokazuje listę userów z search/filter
- Admin może zobaczyć: email, subscription plan, properties count, created_at, status

---

### PHASE 2: ANALYTICS & HISTORY (Tasks 56-60) - Week 4-5

#### TASK 56: Implement Google Analytics 4
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** None
**Description:**
Dodać GA4 tracking do aplikacji.

**Subtasks:**
- 56.1: Create GA4 property (NEXT_PUBLIC_GA4_MEASUREMENT_ID)
- 56.2: Add GA4 script do app/layout.tsx
- 56.3: Track pageviews automatically
- 56.4: Track custom events (signup, upload_success, subscription_start)
- 56.5: Setup conversion goals (signup, paid_subscription)

**Acceptance Criteria:**
- GA4 tracking code loaded
- Pageviews tracked
- Custom events fired correctly
- GA4 dashboard pokazuje real-time data
- Conversion tracking działa

---

#### TASK 57: Implement Vercel Analytics & PostHog
**Priority:** MEDIUM
**Effort:** 1 day
**Dependencies:** None
**Description:**
Dodać Vercel Analytics i PostHog dla advanced analytics.

**Subtasks:**
- 57.1: Install @vercel/analytics package
- 57.2: Add <Analytics /> component do layout
- 57.3: Install posthog-js package
- 57.4: Initialize PostHog w app/providers.tsx
- 57.5: Track key events w PostHog (signup, upload, feature_used)

**Acceptance Criteria:**
- Vercel Analytics showing Core Web Vitals
- PostHog tracking user behavior
- Funnels configured (signup → upload → paid)
- Feature flags ready (dla A/B testing)
- Real user monitoring działa

---

#### TASK 58: Implement Price History Tracking
**Priority:** MEDIUM
**Effort:** 3 days
**Dependencies:** None
**Description:**
Tracking zmian cen properties (Pro: 6 msc, Enterprise: unlimited).

**Subtasks:**
- 58.1: Create price_history table (property_id, old_price, new_price, changed_at)
- 58.2: Create trigger track_price_change() (automatic na UPDATE properties)
- 58.3: Create GET /api/properties/[id]/price-history endpoint
- 58.4: Build PriceHistoryChart component (Recharts line chart)
- 58.5: Add price history tab do property detail page

**Acceptance Criteria:**
- price_history table created z RLS
- Trigger automatically tracks price changes
- Pro users see last 6 months history
- Enterprise users see full history (unlimited)
- Basic users don't have access (upgrade prompt)

---

#### TASK 59: Implement Plan-Specific History Retention
**Priority:** MEDIUM
**Effort:** 2 days
**Dependencies:** TASK 58
**Description:**
Enforce history retention limits (Pro: 6 msc, Enterprise: unlimited).

**Subtasks:**
- 59.1: Add retention_months column do subscription_plans
- 59.2: Create Vercel Cron job (daily cleanup old history dla Pro users)
- 59.3: Update GET /api/properties/[id]/price-history (filter by plan retention)
- 59.4: UI warning (Pro users: "History older than 6 months removed, upgrade to Enterprise dla unlimited")
- 59.5: Admin panel: manual trigger cleanup job

**Acceptance Criteria:**
- Pro users: price history older than 6 months deleted automatically
- Enterprise users: unlimited history retained
- Daily cron job runs (cleanup)
- UI shows appropriate message based on plan
- Admin can manually trigger cleanup

---

#### TASK 60: Build Admin Panel - Analytics Dashboard
**Priority:** HIGH
**Effort:** 3 days
**Dependencies:** TASK 55
**Description:**
Admin analytics dashboard (revenue, users, metrics).

**Subtasks:**
- 60.1: Create /admin/analytics page
- 60.2: Create GET /api/admin/analytics endpoint (MRR, ARR, user growth)
- 60.3: Build revenue chart component (monthly revenue trend)
- 60.4: Build user growth chart (signups per day/week/month)
- 60.5: Add KPI cards (total users, MRR, churn rate, trial conversion)

**Acceptance Criteria:**
- /admin/analytics page exists
- Revenue dashboard shows MRR/ARR
- Charts show user growth trends
- KPI cards display real-time metrics
- Export to CSV button works

---

### PHASE 3: ADVANCED FEATURES (Tasks 61-65) - Week 6-8

#### TASK 61: Implement Subdomain System (Pro Plan)
**Priority:** HIGH
**Effort:** 5 days
**Dependencies:** TASK 53
**Description:**
Subdomeny otoraport.pl dla Pro users (nazwa-dewelopera.otoraport.pl).

**Subtasks:**
- 61.1: Add subdomain column do developers table
- 61.2: Create subdomain availability checker (unique constraint)
- 61.3: Update Vercel domain configuration (wildcard *.otoraport.pl)
- 61.4: Create public pages for subdomain (lista properties tego dewelopera)
- 61.5: Custom branding (logo, colors) dla subdomain

**Acceptance Criteria:**
- Pro users mogą ustawić subdomain (np. budimex.otoraport.pl)
- Subdomain resolver działa (pokazuje properties tego dewelopera)
- SSL certificate automatic (Vercel wildcard)
- Public page customizable (logo upload, primary color)
- Basic/Enterprise users: Basic=upgrade prompt, Enterprise=custom domain instead

---

#### TASK 62: Implement Custom Domains (Enterprise Plan)
**Priority:** MEDIUM
**Effort:** 7 days
**Dependencies:** TASK 61
**Description:**
Custom domains dla Enterprise (ceny.developerXYZ.pl).

**Subtasks:**
- 62.1: Add custom_domain column do developers table
- 62.2: Domain ownership validation (DNS TXT record check)
- 62.3: Vercel domain addition via API (add domain + SSL)
- 62.4: Create /dashboard/settings/custom-domain page (setup instructions)
- 62.5: DNS propagation checker (status indicator)

**Acceptance Criteria:**
- Enterprise user może dodać custom domain
- DNS validation działa (TXT record check)
- SSL certificate issued automatically (Vercel)
- Setup instructions jasne (DNS A record + TXT record)
- Domain status indicator (pending, active, failed)

---

#### TASK 63: Implement Advanced Analytics Dashboard (Enterprise)
**Priority:** MEDIUM
**Effort:** 4 days
**Dependencies:** TASK 58
**Description:**
Zaawansowana analityka w app (tylko Enterprise).

**Subtasks:**
- 63.1: Create /dashboard/analytics page (Enterprise only)
- 63.2: Build advanced charts (price trends, occupancy rate, avg days to sell)
- 63.3: Competitor benchmarking (anonymous aggregate data from all users)
- 63.4: Export to PDF report
- 63.5: Export to Excel (detailed data dump)

**Acceptance Criteria:**
- /dashboard/analytics accessible only dla Enterprise
- Charts show insightful data (price trends, market comparison)
- Benchmarking pokazuje anonymous market averages
- PDF export generates professional report
- Excel export includes all detailed data

---

#### TASK 64: Build Admin Panel - Property Management
**Priority:** HIGH
**Effort:** 3 days
**Dependencies:** TASK 55
**Description:**
Admin property management (view all, search, bulk actions).

**Subtasks:**
- 64.1: Create /admin/properties page
- 64.2: Create GET /api/admin/properties endpoint (cross-developer search)
- 64.3: Add filters (by developer, status, price range, location)
- 64.4: Bulk actions (approve, reject, delete)
- 64.5: Export filtered results to CSV

**Acceptance Criteria:**
- Admin może zobaczyć ALL properties (across all developers)
- Search działa (by address, apartment_number, developer email)
- Filters work (status, price, location)
- Bulk actions work (select multiple → delete/approve)
- CSV export includes filtered results

---

#### TASK 65: Build Admin Panel - Subscription Management
**Priority:** HIGH
**Effort:** 3 days
**Dependencies:** TASK 55
**Description:**
Admin subscription management (refunds, manual upgrades).

**Subtasks:**
- 65.1: Create /admin/subscriptions page
- 65.2: Create GET /api/admin/subscriptions endpoint
- 65.3: Revenue dashboard (MRR, ARR, churn charts)
- 65.4: Failed payments list (past_due subscriptions)
- 65.5: Manual refund button (Stripe refund API)

**Acceptance Criteria:**
- Admin może zobaczyć all subscriptions
- Revenue charts show MRR/ARR trends
- Failed payments list shows past_due users
- Admin może issued manual refund (with reason)
- Subscription upgrade/downgrade manual option

---

### PHASE 4: POLISH & OPTIMIZATION (Tasks 66-70) - Week 9-10

#### TASK 66: Implement Onboarding Flow
**Priority:** MEDIUM
**Effort:** 3 days
**Dependencies:** None
**Description:**
Guided onboarding dla nowych userów.

**Subtasks:**
- 66.1: Create onboarding wizard component (multi-step)
- 66.2: Step 1: Welcome (company info, logo upload)
- 66.3: Step 2: Upload first CSV (with inline help)
- 66.4: Step 3: Verify data (preview properties)
- 66.5: Step 4: Test endpoints (show XML/CSV/MD5 URLs)

**Acceptance Criteria:**
- Onboarding wizard shows po pierwszym logowaniu
- Steps are clear and helpful
- Inline help tooltips explain każdy step
- User może skip onboarding (later button)
- Onboarding state saved (nie pokazuje again)

---

#### TASK 67: Build Help Center & Documentation
**Priority:** MEDIUM
**Effort:** 4 days
**Dependencies:** None
**Description:**
In-app help center z dokumentacją.

**Subtasks:**
- 67.1: Create /help page (FAQ, tutorials, API docs)
- 67.2: Write FAQ section (20+ common questions)
- 67.3: Create video tutorials (upload CSV, setup endpoints, verify XML)
- 67.4: API documentation (dla Enterprise users z public API)
- 67.5: Search functionality w help center

**Acceptance Criteria:**
- /help page exists z comprehensive docs
- FAQ covers common issues
- Video tutorials embedded (YouTube or self-hosted)
- Search finds relevant help articles
- Accessible from dashboard (Help button in header)

---

#### TASK 68: Implement Audit Logs
**Priority:** MEDIUM
**Effort:** 2 days
**Dependencies:** None
**Description:**
Audit logs dla all user actions.

**Subtasks:**
- 68.1: Create audit_logs table (user_id, action, resource_type, changes, created_at)
- 68.2: Log all important actions (login, upload, delete, subscription change)
- 68.3: Create GET /api/user/audit-logs endpoint
- 68.4: Create /dashboard/activity page (user's activity log)
- 68.5: Admin panel: view all audit logs (cross-user)

**Acceptance Criteria:**
- audit_logs table tracks all actions
- Important events logged (login, upload, CRUD operations)
- User can see own activity (/dashboard/activity)
- Admin can see all activity (/admin/logs)
- Logs include IP address, user agent, timestamp

---

#### TASK 69: Implement System Status Page
**Priority:** LOW
**Effort:** 2 days
**Dependencies:** None
**Description:**
Public status page (uptime monitoring).

**Subtasks:**
- 69.1: Create /status public page (no auth required)
- 69.2: Show ministry endpoints health (XML/CSV/MD5 uptime)
- 69.3: Show database status (latency, connection pool)
- 69.4: Show Stripe API status
- 69.5: Historical uptime chart (last 30 days)

**Acceptance Criteria:**
- /status page public (accessible without login)
- Real-time status indicators (green/yellow/red)
- Uptime percentage displayed (99.9% target)
- Historical chart shows uptime trends
- Incident history (if any downtime occurred)

---

#### TASK 70: Performance Optimization & Caching
**Priority:** MEDIUM
**Effort:** 3 days
**Dependencies:** All previous tasks
**Description:**
Optimize app performance i dodać aggressive caching.

**Subtasks:**
- 70.1: Implement Redis caching dla ministry endpoints (XML/CSV/MD5)
- 70.2: Add ISR (Incremental Static Regeneration) dla public pages
- 70.3: Optimize database queries (add indexes, use joins efficiently)
- 70.4: Implement image optimization (Next.js Image component)
- 70.5: Lighthouse audit (target: 90+ score on all metrics)

**Acceptance Criteria:**
- Ministry endpoints cached (60s TTL)
- Public pages use ISR (revalidate: 3600)
- Database queries optimized (query time < 100ms)
- Images lazy loaded and optimized
- Lighthouse score: Performance 90+, Accessibility 95+, Best Practices 90+, SEO 95+

---

## 📊 IMPLEMENTATION PRIORITY

### Week 1-2: CORE BUSINESS LOGIC
**Tasks:** 46-50 (Landing page, pricing, trial, card requirement)
**Goal:** Make business model work (trial → paid conversion)

### Week 3-4: PROJECTS & BILLING
**Tasks:** 51-55 (Email automation, bulk delete, projects system, additional billing, admin panel)
**Goal:** Enforce limits, manage projects, enable admin control

### Week 4-5: ANALYTICS & TRACKING
**Tasks:** 56-60 (GA4, Vercel, PostHog, price history, admin analytics)
**Goal:** Business intelligence i data-driven decisions

### Week 6-8: ADVANCED FEATURES
**Tasks:** 61-65 (Subdomeny, custom domains, advanced analytics, admin property/subscription mgmt)
**Goal:** Deliver Pro/Enterprise exclusive features

### Week 9-10: POLISH & OPTIMIZATION
**Tasks:** 66-70 (Onboarding, help center, audit logs, status page, performance)
**Goal:** Production-ready UX i reliability

---

## ✅ DEFINITION OF DONE

**Production-ready criteria:**

1. ✅ All CRITICAL tasks (46-55) completed and tested
2. ✅ Landing page reflects accurate pricing and features
3. ✅ Subscription limits enforced in code
4. ✅ 14-day trial system working
5. ✅ Card required at signup
6. ✅ Projects system working (Basic=1, Pro=2+additional, Enterprise=unlimited)
7. ✅ Admin panel functional (user management, analytics)
8. ✅ Email automation working (trial reminders, payment confirmations)
9. ✅ Analytics configured (GA4, Vercel, PostHog)
10. ✅ Performance optimized (Lighthouse 90+)

---

## 🎯 SUCCESS METRICS

**Month 1 (Post-launch):**
- 10 beta users onboarded
- 80% trial-to-paid conversion
- 0 critical bugs
- 99% ministry endpoint uptime

**Month 3:**
- 50 paying users (30 Basic, 15 Pro, 5 Enterprise)
- 15,000 zł MRR
- <5% monthly churn
- 90% upload success rate

**Month 6:**
- 200 paying users
- 50,000 zł MRR
- 2+ Pro users with additional projects (billing working)
- 5+ Enterprise users with custom domains

**Month 12:**
- 500 paying users
- 150,000 zł MRR
- Public API released (Phase 4)
- Market leader position

---

**END OF DOCUMENT**

*Ready for Task Master parsing - will generate 25 tasks with detailed subtasks for comprehensive implementation.*
