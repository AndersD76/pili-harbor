'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Manifest {
  id: string
  name: string
  status: string
  deadline_at: string | null
  created_at: string
  ai_optimization_result: Record<string, unknown> | null
}

export default function ManifestsPage() {
  const router = useRouter()
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState<string | null>(null)
  const [yardId, setYardId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) {
      router.push('/dashboard')
      return
    }
    setYardId(id)

    api.get<Manifest[]>(`/api/v1/yards/${id}/manifests`)
      .then((data) => {
        setManifests(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar manifestos')
        setLoading(false)
      })
  }, [router])

  async function handleOptimize(manifestId: string) {
    if (!yardId) return
    setOptimizing(manifestId)
    try {
      await api.post(`/api/v1/yards/${yardId}/manifests/${manifestId}/optimize`)
    } catch {
      // Error handled by API client
    }
    setOptimizing(null)
  }

  async function handleActivate(manifestId: string) {
    if (!yardId) return
    try {
      await api.post(`/api/v1/yards/${yardId}/manifests/${manifestId}/activate`)
      const data = await api.get<Manifest[]>(`/api/v1/yards/${yardId}/manifests`)
      setManifests(data)
    } catch {
      // Error handled by API client
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando manifestos...</p>
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
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar manifestos</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    draft: { label: 'Rascunho', color: 'text-harbor-muted', bg: 'bg-harbor-muted/10', border: 'border-harbor-muted/20' },
    active: { label: 'Ativo', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
    completed: { label: 'Concluído', color: 'text-harbor-green', bg: 'bg-harbor-green/10', border: 'border-harbor-green/20' },
    cancelled: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Manifestos</h2>
          <p className="text-harbor-muted text-sm mt-0.5">{manifests.length} manifesto{manifests.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {manifests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-harbor-surface border border-harbor-border flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-harbor-text mb-2">Nenhum manifesto</h3>
          <p className="text-harbor-muted text-sm text-center max-w-xs">
            Manifestos organizam lotes de containers para otimização com IA.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {manifests.map((m) => {
            const status = statusConfig[m.status] || statusConfig.draft
            return (
              <div key={m.id} className="p-5 bg-harbor-surface border border-harbor-border rounded-xl hover:border-harbor-border/80 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-harbor-text">{m.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${status.color} ${status.bg} border ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-harbor-muted">
                      {m.deadline_at && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Prazo: {new Date(m.deadline_at).toLocaleString('pt-BR')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Criado: {new Date(m.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {m.ai_optimization_result && m.status === 'draft' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-harbor-green">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Otimização pronta - pode ativar
                      </div>
                    )}
                  </div>
                  {m.status === 'draft' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOptimize(m.id)}
                        disabled={optimizing === m.id}
                        className="px-4 py-2 text-xs font-medium bg-harbor-accent/10 text-harbor-accent border border-harbor-accent/20 rounded-lg hover:bg-harbor-accent/20 disabled:opacity-50 transition-colors"
                      >
                        {optimizing === m.id ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-harbor-accent border-t-transparent rounded-full animate-spin" />
                            Otimizando...
                          </span>
                        ) : 'Otimizar com IA'}
                      </button>
                      {m.ai_optimization_result && (
                        <button
                          onClick={() => handleActivate(m.id)}
                          className="px-4 py-2 text-xs font-medium bg-harbor-green text-harbor-bg rounded-lg hover:bg-green-500 transition-colors"
                        >
                          Ativar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
