// Comprehensive error handling and user feedback system

export interface AppError {
  code: string
  message: string
  details?: any
  userMessage: string
  statusCode: number
  timestamp: Date
  context?: Record<string, any>
}

export class CenySyncError extends Error {
  public readonly code: string
  public readonly userMessage: string
  public readonly statusCode: number
  public readonly details?: any
  public readonly context?: Record<string, any>

  constructor(code: string, message: string, userMessage: string, statusCode: number = 500, details?: any, context?: Record<string, any>) {
    super(message)
    this.name = 'CenySyncError'
    this.code = code
    this.userMessage = userMessage
    this.statusCode = statusCode
    this.details = details
    this.context = context
  }
}

// Predefined error types with Polish user messages
export const ErrorTypes = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'User not authenticated',
    userMessage: 'Musisz być zalogowany, aby wykonać tę akcję. Proszę zaloguj się ponownie.',
    statusCode: 401
  },
  
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access forbidden',
    userMessage: 'Nie masz uprawnień do wykonania tej akcji.',
    statusCode: 403
  },

  // Subscription & Billing
  SUBSCRIPTION_EXPIRED: {
    code: 'SUBSCRIPTION_EXPIRED',
    message: 'Subscription has expired',
    userMessage: 'Twoja subskrypcja wygasła. Odnów subskrypcję, aby kontynuować korzystanie z platformy.',
    statusCode: 402
  },

  FEATURE_RESTRICTED: {
    code: 'FEATURE_RESTRICTED',
    message: 'Feature not available in current plan',
    userMessage: 'Ta funkcja jest dostępna tylko w wyższych planach. Rozważ upgrade swojego pakietu.',
    statusCode: 403
  },

  USAGE_LIMIT_EXCEEDED: {
    code: 'USAGE_LIMIT_EXCEEDED',
    message: 'Usage limit exceeded for current plan',
    userMessage: 'Osiągnięto limit wykorzystania dla Twojego planu. Upgrade pakiet lub poczekaj do następnego okresu rozliczeniowego.',
    statusCode: 429
  },

  // File Processing
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds maximum allowed',
    userMessage: 'Plik jest za duży. Maksymalny rozmiar to 10MB. Spróbuj z mniejszym plikiem.',
    statusCode: 413
  },

  INVALID_FILE_FORMAT: {
    code: 'INVALID_FILE_FORMAT',
    message: 'File format not supported',
    userMessage: 'Format pliku nie jest obsługiwany. Użyj plików CSV, XML lub Excel.',
    statusCode: 400
  },

  CSV_PARSING_ERROR: {
    code: 'CSV_PARSING_ERROR',
    message: 'Failed to parse CSV file',
    userMessage: 'Nie udało się przetworzyć pliku CSV. Sprawdź format danych i spróbuj ponownie.',
    statusCode: 400
  },

  MISSING_REQUIRED_COLUMNS: {
    code: 'MISSING_REQUIRED_COLUMNS',
    message: 'Required columns not found in file',
    userMessage: 'W pliku brakuje wymaganych kolumn (nr lokalu, powierzchnia, cena). Sprawdź format danych.',
    statusCode: 400
  },

  // Data Validation  
  INVALID_NIP: {
    code: 'INVALID_NIP',
    message: 'Invalid NIP number format',
    userMessage: 'Podany numer NIP jest nieprawidłowy. NIP musi zawierać dokładnie 10 cyfr.',
    statusCode: 400
  },

  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    userMessage: 'Podany adres email ma nieprawidłowy format.',
    statusCode: 400
  },

  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Password does not meet requirements',
    userMessage: 'Hasło jest za słabe. Użyj co najmniej 8 znaków, w tym jedną wielką literę, jedną małą literę i jedną cyfrę.',
    statusCode: 400
  },

  // Database & External Services
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    userMessage: 'Wystąpił błąd bazy danych. Spróbuj ponownie za chwilę.',
    statusCode: 500
  },

  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service unavailable',
    userMessage: 'Zewnętrzna usługa jest niedostępna. Spróbuj ponownie za chwilę.',
    statusCode: 503
  },

  EMAIL_SEND_ERROR: {
    code: 'EMAIL_SEND_ERROR',
    message: 'Failed to send email',
    userMessage: 'Nie udało się wysłać emaila. Sprawdź swój adres email i spróbuj ponownie.',
    statusCode: 500
  },

  // Business Logic
  DUPLICATE_ENTITY: {
    code: 'DUPLICATE_ENTITY',
    message: 'Entity already exists',
    userMessage: 'Wpis o podanych danych już istnieje w systemie.',
    statusCode: 409
  },

  ENTITY_NOT_FOUND: {
    code: 'ENTITY_NOT_FOUND',
    message: 'Entity not found',
    userMessage: 'Nie znaleziono szukanych danych. Możliwe, że zostały usunięte.',
    statusCode: 404
  },

  INVALID_OPERATION: {
    code: 'INVALID_OPERATION',
    message: 'Operation not allowed in current state',
    userMessage: 'Operacja nie jest dozwolona w aktualnym stanie systemu.',
    statusCode: 400
  },

  // Ministry Compliance
  COMPLIANCE_ERROR: {
    code: 'COMPLIANCE_ERROR',
    message: 'Ministry compliance validation failed',
    userMessage: 'Dane nie spełniają wymagań ministerstwa. Sprawdź kompletność i poprawność danych.',
    statusCode: 400
  },

  XML_GENERATION_ERROR: {
    code: 'XML_GENERATION_ERROR',
    message: 'Failed to generate XML report',
    userMessage: 'Nie udało się wygenerować raportu XML. Sprawdź dane i spróbuj ponownie.',
    statusCode: 500
  },

  // Generic
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Input validation failed',
    userMessage: 'Wprowadzone dane są nieprawidłowe. Sprawdź wszystkie pola i spróbuj ponownie.',
    statusCode: 400
  },

  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    userMessage: 'Wystąpił nieoczekiwany błąd serwera. Nasz zespół został powiadomiony. Spróbuj ponownie za chwilę.',
    statusCode: 500
  }
}

/**
 * Create a standardized error response
 */
export function createError(errorType: keyof typeof ErrorTypes, details?: any, context?: Record<string, any>): CenySyncError {
  const type = ErrorTypes[errorType]
  return new CenySyncError(type.code, type.message, type.userMessage, type.statusCode, details, context)
}

/**
 * Log error with proper context
 */
export function logError(error: Error | CenySyncError, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  
  if (error instanceof CenySyncError) {
    console.error(`[${timestamp}] CenySyncError:`, {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      statusCode: error.statusCode,
      details: error.details,
      context: { ...error.context, ...context },
      stack: error.stack
    })
  } else {
    console.error(`[${timestamp}] Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    })
  }
}

/**
 * Convert any error to a user-friendly response
 */
export function errorToResponse(error: Error | CenySyncError, fallbackMessage?: string) {
  if (error instanceof CenySyncError) {
    return {
      success: false,
      error: error.userMessage,
      code: error.code,
      details: error.details
    }
  }

  // Handle known error patterns
  if (error.message.includes('duplicate key')) {
    return {
      success: false,
      error: 'Wpis o podanych danych już istnieje w systemie.',
      code: 'DUPLICATE_ENTITY'
    }
  }

  if (error.message.includes('foreign key')) {
    return {
      success: false,
      error: 'Nie można wykonać operacji - brakuje powiązanych danych.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }
  }

  if (error.message.includes('not found')) {
    return {
      success: false,
      error: 'Nie znaleziono szukanych danych.',
      code: 'ENTITY_NOT_FOUND'
    }
  }

  // Generic fallback
  return {
    success: false,
    error: fallbackMessage || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę.',
    code: 'INTERNAL_ERROR'
  }
}

/**
 * Validation helper functions
 */
export const validators = {
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  nip: (nip: string): boolean => {
    const cleaned = nip.replace(/\D/g, '')
    return cleaned.length === 10
  },

  password: (password: string): { valid: boolean, issues: string[] } => {
    const issues = []
    if (password.length < 8) issues.push('co najmniej 8 znaków')
    if (!/[A-Z]/.test(password)) issues.push('jedną wielką literę')
    if (!/[a-z]/.test(password)) issues.push('jedną małą literę')
    if (!/\d/.test(password)) issues.push('jedną cyfrę')
    
    return {
      valid: issues.length === 0,
      issues
    }
  },

  phone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 9 && cleaned.length <= 15
  }
}

/**
 * Async operation wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ success: true, data: T } | { success: false, error: any }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    logError(error as Error, context)
    return { 
      success: false, 
      error: errorToResponse(error as Error)
    }
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number, lastAttempt: Date }> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isRateLimited(identifier: string): boolean {
    const now = new Date()
    const attempt = this.attempts.get(identifier)
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return false
    }

    // Reset if window has passed
    if (now.getTime() - attempt.lastAttempt.getTime() > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now })
      return false
    }

    // Increment counter
    attempt.count += 1
    attempt.lastAttempt = now

    return attempt.count > this.maxAttempts
  }

  getRemainingTime(identifier: string): number {
    const attempt = this.attempts.get(identifier)
    if (!attempt) return 0
    
    const elapsed = new Date().getTime() - attempt.lastAttempt.getTime()
    return Math.max(0, this.windowMs - elapsed)
  }
}