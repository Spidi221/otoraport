# 🧹 PLAN CZYSZCZENIA PROJEKTU

## ❌ PLIKI DO USUNIĘCIA (NATYCHMIAST)

### 1. DUPLIKATY CAŁEGO PROJEKTU
```bash
rm -rf otoraport-app/        # 77 plików starego kodu
rm -rf OTORAPORT/            # Kolejny duplikat
```

### 2. DEBUG SCRIPTS (10 plików)
```bash
rm cleanup-demo-user.js
rm db-inspector.js
rm debug-database.js
rm debug-profile-check.js
rm debug-rls-policies.js
rm test-raw-data.js
```

### 3. SQL ŚMIECI (6 plików)
```bash
rm database-setup.sql
rm emergency-rls-bypass.sql
rm emergency-schema-fix.sql
rm fix-developers-table.sql
rm fix-supabase-schema.sql
```

### 4. STARE MARKDOWN DOCS (7 plików)
```bash
rm "claude 2.md"
rm "CLAUDE 4.md"
# KEEP: CLAUDE.md (aktualna instrukcja)
rm debugging_report.md
rm project_summary.md
rm LOGIN-CREDENTIALS.md
rm MIGRATION_TO_VERCEL_DB.md
rm DATABASE_SETUP.md
```

### 5. CSV LOGI (4+ plików)
```bash
rm "Supabase Performance Security Lints (maichqozswcomegcsaqg) (2).csv"
rm "Supabase Performance Security Lints (maichqozswcomegcsaqg) (3).csv"
rm "Supabase Performance Security Lints (maichqozswcomegcsaqg) (4).csv"
rm supabase-postgres-logs-maichqozswcomegcsaqg.csv.csv
rm supabase-storage-logs-maichqozswcomegcsaqg.csv.csv
```

### 6. INNE ŚMIECI
```bash
rm sample_test_data.csv
rm package-update-stripe.json
```

## ⚠️ PLIKI DO PRZENIESIENIA

### middleware.ts
```bash
# OBECNIE: /middleware.ts (root)
# POWINNO BYĆ: /src/middleware.ts
mv middleware.ts src/middleware.ts
```

## ✅ PLIKI DO ZACHOWANIA

```
✓ src/                    # Główny kod
✓ public/                 # Statyczne pliki
✓ node_modules/           # Dependencies
✓ .next/                  # Build cache (można usunąć przed build)
✓ supabase/              # Supabase config
✓ backup dokumentów/     # Ministry docs
✓ dokumenty/             # Inne docs
✓ CLAUDE.md              # Główna instrukcja
✓ PLAN_NAPRAWY_2025.md   # Aktualny plan
✓ package.json
✓ next.config.ts
✓ tsconfig.json
✓ .env.local
✓ .gitignore
```

## 📊 STATYSTYKI

**PRZED:**
- Całkowite pliki: ~150+
- Duplikaty: 77 (otoraport-app)
- Debug scripts: 10
- SQL śmieci: 6+
- MD dokumenty: 7
- CSV logi: 4+

**PO CLEANUP:**
- Czyste src/
- Żadnych duplikatów
- Żadnych debug scripts
- Tylko aktualne pliki

## 🚀 WYKONANIE

```bash
#!/bin/bash
cd "/Users/bartlomiejchudzik/Documents/Agencja AI/Real Estate App"

echo "🧹 Starting cleanup..."

# 1. Remove duplicate projects
echo "Removing duplicate projects..."
rm -rf otoraport-app/
rm -rf OTORAPORT/

# 2. Remove debug scripts
echo "Removing debug scripts..."
rm -f cleanup-demo-user.js
rm -f db-inspector.js
rm -f debug-database.js
rm -f debug-profile-check.js
rm -f debug-rls-policies.js
rm -f test-raw-data.js

# 3. Remove SQL files
echo "Removing SQL files..."
rm -f database-setup.sql
rm -f emergency-rls-bypass.sql
rm -f emergency-schema-fix.sql
rm -f fix-developers-table.sql
rm -f fix-supabase-schema.sql

# 4. Remove old docs
echo "Removing old docs..."
rm -f "claude 2.md"
rm -f "CLAUDE 4.md"
rm -f debugging_report.md
rm -f project_summary.md
rm -f LOGIN-CREDENTIALS.md
rm -f MIGRATION_TO_VERCEL_DB.md
rm -f DATABASE_SETUP.md

# 5. Remove CSV logs
echo "Removing CSV logs..."
rm -f "Supabase Performance Security Lints"*
rm -f supabase-*.csv.csv

# 6. Remove other garbage
echo "Removing other files..."
rm -f sample_test_data.csv
rm -f package-update-stripe.json

# 7. Move middleware
echo "Moving middleware to src/..."
if [ -f middleware.ts ]; then
  mv middleware.ts src/middleware.ts
fi

# 8. Clean build cache
echo "Cleaning build cache..."
rm -rf .next

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
du -sh . | awk '{print "Total size: " $1}'
find . -type f | wc -l | awk '{print "Total files: " $1}'
```

## ⚠️ UWAGA

**NIE URUCHAMIAJ JESZCZE!**

Najpierw sprawdź czy:
1. Git commit został zrobiony (backup)
2. Nie ma żadnych ważnych plików w `otoraport-app/`
3. Dev server jest zatrzymany