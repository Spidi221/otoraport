import { SupabaseAdapter } from '@auth/supabase-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'

// SECURITY: Validate required environment variables
function validateEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate on module load
validateEnvVars();

export const authOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    schema: 'public', // Force public schema where our tables are
  }),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    // DEVELOPMENT TEST PROVIDER - Pozwala logowanie jako istniejący developer z bazy
    CredentialsProvider({
      id: 'test-developer',
      name: 'Test as Developer',
      credentials: {
        client_id: { label: 'Client ID (e.g. rolbestcompany123)', type: 'text', placeholder: 'rolbestcompany123' },
      },
      async authorize(credentials) {
        if (!credentials?.client_id) return null;

        try {
          // Znajdź developera po client_id
          const { supabaseAdmin } = await import('./supabase');
          const { data: developer, error } = await supabaseAdmin
            .from('developers')
            .select('*')
            .eq('client_id', credentials.client_id)
            .single();

          if (error || !developer) {
            console.error('Developer not found:', credentials.client_id);
            return null;
          }

          return {
            id: developer.id,
            email: developer.email || `${developer.client_id}@test.local`,
            name: developer.company_name || developer.name,
            image: null,
            // Dodaj developer data do sesji
            developerId: developer.id,
            clientId: developer.client_id,
            subscriptionPlan: developer.subscription_plan || 'basic'
          };
        } catch (error) {
          console.error('Test auth error:', error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) {
            console.error('Auth error:', error)
            return null
          }

          if (data.user) {
            return {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.email!,
            }
          }

          return null
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: { token: any; user?: any; account?: any }) {
      if (user) {
        token.id = user.id
        token.email = user.email

        // Track OAuth provider for profile completion logic
        if (account?.provider) {
          token.provider = account.provider
        }

        // For test-developer provider, copy developer data directly
        if (account?.provider === 'test-developer') {
          token.developerId = user.developerId
          token.clientId = user.clientId
          token.subscriptionPlan = user.subscriptionPlan
          token.registrationCompleted = true
          token.provider = 'test-developer'
        }
      }
      
      // Add developer profile info to token
      if (token.id && token.provider === 'google') {
        try {
          const { data: bridgeData } = await supabase
            .rpc('get_developer_by_nextauth_user', { user_id: token.id as string })
            .single()
          
          if (bridgeData) {
            token.developerId = bridgeData.developer_id
            token.registrationCompleted = bridgeData.registration_completed
            token.subscriptionPlan = bridgeData.subscription_plan
            token.subscriptionStatus = bridgeData.subscription_status
          }
        } catch (error) {
          console.error('Error fetching developer profile:', error)
        }
      }
      
      return token
    },
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id as string
        session.user.provider = token.provider
        session.user.developerId = token.developerId
        session.user.clientId = token.clientId
        session.user.registrationCompleted = token.registrationCompleted
        session.user.subscriptionPlan = token.subscriptionPlan
        session.user.subscriptionStatus = token.subscriptionStatus
      }
      return session
    },
    
    // Critical: Handle Google OAuth registration and redirect logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      if (account?.provider === 'google') {
        console.log('Google OAuth sign-in attempt:', {
          userId: user.id,
          email: user.email,
          provider: account.provider,
          profileExists: !!profile
        })
        
        // Allow NextAuth to proceed with account creation
        // The database trigger will handle developer profile creation
        return true
      }
      
      // For test-developer provider - allow sign-in
      if (account?.provider === 'test-developer') {
        console.log('Test developer sign-in:', {
          clientId: user.clientId,
          developerId: user.developerId,
          email: user.email
        });
        return true;
      }

      // For credentials sign-in
      if (account?.provider === 'credentials') {
        return true
      }

      return true
    },
    
    // Handle redirect after sign in
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If the URL is a relative path, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // If URL is on same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      // Default to dashboard with registration check
      return `${baseUrl}/dashboard`
    }
  },
}