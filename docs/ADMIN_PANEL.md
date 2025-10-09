# Admin Panel Documentation

## Overview

The admin panel is a comprehensive user management system for OTO-RAPORT administrators. It provides secure access to user data, system statistics, and audit logs.

**Task**: #57 - Build Admin Panel with User Management
**Priority**: HIGH
**Security Level**: CRITICAL

## Features

### 1. Role-Based Access Control (RBAC)

Three admin roles with different permission levels:

- **Super Admin**: Full system access, can manage other admins
- **Admin**: Standard admin privileges, user management
- **Support**: Read-only access, customer support functions

### 2. User Management

Complete user management interface with:

- User listing with pagination (20 users per page)
- Real-time search by email or company name
- Filter by subscription plan (Basic, Pro, Enterprise)
- Sort by multiple fields (created_at, email, company_name, properties_count)
- User statistics (properties count, projects count)
- Admin status badges
- Subscription status visualization

### 3. Dashboard Statistics

Real-time system metrics:

- Total registered users
- Active subscriptions count
- Total properties in system
- Total development projects
- Recent uploads (last 7 days)
- System status indicator

### 4. Security Features

- Row Level Security (RLS) on all admin tables
- Admin access logging for compliance
- IP address and user agent tracking
- Secure middleware protecting all admin routes
- Client-side and server-side authentication verification

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                    # Protected admin layout
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Dashboard with statistics
│   │   ├── users/
│   │   │   └── page.tsx                 # User management interface
│   │   └── audit-logs/
│   │       └── page.tsx                 # Audit trail viewer
│   └── api/
│       └── admin/
│           ├── check-access/
│           │   └── route.ts             # Admin access verification
│           ├── stats/
│           │   └── route.ts             # Dashboard statistics
│           └── users/
│               └── route.ts             # User management API
├── lib/
│   └── middleware/
│       └── require-admin.ts             # Admin middleware & utilities
└── types/
    └── database.ts                      # Updated with admin tables

supabase/
└── migrations/
    └── 20251008_120000_add_admin_rbac.sql  # Database migration
```

## Database Schema

### admin_roles Table

```sql
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);
```

### admin_audit_logs Table

```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### developers Table (Updated)

Added `is_admin` column:

```sql
ALTER TABLE developers ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;
```

## API Endpoints

### GET /api/admin/check-access

Verify if current user has admin access.

**Response:**
```json
{
  "isAdmin": true,
  "roles": ["super_admin"],
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  }
}
```

### GET /api/admin/stats

Get dashboard statistics (requires admin access).

**Response:**
```json
{
  "totalUsers": 150,
  "activeSubscriptions": 89,
  "totalProperties": 4523,
  "totalProjects": 45,
  "recentUploads": 12
}
```

### GET /api/admin/users

List all users with advanced filtering.

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20, max: 100): Results per page
- `search`: Search by email or company name
- `plan`: Filter by subscription plan (all/basic/pro/enterprise)
- `sortBy` (default: created_at): Sort field
- `sortOrder` (default: desc): Sort direction (asc/desc)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "company_name": "Example Corp",
      "subscription_plan": "pro",
      "subscription_status": "active",
      "properties_count": 45,
      "projects_count": 3,
      "created_at": "2025-01-01T00:00:00Z",
      "is_admin": false,
      "last_login_at": "2025-10-08T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "filters": {
    "search": "",
    "plan": "all",
    "sortBy": "created_at",
    "sortOrder": "desc"
  }
}
```

## Usage

### Accessing Admin Panel

1. Navigate to `/admin/dashboard`
2. System will verify admin access automatically
3. Non-admins are redirected to main dashboard

### Granting Admin Access

#### Method 1: Database (Super Admin)

```sql
-- Make user admin via developers table
UPDATE developers
SET is_admin = true
WHERE email = 'newadmin@example.com';

-- Or add specific role
INSERT INTO admin_roles (user_id, role, created_by)
SELECT id, 'admin', 'super_admin_user_id'
FROM auth.users
WHERE email = 'newadmin@example.com';
```

#### Method 2: Using Admin Middleware

```typescript
import { requireAdmin, logAdminAction } from '@/lib/middleware/require-admin'

export async function POST(request: NextRequest) {
  // Require admin access
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck // 401/403 error
  }

  // Admin is authenticated
  const { user, adminRoles, developerId } = adminCheck

  // Log the action
  await logAdminAction(
    user.id,
    'performed_action',
    targetUserId,
    { details: 'whatever' },
    request
  )

  // ... your admin logic
}
```

### Checking Admin Status

```typescript
import { checkAdminAccess, hasRole, isSuperAdmin } from '@/lib/middleware/require-admin'

// Check if current user is admin
const adminCheck = await checkAdminAccess()

if (adminCheck.isAdmin) {
  console.log('User is admin with roles:', adminCheck.adminRoles)

  // Check specific role
  if (hasRole(adminCheck, 'super_admin')) {
    // Super admin only actions
  }

  // Or use convenience function
  if (isSuperAdmin(adminCheck)) {
    // Super admin only actions
  }
}
```

## Security Considerations

### Row Level Security (RLS)

All admin tables have RLS enabled:

- **admin_roles**: Only super_admins can view/modify
- **admin_audit_logs**: Only admins can view, system can insert
- **developers**: Standard RLS applies, is_admin column is visible

### Middleware Protection

Admin routes are protected at multiple levels:

1. **Next.js Middleware** (`src/middleware.ts`): Requires authentication
2. **Admin Layout** (`src/app/admin/layout.tsx`): Client-side verification
3. **API Middleware** (`requireAdmin()`): Server-side verification on every request

### Audit Logging

Every admin action is logged with:

- Admin user ID
- Action performed
- Target user (if applicable)
- Additional details (JSON)
- IP address
- User agent
- Timestamp

**Example logged actions:**
- `view_dashboard_stats`
- `list_users`
- `update_user_subscription`
- `delete_user_data`

### Best Practices

1. **Always use `requireAdmin()`** in admin API routes
2. **Log all significant actions** using `logAdminAction()`
3. **Never hardcode admin checks** - use the middleware functions
4. **Review audit logs regularly** for suspicious activity
5. **Limit super_admin role** to 1-2 trusted users

## Migration Instructions

1. **Run the migration:**
   ```bash
   # If using Supabase CLI
   supabase db push

   # Or apply manually in Supabase Dashboard
   # Copy contents of supabase/migrations/20251008_120000_add_admin_rbac.sql
   ```

2. **Verify super admin was created:**
   ```sql
   SELECT ar.*, au.email
   FROM admin_roles ar
   JOIN auth.users au ON ar.user_id = au.id
   WHERE ar.role = 'super_admin';
   ```

3. **Test admin access:**
   - Log in as super admin user (chudziszewski221@gmail.com)
   - Navigate to `/admin/dashboard`
   - Verify dashboard loads with statistics
   - Navigate to `/admin/users`
   - Verify user list loads with all data

4. **Update TypeScript types:**
   ```bash
   # Types are already updated in src/types/database.ts
   # Verify by running TypeScript compiler
   npm run type-check
   ```

## Troubleshooting

### "Access Denied" Error

1. Check if user has admin role:
   ```sql
   SELECT * FROM developers WHERE email = 'your@email.com';
   SELECT * FROM admin_roles ar
   JOIN auth.users au ON ar.user_id = au.id
   WHERE au.email = 'your@email.com';
   ```

2. Verify RLS policies are active:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('admin_roles', 'admin_audit_logs');
   ```

### Admin Routes Not Loading

1. Check middleware is not blocking admin routes
2. Verify `/api/admin/check-access` returns 200
3. Check browser console for authentication errors
4. Verify cookies are being set correctly

### Audit Logs Not Creating

1. Check if admin user ID is valid
2. Verify RLS policy allows insert (should use service role)
3. Check database logs for errors

## Future Enhancements

Potential additions for future sprints:

- [ ] Audit logs viewer UI (basic placeholder exists)
- [ ] User detail modal with full profile
- [ ] Bulk user operations (activate/deactivate)
- [ ] Admin role management UI
- [ ] Email notification system for admin actions
- [ ] Export users to CSV
- [ ] Advanced analytics dashboard
- [ ] Real-time user activity monitoring

## Testing Checklist

- [ ] Migration runs successfully without errors
- [ ] Super admin can access `/admin/dashboard`
- [ ] Super admin can access `/admin/users`
- [ ] Non-admin users get 403 on admin routes
- [ ] User search works correctly
- [ ] User filtering by plan works
- [ ] Pagination works correctly
- [ ] Sorting works for all columns
- [ ] Dashboard statistics are accurate
- [ ] Audit logs are being created
- [ ] Admin middleware blocks unauthorized access
- [ ] TypeScript types are correct

## Support

For issues or questions about the admin panel:

1. Check this documentation first
2. Review audit logs for security issues
3. Check Supabase dashboard for RLS policy issues
4. Contact development team for access issues

---

**Last Updated**: 2025-10-08
**Version**: 1.0
**Task**: #57
