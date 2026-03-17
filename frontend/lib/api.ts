import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = Cookies.get('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 401) {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw new Error(error.detail || 'Erro na requisição')
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Auth
export async function login(email: string, password: string) {
  const data = await api.post<{
    access_token: string
    refresh_token: string
    user: { id: string; full_name: string; role: string; tenant_id: string }
  }>('/api/v1/auth/login', { email, password })

  Cookies.set('access_token', data.access_token, { expires: 1 })
  Cookies.set('refresh_token', data.refresh_token, { expires: 30 })
  return data
}

export function logout() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  window.location.href = '/login'
}

export function getToken(): string | undefined {
  return Cookies.get('access_token')
}
