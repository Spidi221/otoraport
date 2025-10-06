# Production Monitoring & Alerting Setup Guide

This guide helps you configure proactive monitoring and alerting for OTORAPORT production deployment.

## 📊 Components Overview

We use a 3-tier monitoring stack:
1. **Sentry** - Error tracking and performance monitoring
2. **Vercel Analytics** - Real-user performance metrics and Web Vitals
3. **External Health Monitoring** - Uptime and API availability

---

## 1. Sentry Alert Configuration

### Prerequisites
- Sentry project created at [sentry.io](https://sentry.io)
- Environment variables configured (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`)

### Alert Rules to Configure

#### 🚨 Critical: New High-Priority Errors
**When:** New error with level >= ERROR appears
**Action:** Immediate notification

1. Go to **Alerts** → **Create Alert**
2. Select **Issues**
3. Configure:
   ```
   When: A new issue is created
   If: level >= error
   Then: Send notification to #alerts (email/Slack)
   ```

#### 📈 Warning: Error Frequency Spike
**When:** Error rate increases by 50% in 5 minutes
**Action:** Team notification

1. Go to **Alerts** → **Create Alert**
2. Select **Metric Alert**
3. Configure:
   ```
   Metric: event.count
   Threshold: 50% increase compared to 1h average
   Time Window: 5 minutes
   Action: Send notification to team
   ```

#### ⚠️ Performance: Slow Transaction
**When:** API endpoint exceeds 2s response time
**Action:** Warning notification

1. Go to **Alerts** → **Create Alert**
2. Select **Metric Alert**
3. Configure:
   ```
   Metric: transaction.duration
   Threshold: > 2000ms (2 seconds)
   Filter: transaction.op:http.server
   Time Window: 5 minutes
   Action: Send warning to #performance
   ```

### Integration with Communication Tools

#### Slack Integration (Recommended)
1. Sentry → **Settings** → **Integrations** → **Slack**
2. Authorize Sentry app for your workspace
3. Configure alert routing:
   - Critical errors → `#alerts-critical`
   - Warnings → `#alerts-warnings`
   - Performance → `#performance`

#### Email Notifications
1. Sentry → **Settings** → **Notifications**
2. Add team emails
3. Configure notification preferences:
   - ✅ New issues
   - ✅ Regression (resolved issue re-appears)
   - ✅ Critical severity
   - ⬜ Minor issues (avoid noise)

---

## 2. Vercel Analytics

Vercel Analytics is already integrated in the codebase (`layout.tsx`).

### View Metrics
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Analytics** tab
3. Monitor:
   - **Core Web Vitals**: LCP, FID, CLS
   - **Traffic**: Page views, unique visitors
   - **Performance**: Route response times

### Set Up Alerts (Vercel Pro Plan)
1. Go to **Analytics** → **Alerts**
2. Create alert:
   ```
   Metric: Real Experience Score (RES)
   Threshold: < 80 (poor performance)
   Frequency: Daily digest
   Recipients: dev team emails
   ```

---

## 3. External Health Monitoring

Our `/api/health` endpoint returns:
- `200 OK` - Application healthy
- `503 Service Unavailable` - Database or app issues

### Option A: UptimeRobot (Free, Recommended)

#### Setup Steps:
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create new monitor:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: OTORAPORT Health Check
   URL: https://otoraport.vercel.app/api/health
   Monitoring Interval: 5 minutes
   ```

3. Configure Alert Contacts:
   - Add email addresses (team members)
   - Add Slack webhook (optional)

4. Alert Settings:
   ```
   Alert When: Down
   Wait: 2 minutes (avoid false positives)
   Method: All selected contacts
   ```

#### Expected Behavior:
- ✅ **Healthy**: No alerts, green status
- 🔴 **Unhealthy**: Immediate email + Slack notification
- 🟡 **Degraded**: 2+ consecutive failures

### Option B: Vercel Cron Job (Alternative)

Create a monitoring cron job in Vercel:

1. Create `/src/app/api/cron/health-check/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check health endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`);
    const data = await response.json();

    if (!response.ok || data.status !== 'healthy') {
      // Send alert (email/Slack)
      await sendAlert({
        title: 'OTORAPORT Health Check Failed',
        status: data.status,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        status: 'unhealthy',
        details: data
      }, { status: 500 });
    }

    return NextResponse.json({ status: 'healthy', checked_at: new Date().toISOString() });
  } catch (error) {
    await sendAlert({
      title: 'OTORAPORT Health Check Error',
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}

async function sendAlert(data: any) {
  // Implement alert logic (email via Resend, Slack webhook, etc.)
  console.error('HEALTH CHECK ALERT:', data);
}
```

2. Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 4. Ministry Endpoint Monitoring

Critical for compliance: Monitor XML/CSV/MD5 endpoints availability.

### UptimeRobot Configuration

Create 3 monitors:

#### Monitor 1: Harvester XML
```
URL: https://otoraport.vercel.app/api/public/{client_id}/data.xml
Expected: 200 OK + valid XML
Interval: 10 minutes
```

#### Monitor 2: CSV Data
```
URL: https://otoraport.vercel.app/api/public/{client_id}/data.csv
Expected: 200 OK + CSV content
Interval: 10 minutes
```

#### Monitor 3: MD5 Checksum
```
URL: https://otoraport.vercel.app/api/public/{client_id}/data.md5
Expected: 200 OK + 32-char hash
Interval: 10 minutes
```

**Replace `{client_id}`** with your actual developer client_id.

### Alert Configuration
```
Alert When: Status code != 200 OR Response time > 5s
Recipients: ministry-alerts@otoraport.pl
Escalation: After 2 consecutive failures
```

---

## 5. Dashboard & Metrics

### Centralized Monitoring Dashboard

Create a simple status page to aggregate all monitoring:

**Tools:**
- [statuspage.io](https://statuspage.io) (paid)
- [cachet.io](https://cachethq.io) (self-hosted, free)
- Custom Next.js page (DIY)

### Key Metrics to Track

| Metric | Source | Threshold | Alert |
|--------|--------|-----------|-------|
| Uptime | UptimeRobot | < 99.5% | Email |
| Error Rate | Sentry | > 1% | Slack |
| Response Time | Vercel | > 2s | Email |
| Database Health | /api/health | Fails | Critical |
| Core Web Vitals | Vercel Analytics | LCP > 2.5s | Weekly |

---

## 6. Incident Response Workflow

When an alert triggers:

### 1. Acknowledge (< 5 min)
- Check Sentry dashboard for error details
- Verify health endpoint status
- Assess user impact

### 2. Investigate (< 15 min)
- Review Vercel logs
- Check database connectivity (Supabase dashboard)
- Identify root cause

### 3. Mitigate (< 30 min)
- Apply hotfix if possible
- Roll back deployment if critical
- Enable maintenance mode if needed

### 4. Resolve (< 2 hours)
- Deploy permanent fix
- Verify monitoring shows healthy status
- Document incident in post-mortem

### 5. Post-Mortem (< 24 hours)
- Write incident report
- Update runbooks
- Implement preventive measures

---

## 7. Testing Alerts

### Test Sentry Alerts
```typescript
// Trigger test error
throw new Error('[TEST] Alert configuration test');
```

Verify:
- ✅ Appears in Sentry dashboard within 30s
- ✅ Team receives notification
- ✅ Alert includes stack trace and context

### Test Health Check Alerts
```bash
# Simulate unhealthy app (temporary)
# In /api/health, return 503 for 5 minutes
```

Verify:
- ✅ UptimeRobot detects failure within 5 min
- ✅ Team receives downtime notification
- ✅ Alert resolves when health returns

### Test Ministry Endpoint Alerts
```bash
# Check current status
curl https://otoraport.vercel.app/api/public/{client_id}/data.xml
```

Verify:
- ✅ Returns 200 OK
- ✅ Valid XML with namespace
- ✅ No rate limit errors (< 60 req/min)

---

## 8. Environment Variables Required

Add these to Vercel:

```bash
# Sentry (for alerts)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=otoraport-v2

# Cron monitoring (if using Vercel cron)
CRON_SECRET=your-secret-key-here

# Alert notifications
ALERT_EMAIL_TO=alerts@otoraport.pl
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

---

## 9. Maintenance Windows

Schedule regular maintenance to avoid false alerts:

### Planned Deployments
1. Announce in status page
2. Pause UptimeRobot monitors (temporary)
3. Deploy updates
4. Resume monitoring
5. Verify all green

### Database Maintenance
1. Supabase maintenance notifications
2. Set up fallback/read-only mode
3. Communicate to users via dashboard banner

---

## 10. Cost Breakdown

| Service | Plan | Cost/Month | Features |
|---------|------|-----------|----------|
| Sentry | Team | $26 | 50k events, alerts |
| Vercel Analytics | Pro | $20 | Included in Vercel Pro |
| UptimeRobot | Free | $0 | 50 monitors, 5min checks |
| Slack | Free | $0 | Basic integrations |

**Total: ~$46/month** (or $0 if using free tiers)

---

## ✅ Checklist

Before going live, verify:

- [ ] Sentry project created and configured
- [ ] Environment variables set in Vercel
- [ ] UptimeRobot monitors active (health + ministry endpoints)
- [ ] Slack/Email notifications tested
- [ ] Team has access to all dashboards
- [ ] Incident response playbook documented
- [ ] Post-deployment smoke tests passed
- [ ] Status page live (if applicable)

---

## 📞 Support Contacts

**Escalation Path:**
1. Primary: alerts@otoraport.pl
2. On-call: +48 XXX XXX XXX
3. Critical: Direct Slack DM to CTO

**Service Status:**
- Vercel: [vercel-status.com](https://vercel-status.com)
- Supabase: [status.supabase.com](https://status.supabase.com)
- Sentry: [status.sentry.io](https://status.sentry.io)

---

Last updated: 2025-01-06
Version: 1.0
Maintained by: DevOps Team
