# PRD: Fix Test Failures - OTORAPORT v2

## Overview
Fix all ESLint and TypeScript errors discovered during comprehensive testing phase.

## Test Results Summary
- ESLint: 8 errors
- TypeScript: 87 errors
- Build: PASSES (but with type errors)
- Runtime: Works but type-unsafe

## Priority 1: Fix ESLint Errors (8 total)

### Task: Fix prefer-const errors
**Files:**
- src/app/api/upload-parsed/route.ts:88
- src/app/api/upload/route.ts:266

**Issue:** Variables declared with `let` but never reassigned

**Fix:** Change `let projectLookupError` to `const projectLookupError`

### Task: Fix non-null assertion errors
**File:** src/components/help/GuidedTour.tsx:367-373

**Issue:** Using non-null assertion on optional chain (unsafe)

**Fix:** Replace `obj?.prop!` with `obj?.prop ?? defaultValue` or proper null checks

## Priority 2: Fix TypeScript Errors (87 total)

### Task: Create missing help-system module
**Files affected:** 9 files

**Issue:** Cannot find module '@/lib/help-system'

**Files:**
- src/components/help/GuidedTour.tsx
- src/components/help/HelpButton.tsx
- src/components/help/HelpOverlay.tsx
- src/components/help/ProactiveHelpSystem.tsx

**Solution:** Create src/lib/help-system.ts with required types and functions

### Task: Fix admin-dashboard interface mismatches
**File:** src/components/admin/admin-dashboard.tsx
**Errors:** 48 type errors

**Issues:**
1. SystemStats missing fields: totalProjects, monthlyRevenue, systemHealth, paidDevelopers
2. Developer missing fields: name, nip, total_projects, total_properties
3. LogEntry missing fields: level, message, created_at, user_id, ip_address
4. ComplianceData: snake_case vs camelCase mismatch (compliant_developers vs compliantDevelopers)
5. RevenueData missing fields: totalRevenue, paymentCount

**Solution:** Update all interfaces to match actual usage in JSX

### Task: Add Supabase client null safety
**Files:** 10 errors across multiple files

**Affected:**
- src/app/auth/signin/page.tsx
- src/app/auth/signup/page.tsx
- src/components/dashboard/*.tsx
- src/hooks/use-auth-simple.ts

**Issue:** `supabase` is possibly 'undefined'

**Solution:** Add null checks after createBrowserClient() or use non-null pattern

### Task: Fix upload API type mismatches
**Files:**
- src/app/api/upload.ts
- src/app/api/upload-parsed.ts
- src/app/api/public/[clientId]/*.ts

**Issues:**
1. Missing `name` property on developer type
2. ParsedProperty[] type mismatch with expected type
3. String | number type issues
4. Missing getErrorMessage function

**Solution:** Fix type definitions and add missing properties

### Task: Fix remaining TypeScript errors
**Various files:** ~12 errors

**Issues:**
- Input component size prop conflict
- FileRejection type mismatch
- Missing utility modules (@/utils/validation)
- Implicit any types

## Success Criteria
- `npm run lint` returns 0 errors
- `npx tsc --noEmit` returns 0 errors
- `npm run build` succeeds
- All tests pass

## Testing Requirements
After fixes, run comprehensive tests including:
1. ESLint validation
2. TypeScript compilation
3. Production build
4. CSV file parsing with real files from backup/przykładowe pliki
5. API endpoint testing
6. Runtime validation

## Files to Test Parsing
Use CSV files from: `/Users/bartlomiejchudzik/Documents/Agencja AI/Real Estate App/otoraport-v2/backup dokumentów real estate app/przykładowe pliki/`

Expected files:
- 2025-09-11.csv
- 2025-10-02.xlsx - wzorcowy zakres danych.csv
- atal - Dane.csv
- Ceny-ofertowe-mieszkan-dewelopera-inpro_s__a-2025-10-02.csv
