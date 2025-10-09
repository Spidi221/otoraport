# Task #48 - Subscription Limits Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER UPLOADS FILE                             │
│                     (CSV or Excel with properties)                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Upload API Route     │
                    │  /api/upload (POST)    │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │    Parse File          │
                    │  - Detect encoding     │
                    │  - Parse CSV/Excel     │
                    │  - Validate data       │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Count Properties        │
                    │ in Parsed Data          │
                    │ (e.g., 25 properties)   │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────▼─────────────────────┐
           │   enforcePropertyLimit(developerId, 25)   │
           │   (subscription-limits.ts middleware)     │
           └─────────────────────┬─────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Get Developer Plan     │
                    │  FROM developers table  │
                    │  → subscription_plan    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Get Plan Limits        │
                    │  FROM SUBSCRIPTION_PLANS│
                    │  - basic: 20            │
                    │  - pro: null (unlimited)│
                    │  - enterprise: null     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Count Existing Props   │
                    │  FROM properties table  │
                    │  WHERE developer_id = ? │
                    │  → current: 15          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Calculate Total        │
                    │  current + new          │
                    │  15 + 25 = 40          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Check Against Limit    │
                    │  40 > 20? YES!         │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
       LIMIT EXCEEDED                        WITHIN LIMIT
              │                                     │
              ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Return 403 Forbidden  │           │   Save to Database      │
│                         │           │                         │
│ {                       │           │  savePropertiesToDB()   │
│   error: "property_     │           │                         │
│     limit_exceeded",    │           │  - Insert properties    │
│   currentUsage: {       │           │  - Create/update project│
│     properties: 15,     │           │  - Return success       │
│     limit: 20           │           │                         │
│   },                    │           └────────────┬────────────┘
│   message: "Osiągnąłeś  │                        │
│     limit 20 mieszkań   │                        ▼
│     dla planu Basic..." │           ┌─────────────────────────┐
│   upgradeUrl: "/dash... │           │   Return 200 OK         │
│   planRecommendation:   │           │                         │
│     "pro"               │           │  - File uploaded        │
│ }                       │           │  - Properties saved     │
└────────────┬────────────┘           │  - Send email conf.     │
             │                        └─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│   Log Violation         │
│   for Analytics         │
│                         │
│ logLimitViolation()     │
│  - developerId          │
│  - limitType: property  │
│  - current: 15          │
│  - limit: 20            │
│  - attempted: 25        │
│  - plan: basic          │
└─────────────────────────┘
```

---

## Component Interactions

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Dashboard)                       │
│  - File upload component                                      │
│  - Error message display                                      │
│  - Upgrade prompt UI                                          │
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTP POST /api/upload
                 │ multipart/form-data
                 ▼
┌──────────────────────────────────────────────────────────────┐
│              Upload API (/api/upload/route.ts)                │
│  1. Authenticate user                                         │
│  2. Rate limiting check                                       │
│  3. Validate file                                            │
│  4. Parse CSV/Excel                                          │
│  5. ★ LIMIT CHECK ★                                          │
│  6. Save to database                                         │
│  7. Send email                                               │
└────────────────┬─────────────────────────────────────────────┘
                 │ calls
                 ▼
┌──────────────────────────────────────────────────────────────┐
│    Subscription Limits Middleware                             │
│    (/lib/middleware/subscription-limits.ts)                   │
│                                                               │
│  enforcePropertyLimit(developerId, count)                     │
│  ├─ Query developer plan                                     │
│  ├─ Get plan limits                                          │
│  ├─ Count existing properties                                │
│  ├─ Check: current + new <= limit?                          │
│  └─ Return { allowed, error? }                               │
└────────────────┬─────────────────────────────────────────────┘
                 │ queries
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Database                          │
│                                                               │
│  developers table          properties table                   │
│  ├─ id                    ├─ id                              │
│  ├─ subscription_plan     ├─ developer_id (FK)               │
│  └─ ...                   └─ ...                             │
└───────────────────────────────────────────────────────────────┘
```

---

## Error Response Flow

```
User exceeds limit
        │
        ▼
┌───────────────────────┐
│ API returns 403       │
│ with error object     │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Frontend receives     │
│ error response        │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────────────────────────────┐
│ Display Polish error message:                 │
│                                               │
│ "Osiągnąłeś limit 20 mieszkań dla planu       │
│  Basic. Masz obecnie 15 mieszkań.             │
│  Próbujesz dodać 25 mieszkań (łącznie: 40).   │
│  Przejdź na plan Pro dla unlimited mieszkań." │
│                                               │
│  [Upgrade to Pro] button                      │
│  → links to /dashboard/settings#subscription  │
└───────────────────────────────────────────────┘
```

---

## Data Flow: Successful Upload

```
Step 1: User uploads file
   ↓
Step 2: API parses and counts: 15 properties
   ↓
Step 3: enforcePropertyLimit(dev_123, 15)
   ↓
Step 4: Query developer: plan = "basic"
   ↓
Step 5: Get limits: basic.propertiesLimit = 20
   ↓
Step 6: Count existing: 5 properties
   ↓
Step 7: Calculate: 5 + 15 = 20 <= 20 ✓
   ↓
Step 8: Return { allowed: true }
   ↓
Step 9: Save 15 properties to database
   ↓
Step 10: Return 200 OK to user
   ↓
Step 11: Show success message
```

---

## Data Flow: Limit Exceeded

```
Step 1: User uploads file
   ↓
Step 2: API parses and counts: 25 properties
   ↓
Step 3: enforcePropertyLimit(dev_456, 25)
   ↓
Step 4: Query developer: plan = "basic"
   ↓
Step 5: Get limits: basic.propertiesLimit = 20
   ↓
Step 6: Count existing: 18 properties
   ↓
Step 7: Calculate: 18 + 25 = 43 > 20 ✗
   ↓
Step 8: Build error response:
        {
          error: "property_limit_exceeded",
          currentUsage: { properties: 18, limit: 20 },
          message: "Osiągnąłeś limit...",
          upgradeUrl: "/dashboard/settings#subscription",
          planRecommendation: "pro"
        }
   ↓
Step 9: logLimitViolation() for analytics
   ↓
Step 10: Return { allowed: false, error: {...} }
   ↓
Step 11: API returns 403 with error object
   ↓
Step 12: Frontend shows error + upgrade CTA
```

---

## Plan-Based Behavior Matrix

```
┌────────────┬─────────────┬──────────────┬─────────────────────┐
│    Plan    │ Properties  │   Projects   │   Behavior          │
├────────────┼─────────────┼──────────────┼─────────────────────┤
│   Basic    │    20       │      1       │ Hard limit at 20    │
│            │             │              │ Blocks at 21+       │
├────────────┼─────────────┼──────────────┼─────────────────────┤
│    Pro     │  Unlimited  │      2       │ No property limits  │
│            │   (null)    │  (+50zł/add) │ Project limit only  │
├────────────┼─────────────┼──────────────┼─────────────────────┤
│ Enterprise │  Unlimited  │  Unlimited   │ No limits at all    │
│            │   (null)    │    (null)    │                     │
└────────────┴─────────────┴──────────────┴─────────────────────┘
```

---

## Fail-Open Strategy

```
┌─────────────────────────┐
│  Database Query Error   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Log error to console   │
│  ❌ LIMIT ENFORCEMENT:  │
│  Failed to get developer│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Return { allowed: true}│
│  (Fail-open)            │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Allow operation        │
│  (Don't block user)     │
└─────────────────────────┘

Rationale:
- Better UX: Don't block paying customers
- Reliability: System issues shouldn't prevent uploads
- Monitoring: All failures are logged
- Manual fix: Rare over-limit cases can be handled later
```

---

## Analytics & Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│                   Log Entry Examples                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ LIMIT CHECK: Within limits - 15/20 properties           │
│     → User is approaching limit, might need reminder         │
│                                                              │
│  ⛔ LIMIT EXCEEDED: Developer abc123 - 18 + 25 > 20         │
│     → User hit limit, potential upgrade candidate            │
│                                                              │
│  📊 ANALYTICS: Limit violation logged                       │
│     { developerId, limitType, current, limit, attempted }    │
│     → Store for business intelligence                        │
│                                                              │
│  ❌ LIMIT ENFORCEMENT: Failed to get developer              │
│     → System issue, investigate immediately                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Enhancement Opportunities

### Phase 1: Soft Limits (Warnings)
```
Current: Hard limit at 20 → Block
Future:  Soft limit at 16 → Warn
         Hard limit at 20 → Block

┌──────────────┬──────────────┬─────────────┐
│  Properties  │    Action    │   Message   │
├──────────────┼──────────────┼─────────────┤
│   0-15       │   Allow      │   Normal    │
│  16-19       │   Allow      │   Warning   │
│   20+        │   Block      │   Error     │
└──────────────┴──────────────┴─────────────┘
```

### Phase 2: Grace Period
```
User exceeds limit
     ↓
Allow for 7 days (grace period)
     ↓
Daily reminder emails
     ↓
After 7 days: Hard block
```

### Phase 3: Usage-Based Analytics
```
Track over time:
- How often users hit limits
- Conversion rate: limit hit → upgrade
- Average time to upgrade after hitting limit
- Most common limit violations
```

---

## Security Considerations

### ✅ Implemented
- Uses Supabase Admin client (bypasses RLS for counting)
- Validates developer ownership before operations
- No sensitive data in error messages
- Rate limiting maintained from previous implementation

### 🔒 Additional Measures
- All database queries use parameterized queries
- Developer ID validation
- No direct user input in SQL
- Error messages sanitized

---

## Performance Impact

### Overhead Per Upload
```
Normal Upload Flow:
1. Auth check          ~10ms
2. File validation     ~50ms
3. Parse CSV/Excel     ~200ms
4. Save to DB          ~100ms
Total: ~360ms

With Limit Enforcement:
1. Auth check          ~10ms
2. File validation     ~50ms
3. Parse CSV/Excel     ~200ms
4. ★ Limit check       ~30ms  ← NEW
5. Save to DB          ~100ms
Total: ~390ms (+8% overhead)
```

### Database Queries Added
- 1x SELECT on developers table (indexed on id)
- 1x COUNT on properties table (indexed on developer_id)
- Both queries are fast (<10ms each typically)

### Optimization Opportunities
- Cache plan limits in memory (static data)
- Batch limit checks for multiple operations
- Use database triggers for real-time counters
- Redis cache for property counts

---

**Last Updated:** 2025-10-08
**Version:** 1.0
**Status:** Production Ready
