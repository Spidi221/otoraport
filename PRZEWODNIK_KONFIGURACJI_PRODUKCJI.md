# 🚀 Przewodnik Konfiguracji Produkcyjnej OTO-RAPORT

## 📋 SPIS TREŚCI
1. [Zmienne Środowiskowe - Co i Po Co](#zmienne-środowiskowe)
2. [Koszty - Start i Skalowanie](#koszty)
3. [Instrukcja Krok Po Kroku](#instrukcja-konfiguracji)

---

## 🔧 ZMIENNE ŚRODOWISKOWE - CO I PO CO

### ✅ **WYMAGANE - Bez tego aplikacja nie zadziała**

#### 1. **Stripe** (Płatności i subskrypcje)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY=price_...
```

**Po co?**
Stripe to Twój system płatności. Obsługuje subskrypcje (Basic/Pro/Enterprise), 14-dniowy trial z wymaganą kartą, i dodatkowe projekty dla planu Pro. Bez tego użytkownicy nie mogą płacić.

**Jak ustawić:**
1. Załóż konto na https://stripe.com
2. W Dashboard → Developers → API keys skopiuj `Secret key`
3. W Dashboard → Products stwórz 4 produkty: Basic (99 PLN/m), Pro (249 PLN/m), Enterprise (899 PLN/m), Dodatkowy projekt (50 PLN/m)
4. Dla każdego produktu skopiuj `price_ID` (zaczyna się od `price_`)
5. W Dashboard → Developers → Webhooks dodaj endpoint: `https://oto-raport.pl/api/stripe/webhook`
6. Skopiuj `Signing secret` (to jest `WEBHOOK_SECRET`)

---

#### 2. **Upstash Redis** (Rate Limiting i Cache dla Ministerstwa)
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Po co?**
Redis obsługuje 2 rzeczy: (1) **Rate limiting** - chroni przed spamem i atakami DDoS (IP-based i user-based limity), (2) **Cache dla ministry endpoints** - zapisuje XML/CSV/MD5 na 5 minut, żeby ministerstwo nie musiało generować za każdym razem. Oszczędza to 80%+ requestów do bazy.

**Jaki plan wybrać:**
- **FREE PLAN wystarcza na start!** (10,000 requestów/dzień, 256 MB RAM)
- Dopiero przy ~100+ użytkownikach aktywnych dziennie będziesz potrzebować Pay-as-you-go ($0.20/100K requests)

**Jak ustawić:**
1. Załóż konto na https://upstash.com (wejdź przez GitHub)
2. Kliknij "Create Database" → wybierz region **EU (Ireland)** (RODO!)
3. Wybierz "Free" plan
4. Skopiuj `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` z zakładki Details

---

#### 3. **Resend** (Email - transakcyjne i notyfikacje)
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@oto-raport.pl
SUPPORT_EMAIL=support@oto-raport.pl
```

**Po co?**
Resend wysyła wszystkie emaile: powitalne, potwierdzenia uploadu, alerty o stałości danych, trial expiring, weekly digest. Bez tego użytkownicy nie dostaną żadnych powiadomień.

**Jaki plan wybrać:**
- **FREE PLAN wystarcza!** (3,000 emaili/miesiąc, 1 domena)
- Dopiero przy ~50+ aktywnych użytkownikach będziesz potrzebować płatnego ($20/m za 50K emaili)

**Jak ustawić:**
1. Załóż konto na https://resend.com
2. W Dashboard → Domains dodaj `oto-raport.pl`
3. Dodaj DNS records (TXT, CNAME) do swojego dostawcy domeny
4. Poczekaj na weryfikację (~15 minut)
5. Skopiuj API Key z zakładki API Keys

---

#### 4. **OpenAI** (Chatbot - pomoc dla użytkowników)
```env
OPENAI_API_KEY=sk-proj-...
```

**Po co?**
ChatWidget w prawym dolnym rogu odpowiada na pytania użytkowników o aplikację, wyjaśnia jak uploadować CSV, jak działa compliance ministerstwa. Używa GPT-4o-mini (tani model) z custom knowledge base.

**Ile kosztuje:**
- **~$5/miesiąc na start** (założę ~100 rozmów po ~2000 tokenów każda)
- GPT-4o-mini to $0.15/1M input tokens, $0.60/1M output tokens
- Dopiero przy ~500+ użytkownikach będzie to $20-30/m

**Jak ustawić:**
1. Załóż konto na https://platform.openai.com
2. Dodaj kartę płatniczą (wymagane)
3. Ustaw limit wydatków: $10/m (Settings → Limits)
4. Skopiuj API Key z API Keys

---

### 🎯 **OPCJONALNE - Ale bardzo przydatne**

#### 5. **Google OAuth** (Logowanie przez Google)
```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

**Po co?**
Użytkownicy mogą się zalogować przez Google zamiast wpisywać email/hasło. Zwiększa konwersję signup o ~30%.

**Jak ustawić:**
1. Wejdź na https://console.cloud.google.com
2. Stwórz nowy projekt "OTO-RAPORT"
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs: `https://oto-raport.pl/auth/callback`
6. Skopiuj Client ID i Client Secret

---

#### 6. **Google Analytics 4** (Analityka użytkowników)
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Po co?**
Widzisz ile osób odwiedza stronę, skąd przychodzą, co robią, gdzie wypadają. Niezbędne do optymalizacji konwersji.

**Ile kosztuje:** **DARMOWE** (unlimited events dla małych/średnich firm)

**Jak ustawić:**
1. Wejdź na https://analytics.google.com
2. Stwórz nową Property "OTO-RAPORT"
3. Dodaj Data Stream: Web → `https://oto-raport.pl`
4. Skopiuj Measurement ID (zaczyna się od `G-`)

---

#### 7. **PostHog** (Product Analytics - jak użytkownicy korzystają z apki)
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

**Po co?**
PostHog pokazuje co użytkownicy robią WEWNĄTRZ aplikacji: ile razy klikają "Upload CSV", gdzie się zatrzymują, które funkcje ignorują. Session recordings pozwalają obejrzeć sesję użytkownika jak film. Bezcenne do poprawy UX.

**Jaki plan wybrać:**
- **FREE PLAN wystarcza!** (1M events/m, 5K session recordings/m)
- Dopiero przy ~200+ aktywnych użytkownikach będziesz potrzebować płatnego ($0/m + Pay-as-you-go)

**Jak ustawić:**
1. Załóż konto na https://posthog.com
2. Wybierz **EU Cloud** (RODO!)
3. Skopiuj Project API Key
4. Ustaw Host: `https://eu.posthog.com`

---

## 💰 KOSZTY - START I SKALOWANIE

### **📊 Koszty na START (0-10 użytkowników)**

| Usługa | Plan | Koszt/m | Co dostaniesz |
|--------|------|---------|---------------|
| **Vercel** | Hobby (Free) | **0 PLN** | 100 GB bandwidth, unlimited deployments |
| **Supabase** | Free | **0 PLN** | 500 MB database, 1 GB file storage, 2 GB bandwidth |
| **Upstash Redis** | Free | **0 PLN** | 10K requests/dzień, 256 MB RAM |
| **Resend** | Free | **0 PLN** | 3,000 emaili/m, 1 domena |
| **PostHog** | Free | **0 PLN** | 1M events/m, 5K session recordings/m |
| **Google Analytics** | Free | **0 PLN** | Unlimited |
| **Stripe** | Pay-as-you-go | **~0 PLN** | 1.4% + 1 PLN per transaction (tylko przy sprzedaży) |
| **OpenAI** | Pay-as-you-go | **~20 PLN** | ~100 rozmów chatbot |
| | | |
| **TOTAL NA START** | | **~20 PLN/m** | (tylko OpenAI) |

---

### **📈 Koszty przy SKALOWANIU (100 użytkowników aktywnych)**

| Usługa | Plan | Koszt/m | Co dostaniesz |
|--------|------|---------|---------------|
| **Vercel** | Pro | **80 PLN** | 1 TB bandwidth, unlimited deployments, team collaboration |
| **Supabase** | Pro | **100 PLN** | 8 GB database, 100 GB file storage, 250 GB bandwidth |
| **Upstash Redis** | Pay-as-you-go | **~40 PLN** | ~1M requests/m |
| **Resend** | Pro | **80 PLN** | 50K emaili/m, unlimited domeny |
| **PostHog** | Free → Paid | **0-200 PLN** | Depends on events |
| **Google Analytics** | Free | **0 PLN** | Unlimited |
| **Stripe** | Pay-as-you-go | **~0 PLN** | (tylko prowizja od sprzedaży) |
| **OpenAI** | Pay-as-you-go | **~100 PLN** | ~1000 rozmów chatbot |
| | | |
| **TOTAL przy 100 userach** | | **~600 PLN/m** | |

**Uwaga:** Przy 100 użytkownikach Twój przychód to **~10,000 PLN/m** (zakładając 50% Basic, 30% Pro, 20% Enterprise), więc koszty infrastruktury to tylko **6%** przychodów.

---

### **🚀 Koszty przy SKALOWANIU (500 użytkowników aktywnych)**

| Usługa | Plan | Koszt/m | Co dostaniesz |
|--------|------|---------|---------------|
| **Vercel** | Pro | **80 PLN** | Wystarczy |
| **Supabase** | Pro + Add-ons | **400 PLN** | Compute + Database size |
| **Upstash Redis** | Pay-as-you-go | **~200 PLN** | ~5M requests/m |
| **Resend** | Pro | **80 PLN** | Wystarczy (250K emaili/m) |
| **PostHog** | Pay-as-you-go | **~400 PLN** | ~10M events/m |
| **Google Analytics** | Free | **0 PLN** | Unlimited |
| **Stripe** | Pay-as-you-go | **~0 PLN** | (tylko prowizja od sprzedaży) |
| **OpenAI** | Pay-as-you-go | **~500 PLN** | ~5000 rozmów chatbot |
| | | |
| **TOTAL przy 500 userach** | | **~1,700 PLN/m** | |

**Przychód przy 500 użytkownikach:** ~50,000 PLN/m → koszty infrastruktury to tylko **3.4%** przychodów.

---

## 🛠 INSTRUKCJA KONFIGURACJI KROK PO KROKU

### **ETAP 1: Napraw błędy deploymentu (CLAUDE)**

**Status:** 🔴 W trakcie

**Co trzeba zrobić:**
- Task #72 (Claude): Naprawić importy logo `otoraport-logo` → `oto-raport-logo`
- Task #73 (Claude): Naprawić Supabase exports `createServerClient`
- Commit + push + czekać na Vercel redeploy

**Oczekiwany czas:** 10 minut

---

### **ETAP 2: Konfiguracja Stripe (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Załóż konto Stripe: https://stripe.com
2. ✅ Aktywuj konto produkcyjne (dodaj dane firmy, bank account)
3. ✅ Stwórz 4 produkty w Dashboard → Products:
   - **Basic Plan** - 99 PLN/miesiąc (recurring)
   - **Pro Plan** - 249 PLN/miesiąc (recurring)
   - **Enterprise Plan** - 899 PLN/miesiąc (recurring)
   - **Dodatkowy Projekt** - 50 PLN/miesiąc (recurring, add-on)
4. ✅ Dla każdego produktu skopiuj `price_ID` (przycisk "..." → View price details)
5. ✅ W Developers → API keys skopiuj `Secret key` (live mode!)
6. ✅ W Developers → Webhooks kliknij "+ Add endpoint"
   - Endpoint URL: `https://oto-raport.pl/api/stripe/webhook`
   - Events to send: Select all checkout.*, customer.subscription.*, invoice.* events
   - Skopiuj `Signing secret` (to jest `WEBHOOK_SECRET`)

**Zmienne do Vercel:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY=price_...
```

---

### **ETAP 3: Konfiguracja Upstash Redis (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Załóż konto Upstash: https://upstash.com (Sign up with GitHub)
2. ✅ Kliknij "Create Database"
3. ✅ Wybierz:
   - Type: **Regional** (nie Global - droższe)
   - Region: **EU-West-1 (Ireland)** (RODO compliance!)
   - Name: `otoraport-production`
   - Plan: **Free** (wystarczy na start)
4. ✅ Po utworzeniu wejdź w Details → REST API
5. ✅ Skopiuj:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Zmienne do Vercel:**
```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

### **ETAP 4: Konfiguracja Resend Email (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Załóż konto Resend: https://resend.com
2. ✅ W Dashboard → Domains kliknij "Add Domain"
3. ✅ Wpisz `oto-raport.pl`
4. ✅ Resend pokaże DNS records do dodania:
   - **TXT record** (SPF): `v=spf1 include:resend.com ~all`
   - **CNAME records** (DKIM): 2-3 rekordy
5. ✅ Wejdź do panelu swojego dostawcy domeny (np. OVH, home.pl) i dodaj te DNS records
6. ✅ Wróć do Resend i kliknij "Verify" (czekaj ~15 minut na propagację DNS)
7. ✅ Po weryfikacji wejdź w API Keys → Create API Key
8. ✅ Name: "Production", Permission: Full Access
9. ✅ Skopiuj klucz (zaczyna się od `re_`)

**Zmienne do Vercel:**
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@oto-raport.pl
SUPPORT_EMAIL=support@oto-raport.pl
```

---

### **ETAP 5: Konfiguracja OpenAI Chatbot (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Załóż konto OpenAI: https://platform.openai.com
2. ✅ Dodaj metodę płatności (Settings → Billing → Payment methods)
3. ✅ Ustaw limit wydatków (Settings → Limits):
   - Monthly budget: **$10** (wystarczy na start)
   - Email notification at: **$8**
4. ✅ Stwórz API Key (API keys → Create new secret key)
   - Name: "OTO-RAPORT Production"
   - Permissions: All (jeśli nie ma opcji, zostaw domyślne)
5. ✅ Skopiuj klucz (zaczyna się od `sk-proj-` lub `sk-`)
6. ✅ **WAŻNE:** Zapisz klucz bezpiecznie - OpenAI pokaże go tylko raz!

**Zmienne do Vercel:**
```env
OPENAI_API_KEY=sk-proj-...
```

---

### **ETAP 6: Konfiguracja Google OAuth (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Google Cloud Console: https://console.cloud.google.com
2. ✅ Stwórz nowy projekt: "OTO-RAPORT"
3. ✅ Włącz Google+ API:
   - APIs & Services → Library
   - Szukaj "Google+ API" → Enable
4. ✅ Skonfiguruj OAuth consent screen:
   - APIs & Services → OAuth consent screen
   - User Type: **External**
   - App name: "OTO-RAPORT"
   - User support email: twój email
   - Developer contact: twój email
   - Scopes: Dodaj `.../auth/userinfo.email` i `.../auth/userinfo.profile`
   - Test users: Zostaw puste (publiczna apka)
5. ✅ Stwórz OAuth Client ID:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Name: "OTO-RAPORT Production"
   - Authorized JavaScript origins:
     - `https://oto-raport.pl`
   - Authorized redirect URIs:
     - `https://oto-raport.pl/auth/callback`
6. ✅ Skopiuj Client ID i Client Secret

**Zmienne do Vercel:**
```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

---

### **ETAP 7: Konfiguracja Analytics - Google GA4 (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Google Analytics: https://analytics.google.com
2. ✅ Stwórz nową Property:
   - Admin → Create Property
   - Property name: "OTO-RAPORT"
   - Reporting time zone: (GMT+01:00) Warsaw
   - Currency: Polish Zloty (PLN)
3. ✅ Dodaj Data Stream:
   - Data Streams → Add stream → Web
   - Website URL: `https://oto-raport.pl`
   - Stream name: "OTO-RAPORT Production"
4. ✅ Skopiuj Measurement ID (format: `G-XXXXXXXXXX`)
5. ✅ OPCJONALNIE: Wyłącz reklamy Google:
   - Property Settings → Data Settings → Data Collection
   - Wyłącz "Google signals data collection"

**Zmienne do Vercel:**
```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### **ETAP 8: Konfiguracja Analytics - PostHog (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Załóż konto PostHog: https://posthog.com
2. ✅ **WAŻNE:** Wybierz **EU Cloud** (nie US Cloud!) - RODO compliance
3. ✅ Stwórz nowy projekt: "OTO-RAPORT"
4. ✅ Po utworzeniu wejdź w Project Settings
5. ✅ Skopiuj:
   - Project API Key (format: `phc_...`)
   - Host URL: `https://eu.posthog.com` (sprawdź że to EU!)
6. ✅ OPCJONALNIE: Wyłącz session recordings na produkcji (jeśli nie chcesz):
   - Settings → Session Recordings → Disable

**Zmienne do Vercel:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
```

---

### **ETAP 9: Konfiguracja Domeny w Vercel (BARTEK - Task #72)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Vercel Dashboard: https://vercel.com/dashboard
2. ✅ Wybierz projekt "otoraport-v2"
3. ✅ Settings → Domains → Add
4. ✅ Wpisz `oto-raport.pl` i kliknij Add
5. ✅ Vercel pokaże DNS records do dodania:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME Record**: `www` → `cname.vercel-dns.com`
6. ✅ Wejdź do panelu swojego dostawcy domeny (gdzie kupiłeś oto-raport.pl)
7. ✅ Dodaj te DNS records
8. ✅ Wróć do Vercel i kliknij "Refresh" (czekaj ~10 minut na propagację)
9. ✅ Vercel automatycznie wygeneruje SSL certificate (Let's Encrypt)
10. ✅ Sprawdź czy działa: otwórz https://oto-raport.pl (przekieruje na Vercel)

**OPCJONALNIE: Wildcard subdomain dla Pro/Enterprise custom domains:**
1. ✅ W Vercel → Settings → Domains → Add
2. ✅ Wpisz `*.oto-raport.pl` i kliknij Add
3. ✅ Dodaj w DNS: `CNAME Record`: `*` → `cname.vercel-dns.com`

---

### **ETAP 10: Konfiguracja Domeny w Supabase (BARTEK - Task #73)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Supabase Dashboard: https://supabase.com/dashboard
2. ✅ Wybierz projekt "otoraport-v2"
3. ✅ Settings → Authentication → URL Configuration
4. ✅ Zaktualizuj:
   - Site URL: `https://oto-raport.pl`
   - Redirect URLs: Dodaj `https://oto-raport.pl/**` (wildcard)
5. ✅ Kliknij Save
6. ✅ Sprawdź Additional Redirect URLs - dodaj jeśli potrzeba:
   - `https://oto-raport.pl/auth/callback`
   - `https://oto-raport.pl/dashboard`

**Weryfikacja:**
- Spróbuj zalogować się przez Google OAuth - powinno działać
- Sprawdź redirect po logowaniu - powinien wrócić na `/dashboard`

---

### **ETAP 11: Aktualizacja Google OAuth Redirect (BARTEK - Task #74)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Google Cloud Console: https://console.cloud.google.com
2. ✅ Wybierz projekt "OTO-RAPORT"
3. ✅ APIs & Services → Credentials
4. ✅ Znajdź swój OAuth 2.0 Client ID (utworzony w Etapie 6)
5. ✅ Kliknij na niego (ikona edycji)
6. ✅ W Authorized redirect URIs:
   - **USUŃ** stare: `https://otoraport.vercel.app/auth/callback`
   - **DODAJ** nowe: `https://oto-raport.pl/auth/callback`
7. ✅ Kliknij Save
8. ✅ Sprawdź Authorized JavaScript origins:
   - Powinno być: `https://oto-raport.pl`
   - Jeśli nie ma, dodaj
9. ✅ Kliknij Save ponownie

**Weryfikacja:**
- Wyloguj się z aplikacji
- Spróbuj zalogować przez "Sign in with Google"
- Powinno działać bez błędów

---

### **ETAP 12: Dodaj wszystkie zmienne do Vercel (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Vercel Dashboard → projekt → Settings → Environment Variables
2. ✅ Dodaj **wszystkie** zmienne z poprzednich etapów:

```env
# === WYMAGANE ===

# Stripe (Etap 2)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ADDITIONAL_PROJECT_MONTHLY=price_...

# Upstash Redis (Etap 3)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Resend Email (Etap 4)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@oto-raport.pl
SUPPORT_EMAIL=support@oto-raport.pl

# OpenAI Chatbot (Etap 5)
OPENAI_API_KEY=sk-proj-...

# Google OAuth (Etap 6)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# === OPCJONALNE (ale polecam) ===

# Google Analytics (Etap 7)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# PostHog (Etap 8)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# === INNE ===

# Next.js
NEXTAUTH_URL=https://oto-raport.pl
NEXTAUTH_SECRET=[wygeneruj: `openssl rand -base64 32`]
NEXT_PUBLIC_APP_URL=https://oto-raport.pl

# Ministry
MINISTRY_EMAIL=kontakt@dane.gov.pl
```

3. ✅ Dla każdej zmiennej wybierz środowiska: Production, Preview, Development
4. ✅ Kliknij "Save"
5. ✅ Vercel automatycznie zrobi redeploy - czekaj ~2 minuty

---

### **ETAP 13: Integracja Supabase w Vercel (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Wejdź na Vercel Dashboard → projekt → Settings → Integrations
2. ✅ Kliknij "Browse Marketplace"
3. ✅ Znajdź "Supabase" i kliknij "Add Integration"
4. ✅ Zaloguj się do Supabase (jeśli trzeba)
5. ✅ Wybierz projekt "otoraport-v2"
6. ✅ Wybierz Vercel project "otoraport-v2"
7. ✅ Kliknij "Connect"
8. ✅ Integracja automatycznie doda zmienne:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
9. ✅ Vercel zrobi redeploy

**Uwaga:** Nie musisz ręcznie dodawać tych zmiennych - integracja zrobi to za Ciebie!

---

### **ETAP 14: Weryfikacja Deployment (BARTEK)**

**Status:** ⏳ Następny

1. ✅ Sprawdź logi Vercel: Dashboard → Deployments → Latest
2. ✅ Build powinien być ✅ Success (nie ❌ Failed)
3. ✅ Sprawdź czy strona działa: https://oto-raport.pl
4. ✅ Przetestuj kluczowe funkcje:
   - [ ] Landing page ładuje się poprawnie
   - [ ] Rejestracja przez email działa
   - [ ] Logowanie przez Google OAuth działa
   - [ ] Dashboard ładuje się po zalogowaniu
   - [ ] Upload CSV działa
   - [ ] Ministry endpoints działają:
     - `https://oto-raport.pl/api/public/{client_id}/data.xml`
     - `https://oto-raport.pl/api/public/{client_id}/data.csv`
     - `https://oto-raport.pl/api/public/{client_id}/data.md5`
   - [ ] Chatbot odpowiada na pytania
   - [ ] Płatność Stripe działa (trial signup)

---

### **ETAP 15: Beta Testing (BARTEK)**

**Status:** 🎯 Cel końcowy

1. ✅ Wybierz 5-10 beta testerów (deweloperzy nieruchomości)
2. ✅ Wyślij im link do rejestracji + instrukcje
3. ✅ Poproś o feedback:
   - Czy wszystko działa?
   - Co jest niejasne?
   - Co można poprawić?
4. ✅ Monitoruj błędy:
   - Vercel logs
   - Supabase logs
   - PostHog session recordings
5. ✅ Popraw błędy i zbierz feedback
6. ✅ Po 2 tygodniach beta → launch publiczny! 🚀

---

## ✅ CHECKLIST PRZED LAUNCH

Przed publicznym uruchomieniem sprawdź:

### **Bezpieczeństwo**
- [ ] Wszystkie env vars są w Vercel (nie w repo!)
- [ ] RLS policies włączone w Supabase dla wszystkich tabel
- [ ] CORS skonfigurowany poprawnie
- [ ] Rate limiting działa (sprawdź Redis)
- [ ] Webhook Stripe ma poprawny signing secret

### **Compliance**
- [ ] Privacy Policy na stronie (wymagane RODO)
- [ ] Terms of Service na stronie
- [ ] Cookie Banner działa i zapisuje zgodę
- [ ] Unsubscribe links w emailach działają
- [ ] Ministry endpoints generują poprawne XML/CSV

### **Płatności**
- [ ] Stripe w live mode (nie test mode!)
- [ ] Wszystkie 4 produkty utworzone
- [ ] Trial działa (14 dni, karta required)
- [ ] Webhooks działają (sprawdź subscription created/updated)

### **Monitoring**
- [ ] Google Analytics tracking działa
- [ ] PostHog tracking działa
- [ ] OpenAI chatbot odpowiada
- [ ] Email notifications wysyłane

### **UX/UI**
- [ ] Logo i branding zaktualizowane (OTO-RAPORT)
- [ ] Wszystkie linki działają
- [ ] Mobile responsywne
- [ ] Ładowanie szybkie (<3s)

---

## 🆘 TROUBLESHOOTING

### **Deployment Failed - Module Not Found**
**Problem:** `Module not found: Can't resolve '../icons/otoraport-logo'`

**Rozwiązanie:** Task #72 - Claude naprawi importy logo

---

### **Deployment Failed - createServerClient doesn't exist**
**Problem:** `Export createServerClient doesn't exist in target module`

**Rozwiązanie:** Task #73 - Claude naprawi Supabase exports

---

### **Redis not working - rate limiting not active**
**Problem:** Logi pokazują `[Rate Limit] Redis not configured, allowing request`

**Rozwiązanie:**
1. Sprawdź czy `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` są w Vercel
2. Redeploy aplikacji
3. Sprawdź logi Redis w Upstash Dashboard

---

### **Emails not sending**
**Problem:** Użytkownicy nie dostają emaili

**Rozwiązanie:**
1. Sprawdź czy `RESEND_API_KEY` jest w Vercel
2. Sprawdź DNS records w Resend Dashboard (muszą być verified)
3. Sprawdź logi w Resend Dashboard → Logs
4. Sprawdź czy `FROM_EMAIL` ma zweryfikowaną domenę

---

### **Stripe webhook not working**
**Problem:** Subscription status nie aktualizuje się po płatności

**Rozwiązanie:**
1. Sprawdź czy webhook endpoint dodany: `https://oto-raport.pl/api/stripe/webhook`
2. Sprawdź czy `STRIPE_WEBHOOK_SECRET` jest w Vercel
3. Sprawdź logi Stripe Dashboard → Webhooks → twój endpoint → Recent deliveries
4. Jeśli błąd 401/403 → `WEBHOOK_SECRET` jest zły

---

### **Google OAuth nie działa - redirect error**
**Problem:** "Error 400: redirect_uri_mismatch"

**Rozwiązanie:**
1. Sprawdź Google Cloud Console → Credentials → twój OAuth Client ID
2. Authorized redirect URIs musi zawierać: `https://oto-raport.pl/auth/callback`
3. Usuń stare redirecty (otoraport.vercel.app)
4. Poczekaj 5 minut na propagację Google

---

## 📞 KONTAKT

Jeśli masz pytania lub problemy:
1. Sprawdź ten przewodnik
2. Sprawdź Vercel logs (Dashboard → Deployments → Latest → Build Logs)
3. Sprawdź Supabase logs (Dashboard → Logs → API/Auth/Realtime)
4. Napisz do Claude (ja naprawię kod)

---

**Powodzenia z konfiguracją! 🚀**

**Pamiętaj:** Na start wystarczy FREE tier dla wszystkich usług (oprócz OpenAI ~20 PLN/m). Dopiero przy ~50+ aktywnych użytkownikach będziesz musiał przejść na płatne plany.
