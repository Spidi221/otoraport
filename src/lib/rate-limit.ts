import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
}

export function createRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<{ 
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> => {
    const key = config.keyGenerator ? 
      config.keyGenerator(request) : 
      getClientIP(request)
    
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Clean old entries
    if (rateLimitStore[key] && rateLimitStore[key].resetTime < windowStart) {
      delete rateLimitStore[key]
    }
    
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + config.windowMs
      }
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: rateLimitStore[key].resetTime
      }
    }
    
    if (rateLimitStore[key].count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: rateLimitStore[key].resetTime
      }
    }
    
    rateLimitStore[key].count++
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - rateLimitStore[key].count,
      reset: rateLimitStore[key].resetTime
    }
  }
}

function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

// Predefined rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  maxRequests: 5, // 5 attempts per 15 minutes
  windowMs: 15 * 60 * 1000
})

export const generalAPIRateLimit = createRateLimit({
  maxRequests: 100, // 100 requests per hour
  windowMs: 60 * 60 * 1000
})

export const sensitiveAPIRateLimit = createRateLimit({
  maxRequests: 10, // 10 requests per hour for sensitive operations
  windowMs: 60 * 60 * 1000
})

export const registrationRateLimit = createRateLimit({
  maxRequests: 3, // 3 registration attempts per day per IP
  windowMs: 24 * 60 * 60 * 1000
})