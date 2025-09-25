/**
 * Simple CAPTCHA implementation for registration form
 * Prevents automated bot signups while keeping UX simple
 */

export interface CaptchaChallenge {
  question: string
  answer: number
  id: string
}

// Simple math captcha questions
const mathQuestions = [
  { question: "Ile to jest 5 + 3?", answer: 8 },
  { question: "Ile to jest 10 - 4?", answer: 6 },
  { question: "Ile to jest 2 × 4?", answer: 8 },
  { question: "Ile to jest 15 ÷ 3?", answer: 5 },
  { question: "Ile to jest 7 + 2?", answer: 9 },
  { question: "Ile to jest 12 - 5?", answer: 7 },
  { question: "Ile to jest 3 × 3?", answer: 9 },
  { question: "Ile to jest 20 ÷ 4?", answer: 5 },
  { question: "Ile to jest 6 + 4?", answer: 10 },
  { question: "Ile to jest 14 - 6?", answer: 8 }
]

// Polish context questions for better bot filtering
const contextQuestions = [
  { question: "W którym kraju znajduje się Warszawa?", answer: "polska" },
  { question: "Ile miesięcy ma rok?", answer: 12 },
  { question: "Która firma produkuje iPhone?", answer: "apple" },
  { question: "Jaki kolor powstaje z mieszania czerwonego i niebieskiego?", answer: "fioletowy" },
  { question: "Ile dni ma tydzień?", answer: 7 }
]

// Store challenges temporarily (in production use Redis)
const challengeStore: Map<string, { answer: string | number, createdAt: number }> = new Map()

export function generateCaptcha(): CaptchaChallenge {
  const useContext = Math.random() > 0.5
  
  let question: string
  let answer: string | number
  
  if (useContext) {
    const contextQ = contextQuestions[Math.floor(Math.random() * contextQuestions.length)]
    question = contextQ.question
    answer = contextQ.answer
  } else {
    const mathQ = mathQuestions[Math.floor(Math.random() * mathQuestions.length)]
    question = mathQ.question
    answer = mathQ.answer
  }
  
  const id = generateChallengeId()
  
  // Store with 10 minute expiry
  challengeStore.set(id, {
    answer: answer,
    createdAt: Date.now()
  })
  
  // Clean expired challenges
  cleanExpiredChallenges()
  
  return {
    id,
    question,
    answer: typeof answer === 'number' ? answer : 0 // Don't leak string answers
  }
}

export function verifyCaptcha(challengeId: string, userAnswer: string): boolean {
  const challenge = challengeStore.get(challengeId)
  
  if (!challenge) {
    return false // Challenge not found or expired
  }
  
  // Check if challenge is expired (10 minutes)
  if (Date.now() - challenge.createdAt > 10 * 60 * 1000) {
    challengeStore.delete(challengeId)
    return false
  }
  
  // Normalize answers for comparison
  const normalizedUserAnswer = userAnswer.toLowerCase().trim()
  const normalizedCorrectAnswer = challenge.answer.toString().toLowerCase().trim()
  
  const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer
  
  // Delete challenge after verification attempt (single use)
  challengeStore.delete(challengeId)
  
  return isCorrect
}

function generateChallengeId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function cleanExpiredChallenges(): void {
  const now = Date.now()
  const expiry = 10 * 60 * 1000 // 10 minutes
  
  for (const [id, challenge] of challengeStore.entries()) {
    if (now - challenge.createdAt > expiry) {
      challengeStore.delete(id)
    }
  }
}

// Rate limiting for captcha generation
const captchaRateLimit = new Map<string, number[]>()

export function checkCaptchaRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 5 * 60 * 1000 // 5 minutes
  const maxAttempts = 10
  
  if (!captchaRateLimit.has(ip)) {
    captchaRateLimit.set(ip, [now])
    return true
  }
  
  const attempts = captchaRateLimit.get(ip)!
  const recentAttempts = attempts.filter(time => now - time < windowMs)
  
  if (recentAttempts.length >= maxAttempts) {
    return false
  }
  
  recentAttempts.push(now)
  captchaRateLimit.set(ip, recentAttempts)
  
  return true
}