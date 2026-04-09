import {
  Category,
  Quiz,
  User,
  SignUpRequest,
  SignInRequest,
  AuthResponse,
  GenerateQuizRequest,
  Question,
  UserQuizResult,
  SaveQuizResultRequest,
} from './types'

const BASE_URL = "https://alright-bev-lumaai-69a46e17.koyeb.app";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// Mock data
const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Sports', slug: 'sports' },
  { id: 2, name: 'Politics', slug: 'politics' },
  { id: 3, name: 'Technology', slug: 'technology' },
  { id: 4, name: 'World', slug: 'world' },
  { id: 5, name: 'Business', slug: 'business' },
  { id: 6, name: 'Science', slug: 'science' },
  { id: 7, name: 'Entertainment', slug: 'entertainment' },
  { id: 8, name: 'Health', slug: 'health' },
]

const MOCK_QUESTIONS: Question[] = [
  {
    question: 'Who won the IPL 2024 title?',
    options: ['Mumbai Indians', 'Kolkata Knight Riders', 'Chennai Super Kings', 'RCB'],
    answer: 1,
    article_url: 'https://thehindu.com/sport/cricket/ipl-2024',
  },
  {
    question: "What is ISRO's solar observation mission called?",
    options: ['Surya-1', 'Aditya-L1', 'SolarEx', 'Helios-1'],
    answer: 1,
    article_url: 'https://thehindu.com/sci-tech/isro-aditya-l1',
  },
  {
    question: 'Which city hosted the G20 Summit in 2023?',
    options: ['Mumbai', 'New Delhi', 'Bengaluru', 'Chennai'],
    answer: 1,
    article_url: 'https://indianexpress.com/g20-india-summit',
  },
  {
    question: 'Who was appointed Chief Justice of India in late 2024?',
    options: ['D.Y. Chandrachud', 'Sanjiv Khanna', 'B.R. Gavai', 'Abhay Oka'],
    answer: 1,
    article_url: 'https://indianexpress.com/new-chief-justice-india',
  },
  {
    question: "What was India's Republic Day 2024 theme?",
    options: ['Viksit Bharat', 'Digital India', 'Atmanirbhar Bharat', 'Incredible India'],
    answer: 0,
    article_url: 'https://thehindu.com/republic-day-2024',
  },
  {
    question: "Who won the 2024 Wimbledon Men's Singles?",
    options: ['Novak Djokovic', 'Carlos Alcaraz', 'Jannik Sinner', 'Rafael Nadal'],
    answer: 1,
    article_url: 'https://timesofindia.com/sports/tennis/wimbledon-2024',
  },
  {
    question: 'Which Indian athlete won gold at Paris Olympics 2024?',
    options: ['Neeraj Chopra', 'PV Sindhu', 'Mirabai Chanu', 'Bajrang Punia'],
    answer: 0,
    article_url: 'https://indianexpress.com/paris-olympics-india-gold',
  },
  {
    question: 'What is Operation Sindoor?',
    options: [
      'Flood relief in Assam',
      'Military strikes on Pakistan terror camps',
      'A cybersecurity initiative',
      'A highway project',
    ],
    answer: 1,
    article_url: 'https://timesofindia.com/india/operation-sindoor',
  },
  {
    question: "Which company became India's most valued startup in 2024?",
    options: ['Zepto', 'PhonePe', 'Razorpay', "BYJU'S"],
    answer: 1,
    article_url: 'https://timesofindia.com/business/india-startup-valuation',
  },
  {
    question: 'Which country did India sign a Free Trade Agreement with in 2024?',
    options: ['Australia', 'UAE', 'UK', 'Germany'],
    answer: 2,
    article_url: 'https://timesofindia.com/india-uk-fta',
  },
]

const MOCK_QUIZ: Quiz = {
  id: 1,
  title: 'Daily Digest',
  category_ids: [1, 3],
  difficulty: 'medium',
  created_at: new Date().toISOString(),
  questions: MOCK_QUESTIONS,
}

const MOCK_USER: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  provider: 'email',
  provider_id: '',
  avatar_url: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// GET /category/
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${BASE_URL}/category/`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('API failed')
    return res.json()
  } catch (err) {
    console.warn('[Fallback] Using mock categories due to API error:', err)
    await delay(300) // simulate network delay
    return MOCK_CATEGORIES
  }
}

// POST /quiz/generate
export async function generateQuiz(req: GenerateQuizRequest): Promise<Quiz> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    let message = 'Failed to generate quiz'

    try {
      const data = await res.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
        message = (data as any).error
      }
    } catch {
      // Ignore JSON parse errors and fall back to the default message
    }

    throw new Error(message)
  }

  return res.json()
}

// GET /quiz/view/:id
export async function getQuizById(id: string): Promise<Quiz> {
  const res = await fetch(`${BASE_URL}/quiz/view/${id}`)

  if (!res.ok) {
    let message = 'Failed to fetch scheduled quiz'

    try {
      const data = await res.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
        message = (data as any).error
      }
    } catch {
      // Ignore JSON parse errors and fall back to the default message
    }

    throw new Error(message)
  }

  return res.json()
}

// GET /quiz/daily — returns null if no quiz has been generated yet today
export async function getDailyQuiz(): Promise<Quiz | null> {
  const res = await fetch(`${BASE_URL}/quiz/daily`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch daily quiz')
  return res.json()
}


// POST /quiz/results
export async function saveQuizResult(req: SaveQuizResultRequest): Promise<UserQuizResult> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${BASE_URL}/quiz/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error('Failed to save quiz result')
  return res.json()
}

// GET /quiz/results
export async function getQuizHistory(): Promise<UserQuizResult[]> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${BASE_URL}/quiz/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to fetch quiz history')
  return res.json()
}

// POST /auth/signup (start email signup, sends OTP)
export async function signUp(req: SignUpRequest): Promise<{ message: string; email: string; dev_otp?: string }> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    let message = 'Signup failed'

    try {
      const data = await res.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
        message = (data as any).error
      }
    } catch {
      // ignore
    }

    throw new Error(message)
  }
  return res.json()
}

// POST /auth/verify-email (complete email signup with OTP)
export async function verifyEmailSignUp(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  })
  if (!res.ok) {
    let message = 'Verification failed'

    try {
      const data = await res.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
        message = (data as any).error
      }
    } catch {
      // ignore
    }

    throw new Error(message)
  }
  const authRes: AuthResponse = await res.json()
  return authRes
}

// POST /auth/signin
export async function signIn(req: SignInRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    let message = 'Signin failed'

    try {
      const data = await res.json()
      if (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string') {
        message = (data as any).error
      }
    } catch {
      // ignore
    }

    throw new Error(message)
  }
  const authRes: AuthResponse = await res.json()
  return authRes
}

// GET /auth/me
export async function getMe(tokenOverride?: string): Promise<User> {
  const token = tokenOverride ?? getToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

// OAuth
export function loginWithGoogle() {
  window.location.href = `${BASE_URL}/auth/google`
}

export function loginWithGithub() {
  window.location.href = `${BASE_URL}/auth/github`
}

// Token helpers
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('daymark_token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('daymark_token', token)
  // Set as a cookie so Next.js middleware can read it
  document.cookie = `daymark_token=${token}; path=/; max-age=2592000; SameSite=Lax`
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('daymark_token')
  document.cookie = 'daymark_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}
