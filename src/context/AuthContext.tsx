import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ── Types ─────────────────────────────────────────────────────
export interface AuthUser {
  id:         number
  name:       string
  email:      string
  role:       'admin' | 'analyst' | 'field_officer'
  created_at: string
}

interface AuthContextType {
  user:     AuthUser | null
  token:    string | null
  isLoading: boolean
  login:    (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  logout:   () => void
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)   // true while restoring session

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lcews_token')
    const storedUser = localStorage.getItem('lcews_user')
    if (stored && storedUser) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const _persist = (tok: string, usr: AuthUser) => {
    // Write localStorage FIRST — child components read from here on mount,
    // and React state updates may trigger re-renders before the next line runs.
    localStorage.setItem('lcews_token', tok)
    localStorage.setItem('lcews_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    const res = await fetch(`${API_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed')
    }
    const data = await res.json()
    _persist(data.access_token, data.user as AuthUser)
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, role }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Registration failed')
    }
    const data = await res.json()
    _persist(data.access_token, data.user as AuthUser)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('lcews_token')
    localStorage.removeItem('lcews_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ── Authenticated fetch helper ────────────────────────────────
export function useAuthFetch() {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Read fresh token each call — avoids stale closure issues
    const token = localStorage.getItem('lcews_token')

    return fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }
}
