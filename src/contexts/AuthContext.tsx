import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { googleLogout } from '@react-oauth/google'

interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const TOKEN_KEY = 'google_access_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  )

  const setToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
    setAccessToken(token)
  }

  const logout = () => {
    googleLogout()
    localStorage.removeItem(TOKEN_KEY)
    setAccessToken(null)
  }

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated: !!accessToken, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
