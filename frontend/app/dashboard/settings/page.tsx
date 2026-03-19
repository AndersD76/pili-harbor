'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface UserInfo {
  user: {
    id: string
    full_name: string
    email: string
    role: string
  }
  tenant: {
    id: string
    name: string
    slug: string
    plan: string
    max_yards: number
    max_containers_per_yard: number
    max_forklifts_per_yard: number
  }
}

interface Yard {
  id: string
  name: string
  description: string | null
  width_meters: number
  height_meters: number
  timezone: string
  active: boolean
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  operator: 'Operador',
}

const planLabels: Record<string, string> = {
  basic: 'Básico',
  pro: 'Profissional',
  enterprise: 'Enterprise',
}

export default function SettingsPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [yards, setYards] = useState<Yard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<UserInfo>('/api/v1/auth/me'),
      api.get<Yard[]>('/api/v1/yards'),
    ])
      .then(([user, yardsList]) => {
        setUserInfo(user)
        setYards(yardsList)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar configurações')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-harbor-text">Configurações</h2>
        <p className="text-harbor-muted text-sm mt-0.5">Gerencie sua conta e empresa</p>
      </div>

      <div className="space-y-6">
        {/* User info */}
        {userInfo && (
          <section className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-harbor-border">
              <h3 className="text-sm font-semibold text-harbor-text flex items-center gap-2">
                <svg className="w-4 h-4 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Minha Conta
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <InfoRow label="Nome" value={userInfo.user.full_name} />
              <InfoRow label="Email" value={userInfo.user.email} />
              <InfoRow label="Perfil" value={roleLabels[userInfo.user.role] || userInfo.user.role} />
            </div>
          </section>
        )}

        {/* Tenant / Company info */}
        {userInfo && (
          <section className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-harbor-border">
              <h3 className="text-sm font-semibold text-harbor-text flex items-center gap-2">
                <svg className="w-4 h-4 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Empresa
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <InfoRow label="Nome" value={userInfo.tenant.name} />
              <InfoRow label="Slug" value={userInfo.tenant.slug} />
              <InfoRow label="Plano" value={planLabels[userInfo.tenant.plan] || userInfo.tenant.plan} />
              <div className="pt-3 border-t border-harbor-border">
                <div className="text-xs text-harbor-muted uppercase tracking-wider mb-3">Limites do Plano</div>
                <div className="grid grid-cols-3 gap-3">
                  <LimitCard label="Pátios" value={yards.length} max={userInfo.tenant.max_yards} />
                  <LimitCard label="Containers/pátio" value="-" max={userInfo.tenant.max_containers_per_yard} />
                  <LimitCard label="Empilhadeiras/pátio" value="-" max={userInfo.tenant.max_forklifts_per_yard} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Yards */}
        <section className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-harbor-border">
            <h3 className="text-sm font-semibold text-harbor-text flex items-center gap-2">
              <svg className="w-4 h-4 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Pátios ({yards.length})
            </h3>
          </div>
          <div className="divide-y divide-harbor-border">
            {yards.map((yard) => (
              <div key={yard.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-harbor-text">{yard.name}</div>
                  <div className="text-xs text-harbor-muted mt-0.5">
                    {yard.width_meters}m × {yard.height_meters}m &middot; {yard.timezone}
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('current_yard_id', yard.id)
                    localStorage.setItem('current_yard_name', yard.name)
                    router.push(`/dashboard/yard/${yard.id}`)
                  }}
                  className="px-3 py-1.5 text-xs text-harbor-accent bg-harbor-accent/10 border border-harbor-accent/20 rounded-lg hover:bg-harbor-accent/20 transition-colors"
                >
                  Abrir
                </button>
              </div>
            ))}
            {yards.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-harbor-muted">
                Nenhum pátio cadastrado
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-harbor-muted">{label}</span>
      <span className="text-sm text-harbor-text font-medium">{value}</span>
    </div>
  )
}

function LimitCard({ label, value, max }: { label: string; value: number | string; max: number }) {
  return (
    <div className="p-3 bg-harbor-bg rounded-lg text-center">
      <div className="text-lg font-bold font-mono text-harbor-text">
        {value}<span className="text-harbor-muted text-xs">/{max}</span>
      </div>
      <div className="text-xs text-harbor-muted mt-1">{label}</div>
    </div>
  )
}
