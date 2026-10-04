import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, login as loginRequest } from '../api/auth'
import type { CurrentUser, LoginRequest } from '../api/auth'
import { ApiError, getAccessToken, setAccessToken, subscribeUnauthorized } from '../api/client'
import { AuthContext } from './AuthContext'

type AuthState = {
  token: string | null
  currentUser: CurrentUser | null
  isLoading: boolean
  bootstrapError: string | null
}

function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const operation = useRef<AbortController | null>(null)
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)
  const [state, setState] = useState<AuthState>(() => {
    const token = getAccessToken()
    return { token, currentUser: null, isLoading: Boolean(token), bootstrapError: null }
  })

  const clearCache = useCallback(() => {
    void queryClient.cancelQueries()
    queryClient.clear()
  }, [queryClient])

  const logout = useCallback(() => {
    operation.current?.abort()
    setAccessToken(null)
    clearCache()
    setState({ token: null, currentUser: null, isLoading: false, bootstrapError: null })
  }, [clearCache])

  useEffect(() => subscribeUnauthorized(logout), [logout])

  useEffect(() => {
    operation.current?.abort()
    const controller = new AbortController()
    operation.current = controller
    const token = getAccessToken()
    if (!token) return () => { operation.current?.abort() }
    void getCurrentUser(controller.signal).then((currentUser) => {
      if (controller.signal.aborted) return
      clearCache()
      setState({ token, currentUser, isLoading: false, bootstrapError: null })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 401) logout()
      else setState({ token, currentUser: null, isLoading: false, bootstrapError: 'Unable to verify your session. Please try again.' })
    })
    return () => { operation.current?.abort() }
  }, [bootstrapAttempt, clearCache, logout])

  async function login(data: LoginRequest): Promise<void> {
    logout()
    const controller = new AbortController()
    operation.current = controller
    try {
      const result = await loginRequest(data, controller.signal)
      if (controller.signal.aborted) throw new Error('Sign in was cancelled.')
      setAccessToken(result.access_token)
      const currentUser = await getCurrentUser(controller.signal)
      if (controller.signal.aborted) throw new Error('Sign in was cancelled.')
      clearCache()
      setState({ token: result.access_token, currentUser, isLoading: false, bootstrapError: null })
    } catch (error) {
      if (!controller.signal.aborted) logout()
      throw error
    }
  }

  function retryBootstrap() {
    if (!getAccessToken()) { logout(); return }
    setState((previous) => ({ ...previous, isLoading: true, bootstrapError: null }))
    setBootstrapAttempt((previous) => previous + 1)
  }

  return (
    <AuthContext.Provider value={{ ...state, isAuthenticated: Boolean(state.currentUser), login, logout, retryBootstrap }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
