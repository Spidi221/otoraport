# Supabase Database Migrations

This directory contains SQL migration files for the OTORAPORT database schema.

## How to Apply Migrations

Since this project uses Supabase hosted database, migrations must be applied manually via the Supabase Dashboard.

### Steps to Apply Migration

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open the migration file you want to apply
   - Copy its entire contents

4. **Execute Migration**
   - Paste the SQL into the SQL Editor
   - Review the SQL to ensure it's correct
   - Click "Run" to execute the migration

5. **Verify Changes**
   - Check the "Database" section to verify tables were created/modified
   - Check "Table Editor" to see the new columns

## Available Migrations

### 20251007_add_notifications_and_email_preferences.sql

**Description**: Creates notifications system and adds email preference columns

**Changes:**
- ✅ Creates `notifications` table with RLS policies
- ✅ Adds `email_notifications_enabled` column to `developers` table
- ✅ Adds `notification_frequency` column to `developers` table
- ✅ Verifies `status` column exists in `properties` table (added in Task #39)
- ✅ Creates performance indexes
- ✅ Implements RLS policies for security

**Dependencies**: None - can be applied to existing database

**Rollback**: If needed, run the following SQL to rollback:
```sql
-- Drop notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Remove email preference columns
ALTER TABLE public.developers DROP COLUMN IF EXISTS email_notifications_enabled;
ALTER TABLE public.developers DROP COLUMN IF EXISTS notification_frequency;

-- Note: status column in properties is preserved as it's used by existing features
```

## Important Notes

### Property Status Column
The `status` column in the `properties` table was already added during Task #39 implementation. This migration includes a verification check but will not fail if the column already exists.

### TypeScript Types
After applying migrations, ensure the TypeScript types in `src/types/database.ts` are updated to match the new schema. This has already been done for migration `20251007_add_notifications_and_email_preferences.sql`.

### Testing
After applying a migration:
1. Run `npm run build` to verify TypeScript compilation
2. Test the affected features in development
3. Verify RLS policies work correctly by testing with different user accounts

## Migration Naming Convention

Migrations follow this naming pattern:
```
YYYYMMDD_descriptive_name.sql
```

Example: `20251007_add_notifications_and_email_preferences.sql`

## Best Practices

1. **Always backup** before applying migrations in production
2. **Test migrations** in development/staging first
3. **Review SQL** carefully before executing
4. **Document changes** in this README when adding new migrations
5. **Update TypeScript types** after schema changes
6. **Verify RLS policies** to ensure data security

## Support

If you encounter issues with migrations:
1. Check Supabase logs in Dashboard > Logs
2. Verify RLS policies in Dashboard > Authentication > Policies
3. Review table structure in Dashboard > Database > Tables
4. Check indexes in Dashboard > Database > Indexes
