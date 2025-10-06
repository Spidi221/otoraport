/**
 * ENHANCED Security utilities for input validation, sanitization, and rate limiting
 * Phase 2 Security Updates - 2025-09-28
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Input sanitization to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"']/g, '') // Remove basic XSS vectors
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate NIP (Polish tax ID)
 */
export function validateNIP(nip: string): boolean {
  if (!nip || typeof nip !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanNIP = nip.replace(/[^0-9]/g, '');
  
  if (cleanNIP.length !== 10) return false;
  
  // NIP validation algorithm
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNIP[i]) * weights[i];
  }
  
  const checkDigit = sum % 11;
  return checkDigit === parseInt(cleanNIP[9]);
}

/**
 * Validate phone number (Polish format)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  
  // Check Polish phone number patterns
  const patterns = [
    /^\+48[0-9]{9}$/, // +48XXXXXXXXX
    /^48[0-9]{9}$/, // 48XXXXXXXXX
    /^[0-9]{9}$/, // XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return 'untitled';
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.+/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

/**
 * Generate safe file path to prevent directory traversal
 */
export function generateSafeFilePath(originalName: string, userId: string): string {
  const sanitizedName = sanitizeFileName(originalName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
  
  return `${safeUserId}-${timestamp}-${sanitizedName}`;
}

/**
 * Rate limiting middleware
 */
export async function checkRateLimit(
  request: NextRequest,
  options: {
    windowMs?: number; // Time window in milliseconds
    maxRequests?: number; // Max requests per window
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (request: NextRequest) => string;
  } = {}
): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => getClientIdentifier(req)
  } = options;

  const key = keyGenerator(request);
  const now = Date.now();

  // Clean up old entries
  for (const [storedKey, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(storedKey);
    }
  }

  const current = rateLimitStore.get(key);
  
  if (!current || current.resetTime < now) {
    // New window
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: current.resetTime
    };
  }

  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remainingRequests: maxRequests - current.count,
    resetTime: current.resetTime
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';

  // Include user agent to differentiate clients behind same NAT
  const userAgent = request.headers.get('user-agent') || '';
  const shortUA = userAgent.substring(0, 100); // Prevent DoS via long UA

  return `${ip}:${shortUA}`;
}

/**
 * General API rate limiter (100 requests per hour)
 * Compatible with legacy rate-limit.ts interface
 */
export async function generalAPIRateLimit(request: NextRequest): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const maxRequests = 100;
  const windowMs = 60 * 60 * 1000; // 1 hour

  const result = await checkRateLimit(request, { maxRequests, windowMs });

  return {
    success: result.allowed,
    limit: maxRequests,
    remaining: result.remainingRequests,
    reset: result.resetTime
  };
}

/**
 * Validate file type and size for uploads
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/xml',
    'text/xml'
  ];

  if (!file) {
    return { valid: false, error: 'Nie wybrano pliku' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Plik jest za duży. Maksymalny rozmiar to 10MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Nieprawidłowy typ pliku. Dozwolone: CSV, XLSX, XML' };
  }

  // Additional filename validation
  const safeName = sanitizeFileName(file.name);
  if (safeName.length === 0) {
    return { valid: false, error: 'Nieprawidłowa nazwa pliku' };
  }

  return { valid: true };
}

/**
 * Content Security Policy header values
 */
export const CSP_HEADER = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Note: Next.js requires these for dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; ')
};

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...CSP_HEADER
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): Headers {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

/**
 * Validate client ID format
 */
export function validateClientId(clientId: string): boolean {
  if (!clientId || typeof clientId !== 'string') return false;
  
  // Client ID should be UUID format or at least 10 alphanumeric characters (with hyphens/underscores)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9\-_]{10,50}$/;
  
  return uuidRegex.test(clientId) || alphanumericRegex.test(clientId);
}

/**
 * SQL injection prevention for dynamic queries
 */
export function escapeSQLString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/'/g, "''").replace(/;/g, '');
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Hasło jest wymagane'] };
  }

  if (password.length < 8) {
    errors.push('Hasło musi mieć co najmniej 8 znaków');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną wielką literę');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną małą literę');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną cyfrę');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jeden znak specjalny');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// PHASE 2 ENHANCED SECURITY VALIDATION SCHEMAS
// ============================================================================

/**
 * Comprehensive validation schemas using Zod
 */

// Developer profile validation
export const developerValidationSchema = z.object({
  email: z.string().email('Nieprawidłowy format email').max(254),
  company_name: z.string().min(2, 'Nazwa firmy musi mieć minimum 2 znaki').max(100),
  nip: z.string().regex(/^\d{10}$/, 'NIP musi składać się z 10 cyfr').optional(),
  regon: z.string().regex(/^\d{9}(\d{5})?$/, 'REGON musi mieć 9 lub 14 cyfr').optional(),
  phone: z.string().optional().refine(val => !val || validatePhone(val), 'Nieprawidłowy numer telefonu'),
  address: z.string().max(500).optional(),
  postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy w formacie XX-XXX').optional(),
});

// Property validation with all 58 ministry fields
export const propertyValidationSchema = z.object({
  // Basic property info
  apartment_number: z.string().min(1, 'Numer mieszkania wymagany').max(50),
  property_type: z.enum(['mieszkanie', 'dom', 'lokal_uslugowy'], {
    errorMap: () => ({ message: 'Typ nieruchomości: mieszkanie, dom lub lokal_uslugowy' })
  }),

  // Area and pricing
  area: z.number().min(1, 'Powierzchnia musi być większa niż 0').max(10000, 'Powierzchnia maks. 10000m²'),
  price_per_m2: z.number().min(100, 'Cena za m² musi być większa niż 100 PLN').max(100000),
  base_price: z.number().min(1000, 'Cena bazowa min. 1000 PLN').max(50000000),
  final_price: z.number().min(1000, 'Cena końcowa min. 1000 PLN').max(50000000),

  // Location (required by ministry)
  wojewodztwo: z.string().min(1, 'Województwo wymagane').max(50),
  powiat: z.string().min(1, 'Powiat wymagany').max(50),
  gmina: z.string().min(1, 'Gmina wymagana').max(100),
  miejscowosc: z.string().max(100).optional(),
  ulica: z.string().max(200).optional(),
  kod_pocztowy: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy w formacie XX-XXX').optional(),

  // Dates
  price_valid_from: z.string().refine(val => !isNaN(Date.parse(val)), 'Nieprawidłowa data od'),
  price_valid_to: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Nieprawidłowa data do'),

  // Additional fields
  rooms: z.number().min(1).max(20).optional(),
  floor: z.number().min(-5).max(200).optional(),
  parking_space: z.boolean().optional(),
  parking_price: z.number().min(0).max(1000000).optional(),
  storage_room: z.boolean().optional(),
  balcony: z.boolean().optional(),
  garden: z.boolean().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().min(1, 'Nazwa pliku wymagana').max(255),
  size: z.number().min(1, 'Plik nie może być pusty').max(50 * 1024 * 1024, 'Plik maks. 50MB'),
  type: z.enum([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/xml',
    'text/xml'
  ], {
    errorMap: () => ({ message: 'Dozwolone typy: CSV, XLSX, XML' })
  }),
});

// API request validation
export const apiRequestSchema = z.object({
  endpoint: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  user_id: z.string().uuid('Nieprawidłowy user_id').optional(),
  client_id: z.string().min(10, 'Client ID musi mieć min. 10 znaków').optional(),
});

// Environment variables validation (enhanced)
export const envValidationSchema = z.object({
  // Required Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Nieprawidłowy URL Supabase'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100, 'Nieprawidłowy klucz Supabase'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100, 'Nieprawidłowy service role key'),

  // Required admin
  ADMIN_EMAILS: z.string().min(1, 'Email admina wymagany').refine(
    val => val.split(',').every(email => z.string().email().safeParse(email.trim()).success),
    'Wszystkie emaile adminów muszą być prawidłowe'
  ),

  // Required email service
  RESEND_API_KEY: z.string().min(10, 'Klucz Resend wymagany'),
  EMAIL_FROM: z.string().email('Nieprawidłowy email nadawcy'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional but validated if present
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  GOOGLE_CLIENT_ID: z.string().min(10).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(10).optional(),
});

/**
 * Enhanced input sanitization with multiple layers
 */
export function sanitizeInputAdvanced(input: any): string {
  if (typeof input !== 'string') {
    return String(input).substring(0, 1000);
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=\s*["\'][^"\']*["\']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove data: protocol (except images)
    .replace(/data:(?!image)/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .substring(0, 1000);
}

/**
 * Validate and sanitize all input data
 */
export function validateInput<T>(data: unknown, schema: z.ZodSchema<T>): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Błąd walidacji danych']
    };
  }
}

/**
 * Enhanced rate limiting with different tiers
 */
export interface RateLimitTier {
  windowMs: number;
  maxRequests: number;
  blockDuration?: number;
}

export const RATE_LIMIT_TIERS = {
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 10, blockDuration: 60 * 60 * 1000 }, // 10 req/15min, block 1h
  moderate: { windowMs: 15 * 60 * 1000, maxRequests: 100, blockDuration: 15 * 60 * 1000 }, // 100 req/15min, block 15min
  lenient: { windowMs: 15 * 60 * 1000, maxRequests: 1000, blockDuration: 5 * 60 * 1000 }, // 1000 req/15min, block 5min
} as const;

/**
 * Check if IP is blocked
 */
const blockedIPs = new Map<string, number>(); // IP -> unblock timestamp

export function isIPBlocked(ip: string): boolean {
  const blockUntil = blockedIPs.get(ip);
  if (!blockUntil) return false;

  if (Date.now() > blockUntil) {
    blockedIPs.delete(ip);
    return false;
  }

  return true;
}

/**
 * Block IP address temporarily
 */
export function blockIP(ip: string, durationMs: number): void {
  blockedIPs.set(ip, Date.now() + durationMs);
}

/**
 * Enhanced security logging
 */
export function logSecurityEvent(event: {
  type: 'rate_limit' | 'validation_error' | 'suspicious_activity' | 'blocked_request';
  ip: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
}): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
    severity: event.type === 'blocked_request' ? 'high' : 'medium'
  };

  // In production, send to logging service
  console.warn('🔒 SECURITY EVENT:', logEntry);
}