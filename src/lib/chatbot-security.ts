/**
 * Chatbot Security System - Protection against bots and trolls
 * Implements rate limiting, spam detection, and abuse prevention
 */

export interface SecurityCheck {
  allowed: boolean;
  reason?: string;
  suspicionScore: number;
  waitTime?: number; // in seconds
}

export interface SecurityEvent {
  sessionId: string;
  timestamp: number;
  type: 'message' | 'repeated_message' | 'high_frequency' | 'suspicious_pattern';
  content: string;
  suspicionScore: number;
}

// In-memory storage for demo (in production use Redis or database)
const sessionData = new Map<string, {
  messageCount: number;
  lastMessage: string;
  lastMessageTime: number;
  suspiciousMessages: string[];
  firstMessageTime: number;
  blockedUntil?: number;
  events: SecurityEvent[];
}>();

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  MAX_MESSAGES_PER_MINUTE: 10,
  MAX_MESSAGES_PER_HOUR: 60,
  
  // Time windows
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Spam detection
  MAX_REPEATED_MESSAGES: 3,
  MIN_MESSAGE_INTERVAL: 1000, // 1 second
  MAX_MESSAGE_LENGTH: 500,
  
  // Suspicion scoring
  HIGH_SUSPICION_THRESHOLD: 80,
  BLOCK_THRESHOLD: 100,
  
  // Temporary blocks
  TEMP_BLOCK_DURATION: 5 * 60 * 1000, // 5 minutes
  PROGRESSIVE_BLOCK_MULTIPLIER: 2,
};

// Suspicious patterns and spam indicators
const SUSPICIOUS_PATTERNS = [
  /(.)\1{10,}/i, // Repeated characters (aaaaaaa...)
  /[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, // Non-standard characters (except Polish)
  /^\s*(.+?)\s*\1\s*\1/i, // Repeated words/phrases
  /^(.{1,10})\1{3,}/i, // Pattern repetition
  /^\d+$/, // Only numbers
  /^[^aeiouąęióuy\s]{10,}/i, // Too many consonants
  /https?:\/\//i, // URLs (potential spam)
  /\b(viagra|casino|bitcoin|crypto|investment|loan|money)\b/i, // Spam keywords
];

const PROFANITY_PATTERNS = [
  /\b(kurwa|chuj|dupa|pierdol|jebać|skurwysyn)\b/i, // Polish profanity
  /\b(fuck|shit|damn|bitch|asshole)\b/i, // English profanity
];

/**
 * Clean up expired session data
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  sessionData.forEach((data, sessionId) => {
    if (now - data.firstMessageTime > SECURITY_CONFIG.SESSION_TIMEOUT) {
      toDelete.push(sessionId);
    }
  });
  
  toDelete.forEach(sessionId => sessionData.delete(sessionId));
}

/**
 * Get or create session data
 */
function getSessionData(sessionId: string) {
  cleanupExpiredSessions();
  
  if (!sessionData.has(sessionId)) {
    sessionData.set(sessionId, {
      messageCount: 0,
      lastMessage: '',
      lastMessageTime: 0,
      suspiciousMessages: [],
      firstMessageTime: Date.now(),
      events: []
    });
  }
  
  return sessionData.get(sessionId)!;
}

/**
 * Calculate suspicion score based on message content and patterns
 */
function calculateSuspicionScore(message: string, sessionData: any): number {
  let score = 0;
  const content = message.toLowerCase().trim();
  
  // Empty or very short messages
  if (content.length < 3) {
    score += 20;
  }
  
  // Very long messages (potential spam)
  if (content.length > SECURITY_CONFIG.MAX_MESSAGE_LENGTH) {
    score += 30;
  }
  
  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      score += 25;
    }
  });
  
  // Check for profanity
  PROFANITY_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      score += 40; // Higher penalty for profanity
    }
  });
  
  // Repeated message detection
  if (sessionData.lastMessage === content) {
    score += 30;
  }
  
  // High frequency detection
  const now = Date.now();
  if (now - sessionData.lastMessageTime < SECURITY_CONFIG.MIN_MESSAGE_INTERVAL) {
    score += 35;
  }
  
  // Pattern in recent messages
  if (sessionData.suspiciousMessages.includes(content)) {
    score += 20;
  }
  
  // Bot-like behavior indicators
  if (/^[a-z]+$/.test(content) && content.length > 20) { // All lowercase, no spaces
    score += 15;
  }
  
  if (/^\w{1,3}$/.test(content)) { // Very short single words
    score += 10;
  }
  
  // Rapid fire messages
  const recentEvents = sessionData.events.filter((e: SecurityEvent) => 
    now - e.timestamp < 60000 // Last minute
  );
  if (recentEvents.length > 5) {
    score += 25;
  }
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Check rate limiting
 */
function checkRateLimit(sessionData: any): { exceeded: boolean; waitTime?: number } {
  const now = Date.now();
  const oneMinuteAgo = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
  
  // Count messages in the last minute
  const recentMessages = sessionData.events.filter((e: SecurityEvent) => 
    e.timestamp > oneMinuteAgo
  ).length;
  
  if (recentMessages >= SECURITY_CONFIG.MAX_MESSAGES_PER_MINUTE) {
    return {
      exceeded: true,
      waitTime: Math.ceil((sessionData.events[sessionData.events.length - 1]?.timestamp + SECURITY_CONFIG.RATE_LIMIT_WINDOW - now) / 1000)
    };
  }
  
  return { exceeded: false };
}

/**
 * Main security check function
 */
export function performSecurityCheck(message: string, sessionId: string): SecurityCheck {
  const session = getSessionData(sessionId);
  const now = Date.now();
  
  // Check if session is currently blocked
  if (session.blockedUntil && now < session.blockedUntil) {
    return {
      allowed: false,
      reason: 'Temporary block due to suspicious activity',
      suspicionScore: 100,
      waitTime: Math.ceil((session.blockedUntil - now) / 1000)
    };
  }
  
  // Check rate limiting
  const rateCheck = checkRateLimit(session);
  if (rateCheck.exceeded) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded. Please slow down.',
      suspicionScore: 60,
      waitTime: rateCheck.waitTime
    };
  }
  
  // Calculate suspicion score
  const suspicionScore = calculateSuspicionScore(message, session);
  
  // Log security event
  const event: SecurityEvent = {
    sessionId,
    timestamp: now,
    type: 'message',
    content: message,
    suspicionScore
  };
  
  // Add specific event types
  if (session.lastMessage === message.trim()) {
    event.type = 'repeated_message';
  } else if (now - session.lastMessageTime < SECURITY_CONFIG.MIN_MESSAGE_INTERVAL) {
    event.type = 'high_frequency';
  } else if (suspicionScore > 50) {
    event.type = 'suspicious_pattern';
  }
  
  session.events.push(event);
  
  // Keep only recent events (last hour)
  const oneHourAgo = now - (60 * 60 * 1000);
  session.events = session.events.filter(e => e.timestamp > oneHourAgo);
  
  // Update session data
  session.messageCount++;
  session.lastMessage = message.trim();
  session.lastMessageTime = now;
  
  // Track suspicious messages
  if (suspicionScore > 40) {
    session.suspiciousMessages.push(message.trim());
    // Keep only last 10 suspicious messages
    if (session.suspiciousMessages.length > 10) {
      session.suspiciousMessages.shift();
    }
  }
  
  // Decision logic
  if (suspicionScore >= SECURITY_CONFIG.BLOCK_THRESHOLD) {
    // Block the session temporarily
    const blockDuration = SECURITY_CONFIG.TEMP_BLOCK_DURATION * 
      Math.pow(SECURITY_CONFIG.PROGRESSIVE_BLOCK_MULTIPLIER, Math.floor(session.messageCount / 20));
    
    session.blockedUntil = now + blockDuration;
    
    return {
      allowed: false,
      reason: 'Blocked due to suspicious activity',
      suspicionScore,
      waitTime: Math.ceil(blockDuration / 1000)
    };
  }
  
  if (suspicionScore >= SECURITY_CONFIG.HIGH_SUSPICION_THRESHOLD) {
    return {
      allowed: false,
      reason: 'Message flagged as suspicious. Please try a different question.',
      suspicionScore
    };
  }
  
  // Allow the message
  return {
    allowed: true,
    suspicionScore
  };
}

/**
 * Get security statistics for monitoring
 */
export function getSecurityStats() {
  cleanupExpiredSessions();
  
  let totalMessages = 0;
  let blockedSessions = 0;
  let suspiciousMessages = 0;
  let totalSessions = sessionData.size;
  
  sessionData.forEach(session => {
    totalMessages += session.messageCount;
    if (session.blockedUntil && Date.now() < session.blockedUntil) {
      blockedSessions++;
    }
    suspiciousMessages += session.events.filter(e => e.suspicionScore > 50).length;
  });
  
  return {
    totalSessions,
    totalMessages,
    blockedSessions,
    suspiciousMessages,
    activeSessionsLast24h: totalSessions,
    lastCleanup: new Date().toISOString()
  };
}

/**
 * Reset security data for a session (admin function)
 */
export function resetSessionSecurity(sessionId: string): boolean {
  if (sessionData.has(sessionId)) {
    sessionData.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Get human-readable security response for users
 */
export function getSecurityMessage(check: SecurityCheck): string {
  if (!check.allowed) {
    switch (check.reason) {
      case 'Rate limit exceeded. Please slow down.':
        return `🛡️ Proszę zwolnić tempo - możesz pisać maksymalnie ${SECURITY_CONFIG.MAX_MESSAGES_PER_MINUTE} wiadomości na minutę. Spróbuj ponownie za ${check.waitTime} sekund.`;
      
      case 'Temporary block due to suspicious activity':
        return `🚫 Twoja sesja została tymczasowo zablokowana z powodu podejrzanej aktywności. Spróbuj ponownie za ${check.waitTime} sekund.`;
      
      case 'Blocked due to suspicious activity':
        return `❌ Wykryliśmy podejrzaną aktywność. Twoja sesja została zablokowana na ${check.waitTime} sekund. Prosimy o korzystanie z chatbota w sposób właściwy.`;
      
      case 'Message flagged as suspicious. Please try a different question.':
        return `⚠️ Twoja wiadomość została oznaczona jako podejrzana. Spróbuj zadać pytanie w inny sposób lub skontaktuj się z naszym wsparciem.`;
      
      default:
        return '🛡️ Wiadomość została odrzucona przez system bezpieczeństwa.';
    }
  }
  
  return '';
}