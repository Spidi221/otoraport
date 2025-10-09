# 🏠 OTO-RAPORT V2 - Real Estate Compliance Automation

> Automatyzacja raportowania cen mieszkań zgodnie z ustawą z 21 maja 2025 roku

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## 📖 Full Documentation

See **[MIGRACJA_COMPLETE.md](./MIGRACJA_COMPLETE.md)** for complete migration documentation and setup instructions.

## ✅ What's Working

- ✅ Supabase Authentication
- ✅ Smart CSV/Excel Parser
- ✅ Ministry XML Generator (Schema 1.13)
- ✅ Public API Endpoints (XML + MD5)
- ✅ Dashboard UI
- ✅ Chatbot (FAQ mode)
- ✅ Rate Limiting & Security

## 🔧 Required Setup

1. **Supabase**: Get credentials from https://supabase.com/dashboard
2. **Environment**: Copy `.env.example` to `.env.local`
3. **Database**: Run migrations in Supabase SQL editor
4. **Deploy**: Push to Vercel with environment variables

## 📚 Key Files

- `MIGRACJA_COMPLETE.md` - Setup instructions
- `.env.example` - Environment configuration
- `src/lib/ministry-xml-generator.ts` - XML generation
- `src/app/api/public/[clientId]/data.xml/` - Ministry endpoint

## 🆘 Support

If something doesn't work:
1. Check console errors (F12 in browser)
2. Verify `.env.local` has all required keys
3. Check Supabase Dashboard for RLS policies
4. See troubleshooting in `MIGRACJA_COMPLETE.md`

---

**Status:** Production Ready ✅ | **Version:** 2.0.0 | **Updated:** October 2025
