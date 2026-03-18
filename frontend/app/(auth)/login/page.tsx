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

  // --- PAINEL mode: premium login matching landing page ---
  const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-red-500/50 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1920&q=80)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#05080a]/95 via-[#05080a]/85 to-[#05080a]/95" />
      <div className="absolute inset-0 bg-[#05080a]/60" />

      {/* Floating nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#05080a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-sm">P</div>
            <span className="text-lg font-bold tracking-wider">PILI HARBOR</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            Voltar ao site
          </Link>
        </div>
      </nav>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-2xl bg-white/[0.03] rounded-3xl border border-white/10 p-10 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-xl mx-auto mb-5 shadow-lg shadow-red-500/25">
              P
            </div>
            <h1 className="text-2xl font-black tracking-wider">
              {mode === 'login' ? 'PILI HARBOR' : 'Crie sua conta'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {mode === 'login' ? 'Control Center' : 'Comece a rastrear seu patio agora'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 disabled:opacity-50 disabled:hover:shadow-red-500/25 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Seu nome</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="João Silva"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Nome da empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                  placeholder="Minha Empresa Ltda"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Minimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Criando conta...
                  </span>
                ) : 'Criar conta grátis'}
              </button>
              <p className="text-center text-xs text-gray-600 mt-2">
                14 dias grátis. Sem cartão de crédito.
              </p>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            {mode === 'login' ? (
              <p className="text-gray-500 text-sm">
                Não tem conta?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Comece grátis
                </button>
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Já tem conta?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-xs text-gray-700 mt-6">
          piliharbor.io
        </p>
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
