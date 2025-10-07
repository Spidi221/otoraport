/**
 * Comprehensive input validation and sanitization
 * Prevents XSS, SQL injection, and other input-based attacks
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitized?: Record<string, unknown>
}

// Security patterns to detect and block
const SECURITY_PATTERNS = [
  // SQL Injection patterns
  /['";]|--|\/\*|\*\/|\+/i,
  /\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bdrop\b/i,
  
  // XSS patterns
  /<script/gi,
  /<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  
  // Command injection patterns  
  /[|&;$()]/g,
  /`/g,
  
  // Path traversal patterns
  /\.\./g,
  /[\/\\](etc|bin|usr|tmp|var)[\/\\]/gi
]

// Polish characters allowed in names and company names
const POLISH_CHARS = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ'
const SAFE_NAME_PATTERN = new RegExp(`^[a-zA-Z${POLISH_CHARS}\\s\\-\\.]+$`)
const SAFE_COMPANY_PATTERN = new RegExp(`^[a-zA-Z0-9${POLISH_CHARS}\\s\\-\\.\\/&()]+$`)

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/&/g, '&amp;')
}

export function detectMaliciousInput(input: string): boolean {
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.test(input)) {
      return true
    }
  }
  return false
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = []
  
  if (!email || typeof email !== 'string') {
    errors.push('Email jest wymagany')
    return { isValid: false, errors }
  }
  
  const sanitized = sanitizeString(email.toLowerCase())
  
  if (detectMaliciousInput(sanitized)) {
    errors.push('Email zawiera niedozwolone znaki')
    return { isValid: false, errors }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    errors.push('Nieprawidłowy format adresu email')
    return { isValid: false, errors }
  }
  
  if (sanitized.length > 254) {
    errors.push('Email jest za długi (maksymalnie 254 znaki)')
    return { isValid: false, errors }
  }
  
  return { isValid: true, errors: [], sanitized }
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  
  if (!password || typeof password !== 'string') {
    errors.push('Hasło jest wymagane')
    return { isValid: false, errors }
  }
  
  if (password.length < 8) {
    errors.push('Hasło musi mieć co najmniej 8 znaków')
  }
  
  if (password.length > 128) {
    errors.push('Hasło jest za długie (maksymalnie 128 znaków)')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać wielkie litery')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać małe litery')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Hasło musi zawierać cyfry')
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'hasło123']
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Hasło jest zbyt proste. Wybierz silniejsze hasło')
  }
  
  return { isValid: errors.length === 0, errors }
}

export function validateName(name: string): ValidationResult {
  const errors: string[] = []
  
  if (!name || typeof name !== 'string') {
    errors.push('Imię i nazwisko jest wymagane')
    return { isValid: false, errors }
  }
  
  const sanitized = sanitizeString(name)
  
  if (detectMaliciousInput(sanitized)) {
    errors.push('Imię i nazwisko zawiera niedozwolone znaki')
    return { isValid: false, errors }
  }
  
  if (!SAFE_NAME_PATTERN.test(sanitized)) {
    errors.push('Imię i nazwisko może zawierać tylko litery, spacje i myślnik')
    return { isValid: false, errors }
  }
  
  if (sanitized.length < 2) {
    errors.push('Imię i nazwisko jest za krótkie (minimum 2 znaki)')
  }
  
  if (sanitized.length > 100) {
    errors.push('Imię i nazwisko jest za długie (maksymalnie 100 znaków)')
  }
  
  return { isValid: errors.length === 0, errors: [], sanitized }
}

export function validateCompanyName(companyName: string): ValidationResult {
  const errors: string[] = []
  
  if (!companyName || typeof companyName !== 'string') {
    errors.push('Nazwa firmy jest wymagana')
    return { isValid: false, errors }
  }
  
  const sanitized = sanitizeString(companyName)
  
  if (detectMaliciousInput(sanitized)) {
    errors.push('Nazwa firmy zawiera niedozwolone znaki')
    return { isValid: false, errors }
  }
  
  if (!SAFE_COMPANY_PATTERN.test(sanitized)) {
    errors.push('Nazwa firmy zawiera niedozwolone znaki')
    return { isValid: false, errors }
  }
  
  if (sanitized.length < 2) {
    errors.push('Nazwa firmy jest za krótka (minimum 2 znaki)')
  }
  
  if (sanitized.length > 200) {
    errors.push('Nazwa firmy jest za długa (maksymalnie 200 znaków)')
  }
  
  return { isValid: errors.length === 0, errors: [], sanitized }
}

export function validateNIP(nip: string): ValidationResult {
  const errors: string[] = []
  
  if (!nip || typeof nip !== 'string') {
    errors.push('NIP jest wymagany')
    return { isValid: false, errors }
  }
  
  const sanitized = nip.replace(/\D/g, '') // Remove all non-digits
  
  if (sanitized.length !== 10) {
    errors.push('NIP musi zawierać dokładnie 10 cyfr')
    return { isValid: false, errors }
  }
  
  // Basic NIP checksum validation (simplified)
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(sanitized[i]) * weights[i]
  }
  
  const checksum = sum % 11
  const lastDigit = parseInt(sanitized[9])
  
  if (checksum !== lastDigit) {
    errors.push('NIP ma nieprawidłową sumę kontrolną')
    return { isValid: false, errors }
  }
  
  return { isValid: true, errors: [], sanitized }
}

export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = []
  
  if (!phone) {
    // Phone is optional, so empty is OK
    return { isValid: true, errors: [], sanitized: '' }
  }
  
  if (typeof phone !== 'string') {
    errors.push('Numer telefonu musi być tekstem')
    return { isValid: false, errors }
  }
  
  const sanitized = phone.replace(/\D/g, '') // Remove all non-digits
  
  if (sanitized.length < 9 || sanitized.length > 15) {
    errors.push('Numer telefonu musi mieć między 9 a 15 cyfr')
    return { isValid: false, errors }
  }
  
  return { isValid: true, errors: [], sanitized }
}

export function validatePlan(plan: string): ValidationResult {
  const errors: string[] = []
  const validPlans = ['basic', 'pro', 'enterprise']
  
  if (!plan || typeof plan !== 'string') {
    errors.push('Plan jest wymagany')
    return { isValid: false, errors }
  }
  
  if (!validPlans.includes(plan.toLowerCase())) {
    errors.push('Nieprawidłowy plan')
    return { isValid: false, errors }
  }
  
  return { isValid: true, errors: [], sanitized: plan.toLowerCase() }
}

export function validateRegistrationData(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []
  const sanitized: Record<string, unknown> = {}
  
  // Validate email
  const emailResult = validateEmail(data.email)
  if (!emailResult.isValid) {
    errors.push(...emailResult.errors)
  } else {
    sanitized.email = emailResult.sanitized
  }
  
  // Validate password
  const passwordResult = validatePassword(data.password)
  if (!passwordResult.isValid) {
    errors.push(...passwordResult.errors)
  } else {
    sanitized.password = data.password // Don't sanitize password
  }
  
  // Validate name
  const nameResult = validateName(data.name)
  if (!nameResult.isValid) {
    errors.push(...nameResult.errors)
  } else {
    sanitized.name = nameResult.sanitized
  }
  
  // Validate company name
  const companyResult = validateCompanyName(data.company_name)
  if (!companyResult.isValid) {
    errors.push(...companyResult.errors)
  } else {
    sanitized.company_name = companyResult.sanitized
  }
  
  // Validate NIP
  const nipResult = validateNIP(data.nip)
  if (!nipResult.isValid) {
    errors.push(...nipResult.errors)
  } else {
    sanitized.nip = nipResult.sanitized
  }
  
  // Validate phone (optional)
  const phoneResult = validatePhone(data.phone)
  if (!phoneResult.isValid) {
    errors.push(...phoneResult.errors)
  } else {
    sanitized.phone = phoneResult.sanitized
  }
  
  // Validate plan
  const planResult = validatePlan(data.plan)
  if (!planResult.isValid) {
    errors.push(...planResult.errors)
  } else {
    sanitized.plan = planResult.sanitized
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}