'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Forklift {
  id: string
  code: string
  status: string
  x_meters: number | null
  y_meters: number | null
  heading_degrees: number | null
  operator_id: string | null
  last_seen_at: string | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  idle: { label: 'Disponível', color: 'text-harbor-green', bg: 'bg-harbor-green/10', border: 'border-harbor-green/20', dot: 'bg-harbor-green' },
  working: { label: 'Trabalhando', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', dot: 'bg-amber-400' },
  offline: { label: 'Offline', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', dot: 'bg-red-400' },
  maintenance: { label: 'Manutenção', color: 'text-harbor-muted', bg: 'bg-harbor-muted/10', border: 'border-harbor-muted/20', dot: 'bg-harbor-muted' },
}

export default function ForkliftsPage() {
  const router = useRouter()
  const [forklifts, setForklifts] = useState<Forklift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [yardId, setYardId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadForklifts(id)
  }, [router])

  function loadForklifts(id: string) {
    api.get<Forklift[]>(`/api/v1/yards/${id}/forklifts`)
      .then((data) => { setForklifts(data); setLoading(false) })
      .catch((err) => { setError(err.message || 'Erro ao carregar empilhadeiras'); setLoading(false) })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!yardId) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.post(`/api/v1/yards/${yardId}/forklifts`, { code })
      setShowCreate(false)
      setCode('')
      loadForklifts(yardId)
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao cadastrar empilhadeira')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando empilhadeiras...</p>
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
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar empilhadeiras</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const activeCount = forklifts.filter(f => f.status === 'idle' || f.status === 'working').length
  const offlineCount = forklifts.filter(f => f.status === 'offline').length

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">Nova Empilhadeira</h3>
              <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{createError}</div>}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Código da Empilhadeira *</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                  placeholder="Ex: EMP-01" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {creating ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Empilhadeiras</h2>
          <p className="text-harbor-muted text-sm mt-0.5">
            {forklifts.length} total &middot; {activeCount} ativa{activeCount !== 1 ? 's' : ''} &middot; {offlineCount} offline
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Empilhadeira
        </button>
      </div>

      {forklifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-harbor-surface border border-harbor-border flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-harbor-text mb-2">Nenhuma empilhadeira</h3>
          <p className="text-harbor-muted text-sm text-center max-w-xs mb-6">
            Cadastre empilhadeiras para começar a gerenciar operações no pátio.
          </p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Cadastrar Empilhadeira
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forklifts.map((f) => {
            const status = statusConfig[f.status] || statusConfig.offline
            return (
              <div key={f.id} className="p-5 bg-harbor-surface border border-harbor-border rounded-xl hover:border-harbor-border/80 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-harbor-bg flex items-center justify-center">
                      <svg className="w-5 h-5 text-harbor-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="font-mono font-bold text-harbor-text text-lg">{f.code}</h3>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.color} ${status.bg} border ${status.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${f.status === 'working' ? 'animate-pulse' : ''}`} />
                    {status.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  {f.x_meters != null && (
                    <div className="flex items-center gap-2 text-harbor-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Posição: <span className="text-harbor-text font-mono">{f.x_meters.toFixed(1)}m, {f.y_meters?.toFixed(1)}m</span></span>
                    </div>
                  )}
                  {f.heading_degrees != null && (
                    <div className="flex items-center gap-2 text-harbor-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <span>Direção: <span className="text-harbor-text font-mono">{f.heading_degrees.toFixed(0)}°</span></span>
                    </div>
                  )}
                  {f.operator_id && (
                    <div className="flex items-center gap-2 text-harbor-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Operador atribuído</span>
                    </div>
                  )}
                  {f.last_seen_at && (
                    <div className="flex items-center gap-2 text-harbor-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Último sinal: <span className="text-harbor-text">{new Date(f.last_seen_at).toLocaleTimeString('pt-BR')}</span></span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
