import { supabase } from '@/lib/supabase'

/**
 * Authenticated fetch utility that automatically includes Supabase session token
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Get the current session
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('No valid authentication session')
  }

  // Prepare headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  }

  // Make the request with credentials
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  })
}

/**
 * Helper for form data uploads with authentication
 */
export async function authenticatedFormUpload(url: string, formData: FormData, options: RequestInit = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('No valid authentication session')
  }

  // Don't set Content-Type for FormData - let browser set it with boundary
  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  }

  return fetch(url, {
    method: 'POST',
    ...options,
    headers,
    credentials: 'include',
    body: formData,
  })
}

/**
 * Simple JSON API call with authentication
 */
export async function apiCall<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(url, options)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API call failed: ${response.status} ${errorText}`)
  }

  return response.json()
}