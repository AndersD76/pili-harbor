'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, api } from '@/lib/api'
import Cookies from 'js-cookie'
import Link from 'next/link'
import { Suspense } from 'react'

const isEaze = process.env.NEXT_PUBLIC_APP_MODE === 'eaze'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register')
  }, [searchParams])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(email, password)
      if (isEaze || data.user.role === 'operator') {
        router.push('/operator/nav')
      } else {
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.post<{
        access_token: string
        refresh_token: string
        user: { id: string; full_name: string; role: string; tenant_id: string }
      }>('/api/v1/auth/register', {
        full_name: fullName,
        company_name: companyName,
        email,
        password,
      })
      Cookies.set('access_token', data.access_token, { expires: 1 })
      Cookies.set('refresh_token', data.refresh_token, { expires: 30 })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  // --- EAZE mode: operator tablet login ---
  if (isEaze) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0e14] to-[#0d1520]">
        <div className="w-full max-w-sm p-8">
          <div className="text-center mb-10">
            <div className="mb-4">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
                <rect x="16" y="28" width="24" height="18" rx="2" stroke="#ef4444" strokeWidth="2" fill="none" />
                <rect x="20" y="32" width="6" height="6" rx="1" fill="#ef4444" opacity="0.4" />
                <rect x="30" y="32" width="6" height="6" rx="1" fill="#ef4444" opacity="0.4" />
                <line x1="28" y1="10" x2="28" y2="28" stroke="#ef4444" strokeWidth="2" />
                <line x1="22" y1="14" x2="28" y2="10" stroke="#ef4444" strokeWidth="2" />
                <line x1="34" y1="14" x2="28" y2="10" stroke="#ef4444" strokeWidth="2" />
                <line x1="22" y1="14" x2="22" y2="24" stroke="#ef4444" strokeWidth="2" />
                <line x1="34" y1="14" x2="34" y2="24" stroke="#ef4444" strokeWidth="2" />
                <circle cx="20" cy="48" r="3" stroke="#ef4444" strokeWidth="2" fill="none" />
                <circle cx="36" cy="48" r="3" stroke="#ef4444" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-harbor-accent tracking-[0.4em]">E A Z E</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="w-8 h-px bg-harbor-muted/40" />
              <p className="text-harbor-muted text-xs tracking-[0.3em] uppercase">P I L I &nbsp; H A R B O R</p>
              <span className="w-8 h-px bg-harbor-muted/40" />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-harbor-muted mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-harbor-surface/80 border border-harbor-border/60 rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="operador@empresa.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-harbor-muted mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-harbor-surface/80 border border-harbor-border/60 rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-harbor-accent text-white font-bold text-lg rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- PAINEL mode: management dashboard login ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-harbor-bg">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-harbor-accent tracking-wider hover:opacity-80 transition-opacity">PILI HARBOR</h1>
          </Link>
          <p className="text-harbor-muted mt-2 text-sm">
            {mode === 'login' ? 'Control Center' : 'Crie sua conta grátis'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded text-sm mb-6">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-harbor-muted mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-harbor-muted mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-harbor-accent text-white font-semibold rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-harbor-muted mb-1">Seu nome</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="João Silva"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-harbor-muted mb-1">Nome da empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="Minha Empresa Ltda"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-harbor-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-harbor-muted mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-harbor-surface border border-harbor-border rounded text-harbor-text focus:border-harbor-accent focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00e07a] text-harbor-bg font-semibold rounded hover:bg-green-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
            <p className="text-center text-xs text-harbor-muted">
              Plano básico gratuito por 14 dias. Sem cartão de crédito.
            </p>
          </form>
        )}

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-harbor-muted text-sm">
              Não tem conta?{' '}
              <button onClick={() => { setMode('register'); setError('') }} className="text-[#00e07a] hover:underline font-semibold">
                Acesse grátis
              </button>
            </p>
          ) : (
            <p className="text-harbor-muted text-sm">
              Já tem conta?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-harbor-accent hover:underline font-semibold">
                Fazer login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
