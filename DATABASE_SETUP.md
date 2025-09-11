# 🗄️ Database Setup - OTORAPORT

## Aktualizacja Schema Supabase

Aby uruchomić wszystkie funkcje ETAP 4 (Admin Panel, API Integrations), musisz zaktualizować schema bazy danych.

### Krok 1: Otwórz Supabase Dashboard

1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt OTORAPORT
3. Przejdź do **SQL Editor** (lewa sidebar)

### Krok 2: Wykonaj SQL Skrypt

1. Skopiuj całą zawartość pliku `supabase-advanced-tables.sql`
2. Wklej do SQL Editor w Supabase
3. Kliknij **Run** (Ctrl/Cmd + Enter)

### Krok 3: Weryfikacja

Sprawdź czy tabele zostały utworzone:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_logs', 'api_keys', 'webhooks', 'integrations');
```

Powinieneś zobaczyć 4 tabele:
- ✅ `system_logs`
- ✅ `api_keys` 
- ✅ `webhooks`
- ✅ `integrations`

### Krok 4: Sprawdź RLS Policies

Sprawdź czy policies są aktywne:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('system_logs', 'api_keys', 'webhooks', 'integrations');
```

Wszystkie powinny mieć `rowsecurity = true`.

## 🚀 Co to daje?

Po aktualizacji schema będziesz mieć dostęp do:

### Admin Panel (`/admin`)
- Statystyki systemu
- Zarządzanie deweloperami  
- Monitoring logów
- Raport compliance
- Analityka przychodów

### API Integrations (`/dashboard`)
- Generowanie kluczy API
- Konfiguracja webhooks
- Integracje partnerskie (Salesforce, HubSpot)
- Monitoring użycia API

### System Logów
- Automatyczne logowanie zdarzeń systemowych
- Monitoring błędów i ostrzeżeń
- Śledzenie akcji użytkowników

## ⚠️ Uwagi

- **Backup**: Zrób backup bazy przed wykonaniem skryptu
- **Permissions**: Upewnij się że masz uprawnienia administratora
- **Testing**: Po aktualizacji przetestuj admin panel

## 🆘 Problemy?

Jeśli wystąpią błędy:

1. **Foreign Key Errors**: Sprawdź czy tabela `developers` istnieje
2. **Permission Errors**: Sprawdź uprawnienia w Supabase
3. **RLS Errors**: Wyłącz tymczasowo RLS jeśli potrzeba

## Status

- [ ] Schema updated
- [ ] Admin panel tested  
- [ ] API integrations tested
- [ ] Logs working