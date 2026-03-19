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

interface ContainerOption { id: string; code: string }

export default function ManifestsPage() {
  const router = useRouter()
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optimizing, setOptimizing] = useState<string | null>(null)
  const [yardId, setYardId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [containers, setContainers] = useState<ContainerOption[]>([])
  const [mForm, setMForm] = useState({ name: '', deadline_at: '', selectedContainers: [] as string[] })

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadManifests(id)
  }, [router])

  function loadManifests(id: string) {
    api.get<Manifest[]>(`/api/v1/yards/${id}/manifests`)
      .then((data) => { setManifests(data); setLoading(false) })
      .catch((err) => {
        if (err.message?.includes('não encontrado')) {
          localStorage.removeItem('current_yard_id')
          localStorage.removeItem('current_yard_name')
          router.push('/dashboard')
          return
        }
        setError(err.message || 'Erro ao carregar manifestos'); setLoading(false)
      })
  }

  async function openCreateModal() {
    if (!yardId) return
    setShowCreate(true)
    try {
      const c = await api.get<ContainerOption[]>(`/api/v1/yards/${yardId}/containers`)
      setContainers(c)
    } catch { /* ignore */ }
  }

  async function handleCreateManifest(e: React.FormEvent) {
    e.preventDefault()
    if (!yardId) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.post(`/api/v1/yards/${yardId}/manifests`, {
        name: mForm.name,
        deadline_at: mForm.deadline_at || null,
        containers_data: { container_ids: mForm.selectedContainers },
      })
      setShowCreate(false)
      setMForm({ name: '', deadline_at: '', selectedContainers: [] })
      loadManifests(yardId)
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar manifesto')
    } finally {
      setCreating(false)
    }
  }

  function toggleContainer(id: string) {
    setMForm((prev) => ({
      ...prev,
      selectedContainers: prev.selectedContainers.includes(id)
        ? prev.selectedContainers.filter((c) => c !== id)
        : [...prev.selectedContainers, id],
    }))
  }

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

  const inputClass = "w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">Novo Manifesto</h3>
              <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateManifest} className="p-6 space-y-4 overflow-y-auto">
              {createError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{createError}</div>}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Nome do Manifesto *</label>
                <input type="text" value={mForm.name} onChange={(e) => setMForm({ ...mForm, name: e.target.value })}
                  className={inputClass} placeholder="Ex: Lote Exportação Março" required />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Prazo (opcional)</label>
                <input type="datetime-local" value={mForm.deadline_at} onChange={(e) => setMForm({ ...mForm, deadline_at: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">
                  Containers ({mForm.selectedContainers.length} selecionado{mForm.selectedContainers.length !== 1 ? 's' : ''})
                </label>
                <div className="max-h-48 overflow-y-auto border border-harbor-border rounded-lg divide-y divide-harbor-border">
                  {containers.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-harbor-muted">Nenhum container no pátio</div>
                  ) : containers.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-harbor-bg cursor-pointer transition-colors">
                      <input type="checkbox" checked={mForm.selectedContainers.includes(c.id)} onChange={() => toggleContainer(c.id)}
                        className="rounded border-harbor-border" />
                      <span className="font-mono text-sm text-harbor-text">{c.code}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {creating ? 'Criando...' : 'Criar Manifesto'}
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
          <h2 className="text-xl font-bold text-harbor-text">Manifestos</h2>
          <p className="text-harbor-muted text-sm mt-0.5">{manifests.length} manifesto{manifests.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Manifesto
        </button>
      </div>

      {manifests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-harbor-surface border border-harbor-border flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-harbor-text mb-2">Nenhum manifesto</h3>
          <p className="text-harbor-muted text-sm text-center max-w-xs mb-6">
            Manifestos organizam lotes de containers para otimização com IA.
          </p>
          <button onClick={openCreateModal} className="px-5 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Criar Manifesto
          </button>
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
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-harbor-green">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          IA concluiu a análise - sequência pronta
                        </div>
                        {(m.ai_optimization_result as any).optimization_notes && (
                          <p className="text-xs text-harbor-muted bg-harbor-bg p-3 rounded-lg border border-harbor-border">
                            {(m.ai_optimization_result as any).optimization_notes}
                          </p>
                        )}
                        <div className="flex gap-4 text-[11px] text-harbor-muted">
                          {(m.ai_optimization_result as any).total_movements && (
                            <span>{(m.ai_optimization_result as any).total_movements} movimentações</span>
                          )}
                          {(m.ai_optimization_result as any).rearrangements_needed > 0 && (
                            <span className="text-amber-400">
                              {(m.ai_optimization_result as any).rearrangements_needed} remanejamentos (desempilhar)
                            </span>
                          )}
                        </div>
                        {(m.ai_optimization_result as any).task_assignments && (
                          <div className="max-h-40 overflow-y-auto border border-harbor-border rounded-lg divide-y divide-harbor-border">
                            {((m.ai_optimization_result as any).task_assignments as any[]).map((t: any, i: number) => (
                              <div key={i} className="px-3 py-2 text-xs flex items-center gap-3">
                                <span className="font-mono text-harbor-muted w-6 text-right">{t.sequence || i + 1}.</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  t.type === 'rearrange' ? 'bg-amber-400/10 text-amber-400' : 'bg-blue-400/10 text-blue-400'
                                }`}>
                                  {t.type === 'rearrange' ? 'DESEMPILHAR' : t.type?.toUpperCase() || 'RELOCAR'}
                                </span>
                                <span className="text-harbor-text font-mono">{t.container_id?.slice(0, 8)}</span>
                                {t.destination_label && (
                                  <span className="text-harbor-muted">→ {t.destination_label}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
    </>
  )
}
