export interface ValidationRule {
  required?: boolean
  email?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean
  message?: string
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export class FormValidator {
  private rules: ValidationRules
  
  constructor(rules: ValidationRules) {
    this.rules = rules
  }
  
  validate(data: Record<string, any>): { isValid: boolean; errors: ValidationErrors } {
    const errors: ValidationErrors = {}
    
    Object.keys(this.rules).forEach(field => {
      const rule = this.rules[field]
      const value = data[field]
      const error = this.validateField(field, value, rule)
      
      if (error) {
        errors[field] = error
      }
    })
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
  
  validateField(field: string, value: any, rule: ValidationRule): string | null {
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rule.message || `Pole ${field} jest wymagane`
    }
    
    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }
    
    // Email validation
    if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return rule.message || 'Nieprawidłowy format email'
    }
    
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message || `Minimalna długość: ${rule.minLength} znaków`
    }
    
    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message || `Maksymalna długość: ${rule.maxLength} znaków`
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || 'Nieprawidłowy format'
    }
    
    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message || 'Nieprawidłowa wartość'
    }
    
    return null
  }
}

// Predefined common validators
export const commonValidators = {
  email: {
    required: true,
    email: true,
    message: 'Podaj prawidłowy adres email'
  },
  
  password: {
    required: true,
    minLength: 8,
    message: 'Hasło musi zawierać minimum 8 znaków'
  },
  
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => value === password,
    message: 'Hasła nie są identyczne'
  }),
  
  nip: {
    required: true,
    pattern: /^\d{10}$/,
    message: 'NIP musi zawierać dokładnie 10 cyfr'
  },
  
  phone: {
    pattern: /^(\+48\s?)?\d{3}\s?\d{3}\s?\d{3}$/,
    message: 'Nieprawidłowy format numeru telefonu (np. +48 123 456 789)'
  },
  
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Imię i nazwisko musi zawierać 2-50 znaków'
  },
  
  companyName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Nazwa firmy musi zawierać 2-100 znaków'
  }
}

// Real-time validation hook
export function useFormValidation(rules: ValidationRules) {
  const validator = new FormValidator(rules)
  
  const validateField = (field: string, value: any): string | null => {
    const rule = rules[field]
    if (!rule) return null
    
    return validator.validateField(field, value, rule)
  }
  
  const validateForm = (data: Record<string, any>) => {
    return validator.validate(data)
  }
  
  return {
    validateField,
    validateForm
  }
}

// Enhanced error display component helpers
export const getErrorClass = (hasError: boolean, baseClass: string = '') => {
  return `${baseClass} ${hasError 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  }`.trim()
}

export const getFieldStatus = (value: any, error: string | null) => {
  if (error) return 'error'
  if (value && value.toString().trim() !== '') return 'success'
  return 'default'
}