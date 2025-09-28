import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const prisma = new PrismaClient()

// SECURITY: Validate required environment variables
function validateEnvVars() {
  const required = [
    'POSTGRES_PRISMA_URL',
    'NEXTAUTH_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate on module load
validateEnvVars();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              developer: true
            }
          })

          if (!user) {
            return null
          }

          // For MVP: Accept any password for existing users
          // In production: verify hashed password here
          const isValidPassword = credentials.password.length > 0

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.developer?.companyName || user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Auto-create developer profile on first sign-in
        if (account?.provider === "google" || account?.provider === "credentials") {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { developer: true }
          })

          if (existingUser && !existingUser.developer) {
            // Create developer profile
            const clientId = generateClientId(user.email!)

            await prisma.developer.create({
              data: {
                userId: existingUser.id,
                email: user.email!,
                companyName: user.name || user.email!,
                clientId: clientId,
                xmlUrl: `${process.env.NEXTAUTH_URL}/api/public/${clientId}/data.xml`,
                md5Url: `${process.env.NEXTAUTH_URL}/api/public/${clientId}/data.md5`,
              }
            })
          }
        }
        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return true // Don't block sign-in on developer creation failure
      }
    },
    async session({ session, user }) {
      if (session.user) {
        // Add user ID and role to session
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          include: { developer: true }
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
          session.user.developer = dbUser.developer
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Generate client ID from email
function generateClientId(email: string): string {
  const base = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10)

  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

// Check if user is admin
export function isAdmin(email?: string): boolean {
  if (!email) return false

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(email)
}

// Extended session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      developer?: {
        id: string
        clientId: string
        companyName: string
        subscriptionPlan: string
        subscriptionStatus: string
      } | null
    }
  }

  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}