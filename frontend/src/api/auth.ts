import { request } from './client'
import type { User } from './users'

export type LoginRequest = { email: string; password: string }
export type TokenResponse = { access_token: string; token_type: 'bearer' }
export type CurrentUser = User

export async function login(data: LoginRequest, signal?: AbortSignal): Promise<TokenResponse> {
  const result = await request<TokenResponse>('/auth/login', {
    method: 'POST', body: data, authenticated: false, signal,
  })
  if (!result?.access_token || result.token_type !== 'bearer') {
    throw new Error('The server returned an invalid response.')
  }
  return result
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const result = await request<CurrentUser>('/auth/me', { signal })
  if (!result || !['admin', 'technician', 'employee'].includes(result.role)) {
    throw new Error('The server returned an invalid response.')
  }
  return result
}
