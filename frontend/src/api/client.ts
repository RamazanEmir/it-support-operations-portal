const API_BASE_PATH = '/api/v1'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

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
  { body, ...options }: RequestOptions = {},
): Promise<T | undefined> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_PATH}/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) throw new ApiError(response.status)
  if (response.status === 204) return undefined

  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    return undefined
  }

  const text = await response.text()
  if (!text.trim()) return undefined

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('The server returned an invalid response.')
  }
}
