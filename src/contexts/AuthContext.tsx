import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AuthState {
  accessToken: string | null
  userEmail: string | null
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const TOKEN_KEY = 'google_access_token'
const EMAIL_KEY = 'google_user_email'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  )
  const [userEmail, setUserEmail] = useState<string | null>(
    localStorage.getItem(EMAIL_KEY)
  )

  // Handle OAuth redirect: extract token from URL hash after Google redirects back
  useEffect(() => {
    if (!window.location.hash.includes('access_token')) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('access_token')
    if (!token) return
    localStorage.setItem(TOKEN_KEY, token)
    setAccessToken(token)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  // Fetch user email when we have a token but no email cached
  useEffect(() => {
    if (!accessToken || userEmail) return
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          localStorage.setItem(EMAIL_KEY, data.email)
          setUserEmail(data.email)
        }
      })
      .catch(() => {})
  }, [accessToken, userEmail])

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setAccessToken(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, isAuthenticated: !!accessToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
