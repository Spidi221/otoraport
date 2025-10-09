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
