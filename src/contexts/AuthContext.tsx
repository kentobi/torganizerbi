import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { googleLogout } from '@react-oauth/google'

interface AuthState {
  accessToken: string | null
  userEmail: string | null
  isAuthenticated: boolean
  setToken: (token: string) => void
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

  const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    setAccessToken(token)
  }

  const logout = () => {
    googleLogout()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EMAIL_KEY)
    setAccessToken(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ accessToken, userEmail, isAuthenticated: !!accessToken, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
