'use client'

import { z } from 'zod'

// Environment variable validation schema
const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100, 'Invalid Supabase anon key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100, 'Invalid Supabase service role key'),

  // Admin configuration (Required)
  ADMIN_EMAILS: z.string().min(1, 'Admin emails must be configured'),

  // Email service (Required for production)
  RESEND_API_KEY: z.string().min(10, 'Resend API key required'),
  EMAIL_FROM: z.string().email('Invalid sender email'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables
export function validateEnv(): { success: boolean; errors?: string[] } {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NODE_ENV: process.env.NODE_ENV,
    }

    envSchema.parse(env)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

// Get validated environment variables
export function getEnv(): Env {
  const validation = validateEnv()
  if (!validation.success) {
    throw new Error(`Environment validation failed: ${validation.errors?.join(', ')}`)
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS!,
    RESEND_API_KEY: process.env.RESEND_API_KEY!,
    EMAIL_FROM: process.env.EMAIL_FROM!,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  }
}

// Runtime environment validation middleware
export function validateEnvironmentOrThrow(): void {
  const validation = validateEnv()
  if (!validation.success) {
    console.error('❌ Environment validation failed:')
    validation.errors?.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  }
  console.log('✅ Environment variables validated successfully')
}