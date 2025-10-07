/**
 * Secure error handling utility to prevent information leakage
 * Provides sanitized error messages for client responses
 */

export interface SecureErrorResponse {
  error: string
  code?: string
  details?: string
}

export class SecurityError extends Error {
  constructor(
    message: string, 
    public code: string = 'SECURITY_ERROR',
    public httpStatus: number = 403
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public httpStatus: number = 400
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Zbyt wiele zapytań. Spróbuj ponownie później.',
    public httpStatus: number = 429
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Safe error messages that don't leak system information
const SAFE_ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Wymagane uwierzytelnienie',
  FORBIDDEN: 'Brak uprawnień do tej operacji',
  SESSION_EXPIRED: 'Sesja wygasła. Zaloguj się ponownie',
  INVALID_CREDENTIALS: 'Nieprawidłowe dane logowania',
  
  // Validation errors
  INVALID_INPUT: 'Nieprawidłowe dane wejściowe',
  MISSING_REQUIRED_FIELD: 'Brak wymaganego pola',
  INVALID_EMAIL: 'Nieprawidłowy format adresu email',
  WEAK_PASSWORD: 'Hasło nie spełnia wymagań bezpieczeństwa',
  INVALID_FILE_TYPE: 'Nieobsługiwany typ pliku',
  FILE_TOO_LARGE: 'Plik jest za duży',
  
  // Rate limiting
  RATE_LIMITED: 'Zbyt wiele zapytań. Spróbuj ponownie później',
  
  // Generic errors
  INTERNAL_ERROR: 'Wystąpił błąd wewnętrzny. Spróbuj ponownie później',
  SERVICE_UNAVAILABLE: 'Usługa tymczasowo niedostępna',
  DATABASE_ERROR: 'Błąd bazy danych. Spróbuj ponownie',
  NETWORK_ERROR: 'Błąd połączenia. Sprawdź połączenie internetowe',
  
  // Business logic errors
  USER_EXISTS: 'Użytkownik z tym adresem email już istnieje',
  COMPANY_EXISTS: 'Firma z tym numerem NIP jest już zarejestrowana',
  SUBSCRIPTION_REQUIRED: 'Wymagana aktywna subskrypcja',
  TRIAL_EXPIRED: 'Okres próbny wygasł',
  PAYMENT_FAILED: 'Płatność nie powiodła się',
  
  // CAPTCHA errors
  CAPTCHA_REQUIRED: 'Wymagana weryfikacja CAPTCHA',
  INVALID_CAPTCHA: 'Nieprawidłowa odpowiedź na pytanie weryfikacyjne',
  CAPTCHA_EXPIRED: 'Kod weryfikacyjny wygasł'
}

export function createSecureError(
  error: Error | string | unknown,
  fallbackMessage: string = SAFE_ERROR_MESSAGES.INTERNAL_ERROR,
  context?: string
): SecureErrorResponse {
  
  // Log the actual error for debugging (server-side only)
  if (typeof error === 'object' && error !== null) {
    console.error(`[${context || 'ERROR'}] ${error}`)
  }

  // Handle known error types
  if (error instanceof SecurityError) {
    return {
      error: error.message,
      code: error.code
    }
  }

  if (error instanceof ValidationError) {
    return {
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: error.field
    }
  }

  if (error instanceof RateLimitError) {
    return {
      error: error.message,
      code: 'RATE_LIMITED'
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    // Check if it's a safe predefined message
    if (Object.values(SAFE_ERROR_MESSAGES).includes(error)) {
      return { error }
    }
    // Otherwise use fallback
    return { error: fallbackMessage }
  }

  // Handle database errors (sanitize to prevent info leakage)
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string }

    switch (dbError.code) {
      case '23505': // Unique constraint violation
        return { 
          error: 'Rekord z takimi danymi już istnieje',
          code: 'DUPLICATE_RECORD'
        }
      case '23503': // Foreign key constraint violation  
        return { 
          error: 'Operacja narusza integralność danych',
          code: 'CONSTRAINT_VIOLATION'
        }
      case '23502': // Not null constraint violation
        return { 
          error: 'Brak wymaganego pola',
          code: 'MISSING_REQUIRED_FIELD'
        }
      default:
        return { 
          error: SAFE_ERROR_MESSAGES.DATABASE_ERROR,
          code: 'DATABASE_ERROR'
        }
    }
  }

  // Handle network/fetch errors
  if (error && typeof error === 'object' && 'name' in error) {
    const netError = error as Error
    if (netError.name === 'TypeError' || netError.name === 'FetchError') {
      return {
        error: SAFE_ERROR_MESSAGES.NETWORK_ERROR,
        code: 'NETWORK_ERROR'
      }
    }
  }

  // Default fallback - never expose internal error details
  return {
    error: fallbackMessage,
    code: 'UNKNOWN_ERROR'
  }
}

// Input validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateNIP(nip: string): boolean {
  const cleanNip = nip.replace(/\D/g, '')
  return cleanNip.length === 10
}

export function validateRequired(value: unknown, fieldName?: string): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new ValidationError(
      fieldName ? `Pole ${fieldName} jest wymagane` : SAFE_ERROR_MESSAGES.MISSING_REQUIRED_FIELD,
      fieldName
    )
  }
}

export function sanitizeErrorForClient(error: unknown): SecureErrorResponse {
  return createSecureError(error)
}

// Rate limiting helper
export function createRateLimitHeaders(rateLimit: {
  limit: number
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.reset.toString(),
    'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString()
  }
}