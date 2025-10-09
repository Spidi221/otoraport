# Email Notification System - Setup Guide

## Overview

OTO-RAPORT includes an automated email notification system using **Resend** API that sends:
- ✅ **Upload success emails** - When CSV/Excel files are processed successfully
- ❌ **Upload error emails** - When file processing fails
- 📊 **Weekly reports** - Sent every Monday at 8:00 AM UTC with property statistics

## Setup Instructions

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to **API Keys** section
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables

Add the following to your `.env.local` and `.env.production`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration (optional)
EMAIL_FROM=OTO-RAPORT <noreply@oto-raport.pl>
NEXT_PUBLIC_APP_URL=https://otoraport.vercel.app

# Cron Security (recommended for production)
CRON_SECRET=your-random-secret-string
```

### 3. Verify Domain (Production Only)

For production, you need to verify your sending domain in Resend:

1. Go to Resend Dashboard → **Domains**
2. Add your domain (e.g., `oto-raport.pl`)
3. Add DNS records (SPF, DKIM, DMARC) to your domain provider
4. Wait for verification (usually 5-10 minutes)

### 4. Configure Vercel Cron (Automatic)

The `vercel.json` file already includes cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reports",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

This automatically runs every Monday at 8:00 AM UTC.

## Email Templates

### Upload Success Email
Sent when files are processed successfully with:
- File name
- Number of properties processed
- Number of properties skipped (sold)
- Link to dashboard

### Upload Error Email
Sent when file processing fails with:
- Error message
- Error details
- Troubleshooting suggestions
- Link to support

### Weekly Report Email
Sent every Monday with:
- Total properties count
- Available/Sold/Reserved breakdown
- New properties this week
- Properties sold this week
- Average price per m²
- Compliance status

## Opt-Out Functionality

Users can disable email notifications in **Settings**:

1. Go to `/dashboard/settings`
2. Find "Email Notifications" section
3. Toggle "Email notifications enabled"
4. Choose frequency: Daily / Weekly / Never

The system automatically checks `email_notifications_enabled` before sending.

## Testing

### Test Email Sending Locally

1. Add `RESEND_API_KEY` to `.env.local`
2. Upload a CSV file to trigger success email
3. Check Resend Dashboard → **Logs** to see sent emails

### Test Cron Job Locally

```bash
# Call the cron endpoint manually
curl http://localhost:3000/api/cron/weekly-reports \
  -H "Authorization: Bearer your-cron-secret"
```

### Test in Production

```bash
# Trigger cron manually on Vercel
curl https://otoraport.vercel.app/api/cron/weekly-reports \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Monitoring

### Email Delivery Logs

Check Resend Dashboard:
- **Logs** - See all sent emails
- **Analytics** - Delivery rates, opens, clicks
- **Errors** - Failed sends and reasons

### Application Logs

Server logs include:
```
[Email] Sent successfully: {email_id}
[Email] Failed send: {error details}
[Email] User has opted out: {email}
```

### Cron Job Logs

Vercel Logs show:
```
[Cron] Starting weekly reports job...
[Cron] Found 15 developers to email
[Cron] Email sent to dev@example.com: Success
[Cron] Weekly reports completed: 15 sent, 0 failed
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   # Verify key is set
   echo $RESEND_API_KEY
   ```

2. **Check Domain Verification** (Production)
   - Go to Resend Dashboard → Domains
   - Ensure domain status is "Verified"

3. **Check User Preferences**
   - User may have opted out in settings
   - Check `developers.email_notifications_enabled`

### Cron Job Not Running

1. **Check Vercel Deployment**
   - Go to Vercel Dashboard → Cron Jobs
   - Verify job is listed and active

2. **Check Logs**
   - Vercel Dashboard → Deployments → [Latest] → Functions → `/api/cron/weekly-reports`

3. **Test Manually**
   ```bash
   curl https://your-app.vercel.app/api/cron/weekly-reports \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

## Email Best Practices

### For Development
- Use test email addresses
- Check spam folder
- Monitor Resend sandbox limits (100 emails/day)

### For Production
- Verify sending domain
- Add proper SPF/DKIM/DMARC records
- Monitor delivery rates
- Respect opt-outs
- Keep email content relevant

## Security

1. **Never commit API keys** to git
2. **Use CRON_SECRET** for production cron endpoints
3. **Validate email addresses** before sending
4. **Rate limit** email sending (built-in via Resend)
5. **Log failures** for monitoring

## Cost

Resend pricing (as of 2025):
- **Free tier**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

Most OTO-RAPORT installations will stay within free tier.
