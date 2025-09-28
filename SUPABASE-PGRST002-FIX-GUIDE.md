# SUPABASE PGRST002 ERROR - CRITICAL FIX GUIDE

## 🚨 PROBLEM DIAGNOSIS

**ERROR**: PGRST002 - "Could not query the database for the schema cache. Retrying."
**STATUS**: 503 Service Unavailable
**IMPACT**: Complete application failure - no database queries work
**ROOT CAUSE**: PostgREST service cannot access the database schema cache

## 🔍 CONFIRMED ISSUES

Based on diagnostics, ALL database operations fail with PGRST002:
- ❌ Service Role queries fail
- ❌ Anonymous client queries fail
- ❌ Schema information queries fail
- ❌ Direct connection tests fail
- ❌ All table access blocked

## 🛠️ SOLUTION STEPS

### STEP 1: IMMEDIATE FIXES (Try in order)

#### Option A: Supabase Dashboard - Restart Database
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `maichqozswcomegcsaqg`
3. Go to **Settings** → **General**
4. Click **"Restart project"**
5. Wait 2-3 minutes for full restart
6. Test database access

#### Option B: Schema Cache Reload (if restart doesn't work)
Run this SQL in Supabase Dashboard → SQL Editor:
```sql
-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Check PostgREST connection
SELECT 1 as test_connection;
```

#### Option C: Database Schema Recreation (if above fail)
1. Run the provided `fix-supabase-schema.sql` file in SQL Editor
2. This recreates all tables with proper structure
3. Forces schema cache reload

### STEP 2: VERIFY DATABASE STRUCTURE

After restart/reload, run this diagnostic SQL:
```sql
-- Check if tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check PostgREST schema cache
SELECT schemaname, tablename
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Test basic query
SELECT COUNT(*) FROM developers;
```

### STEP 3: TEST APPLICATION ACCESS

Run the test script:
```bash
node test-schema-fix.js
```

Expected results after fix:
- ✅ Service Role access works
- ✅ Tables are accessible
- ✅ Insert operations work
- ✅ Schema information available

## 🔧 ADVANCED TROUBLESHOOTING

### If PGRST002 persists after restart:

#### Check 1: Database Connection Limits
```sql
-- Check active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Check connection limits
SHOW max_connections;
```

#### Check 2: PostgREST Configuration
The error might indicate PostgREST service misconfiguration:
- Database URL incorrect
- Connection pool exhausted
- Network connectivity issues
- Database credentials invalid

#### Check 3: Supabase Service Status
- Check https://status.supabase.com
- Look for infrastructure incidents
- Contact Supabase support if widespread issue

## 🚨 CRITICAL ACTIONS NEEDED

### IMMEDIATE (Do now):
1. **Restart Supabase project** from dashboard
2. **Run schema fix SQL** if restart doesn't work
3. **Test database access** with provided script

### SHORT TERM (Next 24 hours):
1. **Monitor database stability** - set up health checks
2. **Implement retry logic** in application code
3. **Create backup/restore procedures**

### LONG TERM (Next week):
1. **Database monitoring setup**
2. **Connection pooling optimization**
3. **Failover strategy planning**

## 📋 TESTING CHECKLIST

After applying fixes:
- [ ] Database restart completed
- [ ] Schema cache reload successful
- [ ] All core tables accessible
- [ ] Service role queries work
- [ ] RLS policies active
- [ ] Demo data present
- [ ] Frontend can connect
- [ ] No PGRST002 errors in logs

## 🆘 ESCALATION PATH

If all solutions fail:

### Level 1: Supabase Support
- Submit ticket at https://supabase.com/dashboard/support
- Include project ID: `maichqozswcomegcsaqg`
- Reference PGRST002 error code
- Attach diagnostic logs

### Level 2: Database Migration
- Consider migrating to new Supabase project
- Export data using pg_dump
- Import to fresh instance
- Update connection strings

### Level 3: Alternative Solutions
- Switch to direct PostgreSQL connection
- Implement custom API layer
- Use different database provider

## 📊 SUCCESS METRICS

Fix is successful when:
- ✅ HTTP 200 responses from database
- ✅ No PGRST002 errors in logs
- ✅ Frontend loads developer data
- ✅ File uploads work
- ✅ XML generation functional

## ⚡ QUICK COMMANDS

```bash
# Test current status
node debug-database.js

# Test after fix
node test-schema-fix.js

# Apply schema fix (run SQL in Supabase Dashboard)
cat fix-supabase-schema.sql

# Check logs (if available)
tail -f /var/log/supabase/postgrest.log
```

---

**PRIORITY**: CRITICAL - Business stopping issue
**IMPACT**: 100% application downtime
**EFFORT**: Medium (1-2 hours to resolve)
**SUCCESS RATE**: High (90%+ with restart/reload)