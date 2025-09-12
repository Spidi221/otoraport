/**
 * Security utilities for input validation, sanitization, and rate limiting
 */

import { NextRequest } from 'next/server';

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
  const windowStart = now - windowMs;

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
  const ip = forwarded?.split(',')[0] || realIP || request.ip || 'unknown';
  
  // Include user agent to differentiate clients behind same NAT
  const userAgent = request.headers.get('user-agent') || '';
  const shortUA = userAgent.substring(0, 100); // Prevent DoS via long UA
  
  return `${ip}:${shortUA}`;
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
  
  // Client ID should be UUID format or at least 10 alphanumeric characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9]{10,50}$/;
  
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