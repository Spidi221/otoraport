# 🔐 CenySync - Dane do Logowania

## 🌐 **PRODUKCJA (po wdrożeniu na Vercel)**

### 🏠 **Główne URL:**
- **Landing Page:** https://cenysync.pl
- **Logowanie:** https://cenysync.pl/auth/signin
- **Rejestracja:** https://cenysync.pl/auth/signup  
- **Dashboard:** https://cenysync.pl/dashboard
- **Admin Panel:** https://cenysync.pl/admin

---

## 👤 **KONTA UŻYTKOWNIKÓW**

### 🧪 **Demo User (po uruchomieniu SQL)**
```
Email: demo@cenysync.pl
Hasło: Demo123!
Plan: Pro
Status: Aktywny
```

**Dostęp do:**
- ✅ Dashboard z danymi 5 mieszkań
- ✅ Upload CSV/XML files
- ✅ XML/MD endpoints dla ministerstwa
- ✅ Generowanie stron prezentacyjnych
- ✅ Analytics i raporty

### 📊 **Ministry Endpoints (Demo):**
- **XML:** https://cenysync.pl/api/public/demo_client_123/data.xml
- **MD:** https://cenysync.pl/api/public/demo_client_123/data.md

---

## 👑 **ADMIN ACCESS**

### 🔧 **Admin Panel (GET):**
```
URL: https://cenysync.pl/admin?admin_key=cenysync_admin_key_2024_secure
```

### 🛠️ **Admin API (POST/PUT):**
```
Header: Authorization: Bearer cenysync_admin_key_2024_secure
```

**Admin funkcje:**
- 📊 Statystyki wszystkich użytkowników
- 👥 Zarządzanie kontami deweloperów
- 📧 Wysyłanie bulk emails
- 🔄 Regeneracja plików XML/MD
- ⚙️ Konfiguracja systemu

### 🔄 **Cron Jobs (Automated):**
```
URL: /api/emails/trial-warning
Header: Authorization: Bearer cenysync_cron_secret_2024_secure
```

---

## 🧪 **DEVELOPMENT (localhost:3006)**

### 🏠 **Local URLs:**
- **Landing:** http://localhost:3006
- **Logowanie:** http://localhost:3006/auth/signin
- **Dashboard:** http://localhost:3006/dashboard
- **Admin:** http://localhost:3006/admin?admin_key=cenysync_admin_key_2024_secure

### 📧 **Email Testing:**
- W dev można wysyłać tylko na: `chudziszewski221@gmail.com`
- API Key: `re_NwTBLVR4_J7UKgGnHWcxCHHTMymVWgo5w` ✅

---

## 🚀 **VERCEL DEPLOYMENT SETTINGS**

### Environment Variables (wymagane):
```env
# Next.js
NEXTAUTH_URL=https://cenysync.pl
NEXTAUTH_SECRET=otoraport_secret_2024_super_secure_key_123

# Supabase  
NEXT_PUBLIC_SUPABASE_URL=https://maichqozswcomegcsaqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.pFj72PPCCGZue4-M1hzhAjptuedJdY-qiS4gRWHAxVU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8
Secret_key: sb_secret_3UCFa4DRmU6t29OahS9ocw_lLTQT_r0
Publishable_key: sb_publishable_UezCmqrbmtH8v1h6fr_bnw_ZVIz2nIV

# Email
RESEND_API_KEY=re_NwTBLVR4_J7UKgGnHWcxCHHTMymVWgo5w
EMAIL_FROM=noreply@cenysync.pl
MINISTRY_EMAIL=dane@ministerstwo.gov.pl

# Admin & Cron
CRON_SECRET=cenysync_cron_secret_2024_secure  
ADMIN_KEY=cenysync_admin_key_2024_secure

# Production
NODE_ENV=production
```

### 📝 **Deploy Commands:**
```bash
# Connect to GitHub and deploy
vercel --prod

# Or via Vercel Dashboard:
# 1. Import from GitHub
# 2. Set environment variables above
# 3. Deploy automatically
```

---

## ✅ **GOTOWE DO TESTOWANIA:**

1. **Uruchom SQL w Supabase** ✅
2. **Testuj na localhost** ✅
3. **Deploy na Vercel** 🚀

**Po deployment będziesz miał pełnowartościową aplikację SaaS gotową do sprzedaży!**

### 💰 **Pricing Ready:**
- Basic: 149 PLN/mies
- Pro: 249 PLN/mies  
- Enterprise: 399 PLN/mies

### 🎯 **Market Ready:**
- Automatyczny compliance z ministerstwem
- Smart CSV parsing 
- Strony prezentacyjne dla klientów
- Email notifications
- Multi-tenant architecture