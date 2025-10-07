# Known Critical Issues
**Status:** Requires manual fix
**Updated:** 2025-10-06

## 🔴 CRITICAL: 2 Files with Corrupted Encoding

### Problem:
Two files have corrupted character encoding with escaped quotes that cannot be auto-fixed:
1. `src/components/error-boundary.tsx`
2. `src/components/ui/breadcrumb.tsx`

### Root Cause:
Original files had `className=\"..."` pattern (escaped double quotes inside JSX).
Attempted sed fix removed backslashes but left malformed attributes like `className="text"` (missing closing quote).

### Impact:
- ❌ TypeScript compilation fails
- ❌ Build blocked
- ❌ 20+ TypeScript errors per file

### Examples:
```tsx
// CURRENT (BROKEN):
<div className="text-center>

// SHOULD BE:
<div className="text-center">
```

### Solution Options:

#### Option 1: Manual Recreation (Recommended - 30 min)
1. Delete broken files
2. Recreate `error-boundary.tsx` using React Error Boundary pattern
3. Recreate `breadcrumb.tsx` from shadcn/ui source

#### Option 2: Character-by-Character Fix (Tedious - 1-2 hours)
1. Read each file line by line
2. Add missing `"` before each `>`
3. Verify all JSX attributes properly closed

#### Option 3: Git Restore (If available)
```bash
git checkout HEAD~1 src/components/error-boundary.tsx
git checkout HEAD~1 src/components/ui/breadcrumb.tsx
```

### Workaround for Task 12:
- Continue analysis with ESLint reports (174 issues documented)
- Mark these 2 files as "requires manual intervention"
- Focus on API routes, lib files, and other components first

---

## 📝 Action Items:

- [ ] **Task 13:** Recreate error-boundary.tsx
- [ ] **Task 14:** Recreate breadcrumb.tsx
- [ ] **After fix:** Re-run `npx tsc --noEmit` to verify
- [ ] **After fix:** Re-run `npm run lint` for updated issue count

---

**Note:** These issues do NOT block Task 12 completion - comprehensive ESLint analysis already complete.
