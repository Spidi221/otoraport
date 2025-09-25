'use client'

import { forwardRef, useState } from 'react'
import { getErrorClass, getFieldStatus } from '@/utils/validation'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  showStatus?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    success, 
    hint, 
    required = false, 
    showStatus = true, 
    className = '',
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const status = getFieldStatus(props.value, error || null)
    
    const baseInputClass = 'mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors'
    const inputClass = getErrorClass(!!error, baseInputClass)
    
    const StatusIcon = () => {
      if (!showStatus || status === 'default') return null
      
      if (status === 'error') {
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
      
      if (status === 'success' && props.value) {
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      }
      
      return null
    }
    
    return (
      <div className="relative">
        <label 
          htmlFor={props.id || props.name} 
          className={`block text-sm font-medium transition-colors ${
            error ? 'text-red-700' : focused ? 'text-blue-700' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            className={`${inputClass} ${showStatus && status !== 'default' ? 'pr-10' : ''} ${className}`}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${props.name}-error` : 
              success ? `${props.name}-success` : 
              hint ? `${props.name}-hint` : 
              undefined
            }
            {...props}
          />
          
          {showStatus && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <StatusIcon />
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p id={`${props.name}-error`} className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        
        {/* Success message */}
        {success && !error && (
          <p id={`${props.name}-success`} className="mt-1 text-sm text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </p>
        )}
        
        {/* Hint message */}
        {hint && !error && !success && (
          <p id={`${props.name}-hint`} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'