/**
 * Chat Session Management for OTO-RAPORT Chatbot
 * Handles local storage and session persistence
 */

import { ChatMessage } from '@/components/ChatWidget';

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    userAgent?: string;
    location?: string;
    source?: string;
  };
}

const STORAGE_KEY = 'otoraport-chat-session';
const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current chat session from localStorage
 */
export function getCurrentSession(): ChatSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session: ChatSession = JSON.parse(stored);
    
    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt);
    session.updatedAt = new Date(session.updatedAt);
    session.messages = session.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));

    // Check if session is too old
    const now = Date.now();
    if (now - session.updatedAt.getTime() > MAX_SESSION_AGE) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error loading chat session:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Create a new chat session
 */
export function createNewSession(metadata?: ChatSession['metadata']): ChatSession {
  const session: ChatSession = {
    id: generateSessionId(),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata
  };

  saveSession(session);
  return session;
}

/**
 * Save session to localStorage
 */
export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;

  try {
    session.updatedAt = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving chat session:', error);
  }
}

/**
 * Add message to session
 */
export function addMessageToSession(message: ChatMessage): void {
  const session = getCurrentSession();
  if (!session) {
    const newSession = createNewSession();
    newSession.messages = [message];
    saveSession(newSession);
    return;
  }

  session.messages.push(message);
  saveSession(session);
}

/**
 * Clear current session
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  messageCount: number;
  duration: number;
  hasMessages: boolean;
} {
  const session = getCurrentSession();
  
  if (!session) {
    return {
      messageCount: 0,
      duration: 0,
      hasMessages: false
    };
  }

  return {
    messageCount: session.messages.length,
    duration: Date.now() - session.createdAt.getTime(),
    hasMessages: session.messages.length > 0
  };
}

/**
 * Hook for React components to use session management
 */
export function useChatSession() {
  const getSession = () => getCurrentSession();
  
  const saveMessage = (message: ChatMessage) => {
    addMessageToSession(message);
  };

  const clearCurrentSession = () => {
    clearSession();
  };

  const createSession = (metadata?: ChatSession['metadata']) => {
    return createNewSession(metadata);
  };

  return {
    getSession,
    saveMessage,
    clearSession: clearCurrentSession,
    createSession,
    getStats: getSessionStats
  };
}

/**
 * Export session data for analytics
 */
export function exportSessionForAnalytics(session: ChatSession) {
  return {
    sessionId: session.id,
    messageCount: session.messages.length,
    duration: session.updatedAt.getTime() - session.createdAt.getTime(),
    userMessages: session.messages.filter(m => m.type === 'user').length,
    botMessages: session.messages.filter(m => m.type === 'bot').length,
    createdAt: session.createdAt.toISOString(),
    metadata: session.metadata
  };
}