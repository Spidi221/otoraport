# 🚀 OTO-RAPORT v2 - Production Deployment Checklist

**Date:** 2025-10-08
**Version:** v2.0.0
**Status:** ✅ Ready for Production

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### 1. Code Quality & Compilation
- ✅ TypeScript compilation successful (`npm run build`)
- ✅ No TypeScript errors
- ✅ All ESLint warnings addressed
- ✅ No console errors in development build

### 2. Core Features Tested
- ✅ **Ministry Compliance Endpoints**
  - ✅ XML endpoint (`/api/public/[clientId]/data.xml`) - revalidate = 0, Cache-Control: 60s
  - ✅ CSV endpoint (`/api/public/[clientId]/data.csv`) - filters sold properties (.neq('status', 'sold'))
  - ✅ MD5 endpoint (`/api/public/[clientId]/data.md5`) - generates checksum of XML
  - ✅ All 58 ministry-required columns in CSV

- ✅ **Property Status Management** (Task 39)
  - ✅ Single property update API (`PATCH /api/properties/[id]`)
  - ✅ Bulk property update API (`PATCH /api/properties/bulk`)
  - ✅ Status enum validation: available, sold, reserved
  - ✅ RLS policies enforce developer ownership
  - ✅ Sold properties excluded from ministry exports

- ✅ **Notifications System** (Task 41)
  - ✅ Notifications table with RLS policies
  - ✅ GET /api/notifications (pagination support)
  - ✅ PATCH /api/notifications/[id] (mark as read/unread)
  - ✅ DELETE /api/notifications/[id]
  - ✅ Real-time unread count badge in header
  - ✅ /dashboard/notifications page

- ✅ **Dashboard Statistics** (Task 42)
  - ✅ GET /api/dashboard/stats endpoint
  - ✅ 4-card grid layout (responsive: 1/2/4 columns)
  - ✅ Metrics: total properties, available, sold this month, avg price/m²
  - ✅ Trend indicators with month-over-month comparison
  - ✅ Lucide React icons (Building2, Home, CheckCircle, DollarSign)

- ✅ **Email Notification System** (Task 43)
  - ✅ Resend API integration
  - ✅ Upload success/error email templates
  - ✅ Weekly report email (Vercel Cron: Mondays 8:00 AM UTC)
  - ✅ Opt-out functionality in settings
  - ✅ Failed email logging

### 3. Security & RLS
- ✅ **Row Level Security (RLS)**
  - ✅ Notifications table: 4 policies (view, update, delete, insert)
  - ✅ Properties table: developer ownership enforcement
  - ✅ All queries use `.eq('developer_id', developer.id)`

- ✅ **Security Headers**
  - ✅ X-Frame-Options: DENY
  - ✅ X-Content-Type-Options: nosniff
  - ✅ X-XSS-Protection enabled
  - ✅ Content-Security-Policy configured
  - ✅ Referrer-Policy set

- ✅ **Rate Limiting** (Upstash Redis)
  - ✅ Auth endpoints: 5 req/15min
  - ✅ API endpoints: 100 req/15min
  - ✅ Public ministry: 60 req/1min
  - ✅ Upload endpoints: 10 req/hour

- ✅ **Input Validation**
  - ✅ Zod schemas for all endpoints
  - ✅ XSS prevention (sanitizeInput, sanitizeInputAdvanced)
  - ✅ SQL injection prevention
  - ✅ File upload validation (size, type)

### 4. Responsive Design
- ✅ Mobile (< 768px): 1-column grid, touch-friendly buttons
- ✅ Tablet (768px - 1024px): 2-column grid
- ✅ Desktop (> 1024px): 4-column grid for stats
- ✅ All components tested on different screen sizes

### 5. Database Migrations
- ✅ `20251008_000001_add_notifications_and_email_preferences.sql` applied
- ✅ `20251008064634_add_property_status_enum.sql` applied
- ✅ Indexes created for performance:
  - ✅ idx_notifications_developer_id
  - ✅ idx_notifications_developer_read_created
  - ✅ idx_properties_status
  - ✅ idx_properties_developer_status

---

## 🔧 ENVIRONMENT VARIABLES CHECKLIST

### Required Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=https://otoraport.vercel.app

# Resend Email API
RESEND_API_KEY=re_...
EMAIL_FROM=OTO-RAPORT <noreply@oto-raport.pl>

# Admin
ADMIN_EMAILS=admin@oto-raport.pl

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Vercel Cron Security
CRON_SECRET=random-secret-string

# Optional: Stripe (if using payments)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Optional: Sentry (error tracking)
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=...
```

### Verify Environment Variables
```bash
# Check all required variables are set in Vercel
vercel env pull .env.production.local
grep -E "SUPABASE|RESEND|UPSTASH|CRON_SECRET" .env.production.local
```

---

## 📋 DEPLOYMENT STEPS

### Step 1: Final Code Review
```bash
# Run build locally
npm run build

# Check for warnings
npm run lint

# Test ministry endpoints (replace with actual client_id)
curl https://localhost:3000/api/public/test-client-id/data.xml
curl https://localhost:3000/api/public/test-client-id/data.csv
curl https://localhost:3000/api/public/test-client-id/data.md5
```

### Step 2: Database Verification
```bash
# Connect to Supabase
npx supabase db remote status

# Verify migrations applied
npx supabase migration list

# Check RLS policies
npx supabase db remote exec "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
```

### Step 3: Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

### Step 4: Post-Deployment Verification
```bash
# Test production endpoints
curl https://otoraport.vercel.app/api/health
curl https://otoraport.vercel.app/api/public/[client-id]/data.xml

# Check Vercel logs
vercel logs --follow

# Verify Cron job is scheduled
vercel cron ls
```

### Step 5: Monitoring Setup
- ✅ Set up Vercel Analytics
- ✅ Configure Sentry error tracking (if using)
- ✅ Monitor Upstash Redis usage
- ✅ Monitor Resend email delivery
- ✅ Set up uptime monitoring (e.g., UptimeRobot)

---

## 🧪 SMOKE TESTS (Production)

After deployment, manually test these critical flows:

1. **User Registration & Login**
   - [ ] Register new developer account
   - [ ] Verify email sent
   - [ ] Login with new account
   - [ ] Profile loads correctly

2. **CSV Upload**
   - [ ] Upload valid CSV file
   - [ ] Properties appear in dashboard
   - [ ] Upload success email received
   - [ ] Statistics cards update

3. **Property Status Management**
   - [ ] Mark property as sold
   - [ ] Verify sold property excluded from CSV export
   - [ ] Bulk update multiple properties
   - [ ] Status changes persist

4. **Ministry Endpoints**
   - [ ] XML endpoint returns current date
   - [ ] CSV endpoint excludes sold properties
   - [ ] MD5 checksum matches XML content

5. **Notifications**
   - [ ] Notification created on upload
   - [ ] Unread count badge displays
   - [ ] Mark notification as read
   - [ ] Delete notification

6. **Dashboard Statistics**
   - [ ] Statistics cards load
   - [ ] Trend indicators display
   - [ ] Mobile responsive layout works

7. **Email System**
   - [ ] Upload success email received
   - [ ] Opt-out toggle works in settings
   - [ ] Weekly report sent (wait for Monday)

---

## 🚨 ROLLBACK PLAN

If critical issues are discovered post-deployment:

```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy previous version
vercel --prod --force

# Revert database migrations if needed
npx supabase db reset --linked
```

---

## 📊 MONITORING & ALERTS

### Key Metrics to Monitor
1. **API Response Times**
   - Ministry endpoints < 500ms
   - Dashboard APIs < 1000ms

2. **Error Rates**
   - 4xx errors < 2%
   - 5xx errors < 0.1%

3. **Rate Limiting**
   - Monitor Upstash Redis hit rate
   - Alert if > 10% of requests are rate-limited

4. **Email Delivery**
   - Monitor Resend delivery rate > 95%
   - Alert on failed email sends

5. **Database Performance**
   - Query response time < 100ms
   - Connection pool usage < 80%

### Set Up Alerts
- Vercel: Enable notifications for failed deployments
- Supabase: Monitor database CPU and memory
- Upstash: Set up usage alerts
- Resend: Monitor email delivery rates

---

## 🌐 MANUAL DOMAIN CONFIGURATION (Tasks #72-74)

### Task #72: Configure oto-raport.pl Domain in Vercel Dashboard

**Status:** ⏳ Requires Manual Configuration

**Prerequisites:**
- Tasks #71, #75, #76 completed ✅
- Access to Vercel Dashboard
- Access to domain registrar DNS settings

**Steps:**

#### 1. Vercel Dashboard Configuration
```bash
# Login to Vercel Dashboard
https://vercel.com/dashboard

# Navigate to Project Settings
Project → Settings → Domains
```

1. Click **"Add Domain"**
2. Enter: `oto-raport.pl`
3. Click **"Add"**
4. Vercel will provide DNS configuration instructions

#### 2. DNS Configuration at Registrar

Configure the following DNS records at your domain registrar:

**For Apex Domain (oto-raport.pl):**
```
Type:   A
Name:   @
Value:  76.76.21.21
TTL:    300 (or Auto)
```

**For WWW Subdomain:**
```
Type:   CNAME
Name:   www
Value:  cname.vercel-dns.com
TTL:    300 (or Auto)
```

**For Wildcard Subdomain (Custom Subdomains):**
```
Type:   CNAME
Name:   *
Value:  cname.vercel-dns.com
TTL:    300 (or Auto)
```

#### 3. SSL Certificate Verification

1. **Wait for propagation** (5-15 minutes typically, up to 48 hours)
2. **Check DNS propagation:**
   ```bash
   # Check A record
   dig oto-raport.pl A

   # Check CNAME records
   dig www.oto-raport.pl CNAME
   dig test.oto-raport.pl CNAME
   ```

3. **Verify SSL in Vercel Dashboard:**
   - Go to Project → Settings → Domains
   - Check that SSL status shows ✅ "Valid"
   - Certificate should be automatically issued by Vercel

4. **Test HTTPS access:**
   ```bash
   # Should redirect HTTP → HTTPS
   curl -I http://oto-raport.pl

   # Should return 200 with SSL
   curl -I https://oto-raport.pl

   # Test www subdomain
   curl -I https://www.oto-raport.pl
   ```

#### 4. Environment Variables Update

Update the following in Vercel Dashboard → Settings → Environment Variables:

```bash
# Update these variables:
NEXT_PUBLIC_APP_URL=https://oto-raport.pl
NEXT_PUBLIC_BASE_URL=https://oto-raport.pl

# For development/preview (optional):
NEXT_PUBLIC_APP_URL_PREVIEW=https://preview.oto-raport.pl
```

**Important:** After updating environment variables, redeploy:
```bash
vercel --prod --force
```

#### 5. Verification Checklist

- [ ] oto-raport.pl resolves to Vercel IP (76.76.21.21)
- [ ] www.oto-raport.pl redirects to https://oto-raport.pl
- [ ] SSL certificate is valid and auto-renewing
- [ ] HTTP requests redirect to HTTPS
- [ ] Wildcard subdomain works (*.oto-raport.pl)
- [ ] Environment variables updated and deployed
- [ ] Old vercel.app URLs redirect to new domain

---

### Task #73: Configure oto-raport.pl Domain in Supabase

**Status:** ⏳ Requires Manual Configuration

**Prerequisites:**
- Task #72 completed (Vercel domain configured)
- Access to Supabase Dashboard

**Steps:**

#### 1. Login to Supabase Dashboard
```bash
https://app.supabase.com/project/YOUR_PROJECT_ID
```

#### 2. Update Authorized URLs

Navigate to: **Authentication → URL Configuration**

**Add the following URLs to "Redirect URLs":**
```
https://oto-raport.pl/auth/callback
https://oto-raport.pl/auth/confirm
https://www.oto-raport.pl/auth/callback
https://www.oto-raport.pl/auth/confirm

# For subdomain support (Pro/Enterprise users)
https://*.oto-raport.pl/auth/callback
https://*.oto-raport.pl/auth/confirm
```

**Update "Site URL":**
```
https://oto-raport.pl
```

**Additional Allowed Origins (CORS):**
```
https://oto-raport.pl
https://www.oto-raport.pl
https://*.oto-raport.pl
```

#### 3. Email Templates Update

Navigate to: **Authentication → Email Templates**

Update all email templates to reference new domain:

**Confirm Signup Template:**
- Replace `{{ .ConfirmationURL }}` links to use `oto-raport.pl`

**Magic Link Template:**
- Replace `{{ .ConfirmationURL }}` links to use `oto-raport.pl`

**Reset Password Template:**
- Replace `{{ .ConfirmationURL }}` links to use `oto-raport.pl`

#### 4. Verification Checklist

- [ ] All redirect URLs added to Supabase
- [ ] Site URL updated to https://oto-raport.pl
- [ ] Email templates reference new domain
- [ ] Test OAuth login flow
- [ ] Test magic link authentication
- [ ] Test password reset flow

**Test Commands:**
```bash
# Test authentication callback
curl https://oto-raport.pl/auth/callback

# Should not return CORS errors
curl -H "Origin: https://oto-raport.pl" \
  https://YOUR_PROJECT.supabase.co/auth/v1/user
```

---

### Task #74: Update Google Cloud Console OAuth Authorized Domains

**Status:** ⏳ Requires Manual Configuration

**Prerequisites:**
- Task #72 completed (Vercel domain configured)
- Task #73 completed (Supabase URLs updated)
- Access to Google Cloud Console

**Steps:**

#### 1. Login to Google Cloud Console
```bash
https://console.cloud.google.com/
```

#### 2. Navigate to OAuth Consent Screen

1. Select your project
2. Go to: **APIs & Services → OAuth consent screen**
3. Scroll to **"Authorized domains"** section

#### 3. Add New Domain

Click **"+ Add Domain"** and add:
```
oto-raport.pl
```

**Note:** You can only add the apex domain (not subdomains or wildcards)

#### 4. Update OAuth 2.0 Client IDs

Navigate to: **APIs & Services → Credentials**

For each OAuth 2.0 Client ID used in your app:

1. Click on the Client ID name
2. Under **"Authorized JavaScript origins"**, add:
   ```
   https://oto-raport.pl
   https://www.oto-raport.pl
   ```

3. Under **"Authorized redirect URIs"**, add:
   ```
   https://oto-raport.pl/auth/callback
   https://oto-raport.pl/auth/callback/google
   https://www.oto-raport.pl/auth/callback
   https://www.oto-raport.pl/auth/callback/google

   # Supabase callback (if using Supabase Auth with Google)
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```

4. Click **"Save"**

#### 5. Verification Checklist

- [ ] oto-raport.pl added to authorized domains
- [ ] JavaScript origins updated for all OAuth clients
- [ ] Redirect URIs updated for all OAuth clients
- [ ] Test Google Sign-In flow from new domain
- [ ] No CORS errors in browser console
- [ ] OAuth consent screen shows correct app name and domain

**Test Google OAuth:**
```bash
# Test from production domain
# 1. Navigate to https://oto-raport.pl/auth/signin
# 2. Click "Sign in with Google"
# 3. Should redirect to Google OAuth consent
# 4. After authorization, should redirect back to oto-raport.pl
# 5. User should be logged in successfully
```

#### 6. Troubleshooting

**Common Issues:**

1. **"redirect_uri_mismatch" error:**
   - Double-check redirect URIs match exactly
   - Ensure HTTPS (not HTTP)
   - Check for trailing slashes

2. **"unauthorized_client" error:**
   - Verify authorized domains list includes oto-raport.pl
   - Check OAuth client ID is correct in environment variables

3. **CORS errors:**
   - Verify JavaScript origins include https://oto-raport.pl
   - Check browser console for specific origin mismatch

**DNS Propagation Check:**
```bash
# Verify domain resolves correctly
nslookup oto-raport.pl
dig oto-raport.pl

# Check from different DNS servers
dig @8.8.8.8 oto-raport.pl
dig @1.1.1.1 oto-raport.pl
```

---

## 📝 POST-DEPLOYMENT TASKS

1. **Documentation**
   - [ ] Update README.md with production URL
   - [ ] Document any environment-specific configurations
   - [ ] Update API documentation

2. **User Communication**
   - [ ] Notify beta testers of new features
   - [ ] Send changelog email to users
   - [ ] Update help documentation

3. **Performance Baseline**
   - [ ] Run Lighthouse audit
   - [ ] Record initial metrics
   - [ ] Set performance budgets

4. **Domain Configuration** (Manual Tasks #72-74)
   - [ ] Task #72: Vercel domain configuration completed
   - [ ] Task #73: Supabase URLs updated
   - [ ] Task #74: Google OAuth domains configured
   - [ ] All authentication flows tested on new domain

---

## ✅ SIGN-OFF

**Deployed By:** _________________
**Date:** _________________
**Version:** v2.0.0
**Production URL:** https://otoraport.vercel.app

**Pre-Deployment Checklist:** ✅ Complete
**Security Audit:** ✅ Passed
**Ministry Compliance:** ✅ Verified
**RLS Policies:** ✅ Active
**Rate Limiting:** ✅ Configured
**Email System:** ✅ Tested

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Email: support@oto-raport.pl
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support

**Emergency Rollback:**
- Developer: [Your contact]
- DevOps: [Contact]

---

**STATUS: ✅ READY FOR PRODUCTION DEPLOYMENT**

All tasks (36-44) completed successfully. Task 45 (Integration Testing) verified.
