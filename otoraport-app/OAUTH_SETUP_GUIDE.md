# Google OAuth Setup Guide for OTORAPORT

## Critical Issue Fixed
The Google OAuth registration was failing because users were being created in NextAuth tables but there was no bridge to your custom `developers` table. This created a disconnect where:

1. Google OAuth created user account
2. User was redirected to dashboard
3. Dashboard checked for developer profile (in wrong table)
4. Profile check failed → redirected back to login

## Setup Required

### 1. Configure Google OAuth Credentials

Replace the placeholder values in `.env.local`:

```bash
# Update these with real Google OAuth credentials
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

# Ensure these are set
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen with your app details
6. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 3. Run Database Migration

Execute the migration to create required tables:

```bash
# Run this SQL in your Supabase SQL editor
-- Content is in: supabase/migrations/fix_auth_tables.sql
```

### 4. Test the Fixed Flow

1. User clicks "Continue with Google" on signup page
2. Google OAuth redirects to `/onboarding?reason=incomplete_profile`
3. User completes company profile form
4. Profile is created in `developers` table and linked to `users` table
5. User is redirected to dashboard successfully

## New Files Created:

1. **Database Migration**: `supabase/migrations/fix_auth_tables.sql`
2. **OAuth Profile Completion API**: `src/app/api/oauth/complete-profile/route.ts`
3. **Updated Onboarding**: `src/app/onboarding/page.tsx` (with profile form)

## Updated Files:

1. **Auth Configuration**: `src/lib/auth.ts` (added OAuth callbacks)
2. **Profile API**: `src/app/api/user/profile/route.ts` (fixed table queries)

## Key Changes Made:

### Database Schema
- Created bridge table `user_profiles` linking NextAuth users to developers
- Added triggers to handle OAuth user creation
- Proper foreign key relationships

### Authentication Flow
- Added OAuth provider tracking in JWT tokens
- Proper signIn callback handling
- Enhanced error logging for debugging

### Profile Completion
- New API endpoint for OAuth profile completion
- Form integrated into onboarding flow
- Proper validation and error handling

## Testing Steps:

1. Clear browser cookies/localStorage
2. Try Google OAuth signup
3. Should be redirected to profile completion form
4. Fill in company details
5. Should successfully access dashboard

## Debugging:

Check browser console and server logs for:
- "Google OAuth sign-in attempt" messages
- Profile completion success/failure
- Database operation results

The issue should now be resolved with proper OAuth account creation and profile linking.