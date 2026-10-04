const API_BASE_PATH = '/api/v1'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; authenticated?: boolean }

let sessionVersion = 0
let onUnauthorized: (() => void) | undefined

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem('access_token')
  } catch {
    return null
  }
}

export function setAccessToken(token: string | null): void {
  sessionVersion += 1
  if (token !== null) {
    sessionStorage.setItem('access_token', token)
  } else {
    try { sessionStorage.removeItem('access_token') } catch { /* Storage may be unavailable. */ }
  }
}

export function subscribeUnauthorized(handler: () => void): () => void {
  onUnauthorized = handler
  return () => { if (onUnauthorized === handler) onUnauthorized = undefined }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Request failed (${status}).`)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(
  path: string,
  { body, authenticated = true, ...options }: RequestOptions = {},
): Promise<T | undefined> {
  const version = sessionVersion
  const token = authenticated ? getAccessToken() : null
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_PATH}/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  function checkSession() {
    if (version !== sessionVersion) throw new DOMException('Session changed.', 'AbortError')
  }
  checkSession()
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.()
    throw new ApiError(response.status)
  }
  if (response.status === 204) return undefined

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    return undefined
  }

  const text = await response.text()
  checkSession()
  if (!text.trim()) return undefined

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('The server returned an invalid response.')
  }
}
