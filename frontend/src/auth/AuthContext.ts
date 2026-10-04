import { createContext, useContext } from 'react'
import type { CurrentUser, LoginRequest } from '../api/auth'

export type AuthContextValue = {
  token: string | null
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  bootstrapError: string | null
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  retryBootstrap: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is required.')
  return context
}
