import crypto from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString()
  const token = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex')
  
  return `${token}:${timestamp}`
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  try {
    const [providedToken, timestamp] = token.split(':')
    
    // Check if token is not too old (1 hour expiry)
    const tokenAge = Date.now() - parseInt(timestamp)
    if (tokenAge > 60 * 60 * 1000) {
      return false
    }

    const expectedToken = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(expectedToken)
    )
  } catch {
    return false
  }
}

export function getCSRFToken(request: NextRequest): string | null {
  return request.headers.get('x-csrf-token') || null
}

export function requireCSRFToken(request: NextRequest, sessionId: string): boolean {
  const token = getCSRFToken(request)
  if (!token) return false
  
  return validateCSRFToken(token, sessionId)
}