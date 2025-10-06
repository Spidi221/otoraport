# Email System Tests - Task 7.3, 7.4, 7.5

## ✅ Completed Implementation

### Files Created:
1. `/src/lib/support-email.ts` - Support email functions
2. `/src/lib/email-preferences-checker.ts` - Preference checking utilities
3. `/src/app/api/support/route.ts` - Support API endpoint
4. `/src/app/api/user/email-preferences/route.ts` - Preferences API
5. `/src/app/api/unsubscribe/route.ts` - Unsubscribe endpoint
6. `/src/components/dashboard/email-preferences.tsx` - UI component
7. `/migrations/add_email_preferences.sql` - Database migration

### Updated Files:
1. `/src/lib/ministry-alerts.ts` - Added preference checks to all 3 functions

## 🧪 Test Checklist

### ✅ Build Tests
- [x] TypeScript compilation: **PASS**
- [x] Next.js build: **PASS** (no errors)
- [x] All imports resolve correctly: **PASS**

### ⚠️ Integration Tests Needed

#### 1. SQL Migration (manual test required)
```sql
-- Run in Supabase SQL Editor:
-- File: /migrations/add_email_preferences.sql

-- Expected result:
-- ✅ 7 new columns in developers table
-- ✅ 1 new index: idx_developers_unsubscribe_token
-- ✅ 2 new functions: generate_unsubscribe_token(), set_unsubscribe_token()
-- ✅ 1 new trigger: set_developer_unsubscribe_token
```

**Test Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `/migrations/add_email_preferences.sql`
3. Run migration
4. Verify columns exist:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'developers'
   AND column_name LIKE 'email_%' OR column_name = 'unsubscribe_token'
   ORDER BY column_name;
   ```

#### 2. Support API Endpoint
**Endpoint:** `POST /api/support`

**Test Case 1: Valid Request**
```bash
curl -X POST http://localhost:3000/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jan Kowalski",
    "email": "jan@example.com",
    "subject": "Pytanie o funkcje",
    "message": "Czy mogę eksportować dane do Excel?",
    "category": "technical"
  }'
```
**Expected:**
- Status 200
- Response: `{"success": true, "message": "Support request submitted..."}`
- 2 emails sent: auto-responder + team forward

**Test Case 2: Missing Fields**
```bash
curl -X POST http://localhost:3000/api/support \
  -H "Content-Type: application/json" \
  -d '{"name": "Jan", "email": "jan@example.com"}'
```
**Expected:**
- Status 400
- Error: "Missing required fields"

**Test Case 3: Invalid Email**
```bash
curl -X POST http://localhost:3000/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jan",
    "email": "invalid-email",
    "subject": "Test",
    "message": "Test"
  }'
```
**Expected:**
- Status 400
- Error: "Invalid email format"

#### 3. Email Preferences API
**Endpoint:** `GET /api/user/email-preferences`

**Test Case 1: Get Preferences (Authenticated)**
```bash
# Requires auth session cookie
curl http://localhost:3000/api/user/email-preferences \
  -H "Cookie: sb-access-token=..."
```
**Expected:**
- Status 200
- Response with all 6 preferences

**Test Case 2: Get Preferences (Unauthenticated)**
```bash
curl http://localhost:3000/api/user/email-preferences
```
**Expected:**
- Status 401
- Error: "Unauthorized"

**Endpoint:** `PATCH /api/user/email-preferences`

**Test Case 3: Update Single Preference**
```bash
curl -X PATCH http://localhost:3000/api/user/email-preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{"email_marketing": true}'
```
**Expected:**
- Status 200
- Updated preferences returned

**Test Case 4: Update Multiple Preferences**
```bash
curl -X PATCH http://localhost:3000/api/user/email-preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "email_weekly_digest": false,
    "email_endpoint_health_alerts": false
  }'
```
**Expected:**
- Status 200
- Both preferences updated

#### 4. Unsubscribe Flow
**Endpoint:** `GET /api/unsubscribe?token={token}`

**Test Case 1: Valid Token**
```bash
# First, get a valid token from developers table:
# SELECT unsubscribe_token FROM developers LIMIT 1;

curl "http://localhost:3000/api/unsubscribe?token=abc123..."
```
**Expected:**
- Status 200
- HTML success page
- All email preferences set to false in database

**Test Case 2: Missing Token**
```bash
curl "http://localhost:3000/api/unsubscribe"
```
**Expected:**
- Status 400
- HTML error page: "Brakujący token"

**Test Case 3: Invalid Token**
```bash
curl "http://localhost:3000/api/unsubscribe?token=invalid123"
```
**Expected:**
- Status 404
- HTML error page: "Nieprawidłowy token"

#### 5. Ministry Alerts with Preferences
**Functions to Test:**
1. `sendEndpointHealthAlert()` - checks `email_endpoint_health_alerts`
2. `sendDataStalenessAlert()` - checks `email_data_staleness_alerts`
3. `sendWeeklyComplianceDigest()` - checks `email_weekly_digest`

**Test Case 1: Preferences Enabled**
```typescript
// In Node.js REPL or test script:
import { sendEndpointHealthAlert } from '@/lib/ministry-alerts'

const developer = {
  id: 'test-uuid',
  email: 'test@example.com',
  name: 'Test Developer',
  client_id: 'dev_test123',
  // ... other fields
}

await sendEndpointHealthAlert(developer, 'xml', 'Connection timeout')
```
**Expected:**
- Email sent
- Console log: No "Skipping" message

**Test Case 2: Preferences Disabled**
```sql
-- Disable preferences in database:
UPDATE developers
SET email_endpoint_health_alerts = false
WHERE id = 'test-uuid';
```
Then call function again.

**Expected:**
- No email sent
- Console log: "⏭️ Skipping endpoint health alert for ... (preferences)"
- Return value: `{success: false, reason: 'user_preferences'}`

**Test Case 3: Master Toggle Disabled**
```sql
UPDATE developers
SET email_notifications_enabled = false
WHERE id = 'test-uuid';
```
Then call any email function.

**Expected:**
- No email sent regardless of individual preferences
- Console log: "⏭️ Email notifications disabled for developer ..."

#### 6. UI Component Test
**Component:** `<EmailPreferences />`

**⚠️ ISSUE FOUND:** Component not added to dashboard yet!

**Missing Integration:**
Component needs to be added to dashboard settings page.

**Test Steps (after integration):**
1. Navigate to `/dashboard/settings`
2. See "Email Preferences" card
3. Toggle master switch → should disable all others
4. Toggle individual preferences → should update immediately
5. Check success message appears
6. Refresh page → preferences should persist

## 🐛 Issues Found

### 1. ⚠️ Email Preferences Component Not Integrated
**File:** `/src/components/dashboard/email-preferences.tsx`
**Issue:** Component created but not used in any page
**Fix Needed:** Add to dashboard settings page

### 2. ⚠️ Dashboard Settings Page Missing
**Issue:** No `/dashboard/settings` page exists
**Fix Needed:** Create settings page with EmailPreferences component

### 3. ⚠️ Email Sending Not Tested
**Issue:** All email functions use Resend API but no API key in .env
**Warning:** Build shows "⚠️ RESEND_API_KEY not configured"
**Status:** Expected (dev environment), but needs testing in production

## 📝 Manual Tests Required

Before considering tasks complete:

1. [ ] Run SQL migration in Supabase
2. [ ] Test support API with curl/Postman
3. [ ] Test email preferences API (requires auth)
4. [ ] Test unsubscribe flow with real token
5. [ ] Add EmailPreferences component to dashboard
6. [ ] Create /dashboard/settings page
7. [ ] Test UI component with real user
8. [ ] Send test email with Resend (requires API key)
9. [ ] Verify unsubscribe links in emails work
10. [ ] Test ministry alerts respect preferences

## ✅ What's Working (Verified)

1. ✅ TypeScript compilation - no errors
2. ✅ Next.js build - successful
3. ✅ All imports resolve correctly
4. ✅ SQL migration syntax valid
5. ✅ API routes structure correct
6. ✅ Email preference checker logic sound
7. ✅ Ministry alerts updated with preference checks

## 🚧 What Needs Testing (Not Yet Verified)

1. ⚠️ SQL migration execution
2. ⚠️ API endpoints runtime behavior
3. ⚠️ Email sending (requires Resend API key)
4. ⚠️ UI component functionality
5. ⚠️ Unsubscribe token generation
6. ⚠️ Preference checking in production
7. ⚠️ Integration with existing dashboard

## 📋 Next Steps

1. Create `/src/app/dashboard/settings/page.tsx`
2. Import and use `<EmailPreferences />` component
3. Add navigation link to settings in dashboard
4. Run manual API tests
5. Execute SQL migration in Supabase
6. Test with Resend API key
