# OTORAPORT v2 - Fresh Start PRD (Post-Reset)
**Status:** Active after git reset to commit 24f1f30
**Date:** 2025-10-07
**Context:** Reset codebase to working state before bad merge (0da20dd)

## 🎯 Current State Analysis

### ✅ What Works (Verified at 24f1f30)
- **Ministry Endpoints:** XML, CSV, MD5 all functional with correct Harvester format
- **Database:** Supabase v2 schema with direct columns (no JSONB raw_data)
- **Authentication:** OAuth, signup/signin, developer profiles
- **Upload:** CSV/Excel file upload with smart parser
- **Properties API:** Returns 20 properties correctly from v2 schema
- **Dashboard:** Simple layout with Upload, ActionButtons, PropertiesTable

### ❌ What Needs Work
- **Repository Cleanup:** Tons of junk files (SQL, MD, test files, duplicates)
- **Properties Management:** No UI to mark properties as sold/unavailable
- **Settings Page:** /dashboard/settings doesn't exist
- **Notifications:** /notifications doesn't exist
- **XML Date Refresh:** Currently cached (revalidate=300), Ministry needs daily updates
- **Analytics:** No dashboard stats or charts
- **Email System:** No notifications for users

---

## 📋 Priority Tasks

### 🔥 PRIORITY 1: Critical Fixes & Cleanup

#### Task 1: Repository File Cleanup
**Priority:** HIGH
**Estimate:** 1h

Clean up project root directory to remove development artifacts and test files.

**Files to Remove:**
- SQL migration files: `check_*.sql`, `enable_rls_*.sql`, `fix_*.sql`, `FINAL_SETUP_*.sql`, `KROK_*.sql`, `supabase_trigger_*.sql`
- Test files: `test-*.ts`, `test-*.js`, `test-*.mjs`, `test-*.xlsx`, `test-*.csv`, `check-*.js`, `verify-*.md`
- Documentation duplicates: Files ending with ` 2.md`, ` 2.sql`, ` 2.json`
- Old reports: `EXCEL-*.md`, `INPRO-*.md`, `MINISTRY_XML_*.md`, `MISSION-*.md`, `PARSER_*.md`, `PLAN_*.md`, `STRIPE_*.md`, `RAPORT_*.md`, `INSTRUKCJA_*.md`, `MIGRACJA_*.md`, `MAPOWANIE_*.md`, `SZYBKIE_*.md`, `PERFORMANCE_*.md`, `PRODUCTION_*.md`, `TEST_*.md`, `AGENTS*.md`, `GEMINI*.md`
- IDE configs: `opencode*.json`, `claude_desktop_config*.json`
- CSV exports: `ceny-mieszkan-*.csv` in root
- Backup folders: `backup dokumentów real estate app/`

**Files to Keep:**
- `.taskmaster/` - task management
- `.coderabbit-analysis/` - code quality reports
- `src/` - application code
- `package.json`, `next.config.ts`, `tsconfig.json` - project config
- `CLAUDE.md`, `README.md` - documentation
- `.env*` files - environment config

**Acceptance Criteria:**
- Root directory contains only essential project files
- No test/debug files in root
- Git commit with list of removed files

---

#### Task 2: Fix XML Auto-Refresh for Ministry Compliance
**Priority:** HIGH
**Estimate:** 30min

Currently XML is cached (`revalidate = 300`). Ministry Art. 19b requires daily date updates.

**Changes:**
- `src/app/api/public/[clientId]/data.xml/route.ts`:
  - Change `export const revalidate = 300` to `export const revalidate = 0`
  - Keep `export const dynamic = 'force-dynamic'`
  - Update Cache-Control header from `max-age=300` to `max-age=60` (1 minute)

- `src/app/api/public/[clientId]/data.md5/route.ts`:
  - Same changes as XML route

**Acceptance Criteria:**
- XML endpoint returns current date (YYYY-MM-DD format)
- MD5 checksum matches fresh XML content
- Multiple requests within 1 minute return same cached response
- Requests after 1 minute return fresh content with new date

---

#### Task 3: Remove Unused Dashboard Components
**Priority:** MEDIUM
**Estimate:** 20min

Dashboard currently has SubscriptionCard component that's not needed for v2.

**Changes:**
- `src/app/dashboard/page.tsx`:
  - Remove `import { SubscriptionCard }` line
  - Remove `import { SubscriptionErrorHandler }` line
  - Remove `<SubscriptionErrorHandler />` component
  - Remove `<SubscriptionCard />` component
  - Keep only: UploadWidget, ActionButtons, PropertiesTable

**Acceptance Criteria:**
- Dashboard renders with simplified layout
- No TypeScript errors
- No runtime errors in browser console

---

### 🎯 PRIORITY 2: Core Features

#### Task 4: Implement Property Status Management
**Priority:** HIGH
**Estimate:** 3h

Allow developers to mark properties as sold/unavailable directly from dashboard.

**Requirements:**
- Add "Mark as Sold" button in PropertiesTable for each property row
- Update property `status` column in database (values: 'available', 'sold', 'reserved')
- Sold properties should be filtered out from Ministry XML/CSV exports
- Show status badge (green=available, red=sold, yellow=reserved) in table
- Add bulk action: "Mark selected as sold"

**API Endpoint:**
- `PATCH /api/properties/[id]` - Update single property status
- `PATCH /api/properties/bulk` - Update multiple properties status

**Database:**
- Table: `properties`
- Column: `status` (enum: 'available', 'sold', 'reserved')
- RLS policy: developers can only update their own properties

**UI Components:**
- StatusBadge component (Radix UI Badge)
- StatusSelect dropdown (Radix UI Select)
- BulkActions toolbar (Radix UI Toolbar)

**Acceptance Criteria:**
- Developer can change property status from table
- Status persists in database
- Sold properties excluded from Ministry endpoints
- Bulk update works for 2+ selected properties
- Loading states during API calls
- Error handling with toast notifications

---

#### Task 5: Create Settings Page
**Priority:** MEDIUM
**Estimate:** 2h

Create `/dashboard/settings` page for user preferences and account management.

**Sections:**
1. **Profile Settings**
   - Company name, NIP, REGON, email, phone
   - Update button with validation

2. **API Configuration**
   - Show client_id (read-only)
   - Regenerate client_id button (with confirmation)
   - Ministry endpoint URLs (copy buttons)

3. **Notification Preferences**
   - Email notifications on/off toggle
   - Notification frequency (daily, weekly)

4. **Account Actions**
   - Change password
   - Delete account (with confirmation)

**API Endpoints:**
- `GET /api/user/profile` - Get current user profile
- `PATCH /api/user/profile` - Update profile
- `POST /api/user/regenerate-client-id` - Generate new client_id

**Acceptance Criteria:**
- Settings page renders at /dashboard/settings
- Form validation works (required fields, format checks)
- Profile updates persist in database
- Success/error toast notifications
- Regenerate client_id creates new UUID and updates developer record

---

#### Task 6: Implement Notifications System
**Priority:** MEDIUM
**Estimate:** 2h

Create `/notifications` page to show system notifications and alerts.

**Features:**
- List of notifications (newest first)
- Mark as read/unread
- Delete notification
- Notification types: upload_complete, upload_error, ministry_sync, system_announcement
- Badge counter in header showing unread count

**Database:**
- New table: `notifications`
- Columns: id, developer_id, type, title, message, read, created_at
- RLS policy: developers can only see their own notifications

**API Endpoints:**
- `GET /api/notifications` - List user notifications
- `PATCH /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification

**Acceptance Criteria:**
- Notifications page renders at /notifications
- Unread count badge in header updates real-time
- Mark as read works
- Delete notification works
- Empty state when no notifications

---

### 📊 PRIORITY 3: Analytics & Enhancements

#### Task 7: Add Dashboard Statistics Cards
**Priority:** LOW
**Estimate:** 1.5h

Add overview statistics cards to dashboard top section.

**Metrics:**
- Total properties
- Available properties
- Sold properties (this month)
- Average price per m²

**Design:**
- 4 cards in a grid (2x2 on mobile, 4x1 on desktop)
- Icon, value, label, trend indicator (↑/↓ compared to last month)

**API Endpoint:**
- `GET /api/dashboard/stats` - Return aggregated statistics

**Acceptance Criteria:**
- Stats cards render above upload widget
- Data refreshes on page load
- Loading skeleton during fetch
- Error state handled gracefully

---

#### Task 8: Implement Email Notifications
**Priority:** LOW
**Estimate:** 2h

Send email notifications for important events using Resend.

**Events:**
- Upload completed (with summary)
- Upload failed (with error details)
- Weekly report (every Monday with stats)

**Implementation:**
- Use Resend API (already in dependencies)
- Create email templates (React Email)
- Queue system using Supabase functions or Vercel Cron

**Acceptance Criteria:**
- Emails sent successfully via Resend
- Templates are mobile-responsive
- Users can opt-out in settings
- Failed emails logged for debugging

---

## 🧪 Testing Requirements

For each task:
- **Unit tests:** Test business logic and data transformations
- **Integration tests:** Test API endpoints with real Supabase
- **E2E tests:** Critical user flows (upload, mark as sold, etc.)

## 📦 Deployment Notes

- All changes must pass TypeScript compilation (`npm run build`)
- Test on localhost before pushing
- Verify Vercel deployment succeeds
- Test production endpoints after deploy

## 🔐 Security Checklist

- RLS policies on all new database tables
- Input validation on all API endpoints
- Rate limiting on public endpoints
- CORS headers properly configured
- No sensitive data in client-side code

---

**Total Estimated Hours:** 12.5h
**Tasks:** 8 main tasks
**Priority Breakdown:** 3 High, 4 Medium, 2 Low
