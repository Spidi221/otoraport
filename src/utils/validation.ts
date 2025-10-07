/**
 * Validation utilities for forms and inputs
 */

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.trim().length <= max;
}

export function validateNumber(value: any): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}

export function validatePositiveNumber(value: any): boolean {
  return validateNumber(value) && Number(value) > 0;
}

export function validateInteger(value: any): boolean {
  return validateNumber(value) && Number.isInteger(Number(value));
}

export function validateDateString(date: string): boolean {
  const parsed = Date.parse(date);
  return !isNaN(parsed);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validation error messages
 */
export const validationMessages = {
  required: 'To pole jest wymagane',
  email: 'Wprowadź poprawny adres email',
  phone: 'Wprowadź poprawny numer telefonu',
  minLength: (min: number) => `Minimalna długość: ${min} znaków`,
  maxLength: (max: number) => `Maksymalna długość: ${max} znaków`,
  number: 'Wprowadź poprawną liczbę',
  positiveNumber: 'Liczba musi być większa od zera',
  integer: 'Wprowadź liczbę całkowitą',
  date: 'Wprowadź poprawną datę',
  url: 'Wprowadź poprawny adres URL',
};