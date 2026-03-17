'use client'

import { useEffect, useState } from 'react'
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
  const [manifests, setManifests] = useState<Manifest[]>([])
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState<string | null>(null)

  const yardId = typeof window !== 'undefined' ? localStorage.getItem('current_yard_id') : null

  useEffect(() => {
    if (yardId) {
      api.get<Manifest[]>(`/api/v1/yards/${yardId}/manifests`).then((data) => {
        setManifests(data)
        setLoading(false)
      })
    }
  }, [yardId])

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
      // Refresh list
      const data = await api.get<Manifest[]>(`/api/v1/yards/${yardId}/manifests`)
      setManifests(data)
    } catch {
      // Error handled by API client
    }
  }

  if (loading) {
    return <div className="p-8 text-harbor-muted">Carregando manifestos...</div>
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-harbor-border text-harbor-muted',
    active: 'bg-yellow-900/30 text-yellow-400',
    completed: 'bg-green-900/30 text-harbor-green',
    cancelled: 'bg-red-900/30 text-red-400',
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-harbor-text mb-6">Manifestos</h2>
      <div className="space-y-3">
        {manifests.map((m) => (
          <div key={m.id} className="p-4 bg-harbor-surface border border-harbor-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-harbor-text">{m.name}</h3>
                <div className="flex gap-3 mt-1 text-xs text-harbor-muted">
                  {m.deadline_at && (
                    <span>Prazo: {new Date(m.deadline_at).toLocaleString('pt-BR')}</span>
                  )}
                  <span>Criado: {new Date(m.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs ${statusColors[m.status] || ''}`}>
                  {m.status}
                </span>
                {m.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleOptimize(m.id)}
                      disabled={optimizing === m.id}
                      className="px-3 py-1.5 text-xs bg-harbor-accent text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {optimizing === m.id ? 'Otimizando...' : 'Otimizar com IA'}
                    </button>
                    {m.ai_optimization_result && (
                      <button
                        onClick={() => handleActivate(m.id)}
                        className="px-3 py-1.5 text-xs bg-harbor-green text-harbor-bg rounded hover:bg-green-500"
                      >
                        Ativar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {manifests.length === 0 && (
          <p className="text-harbor-muted text-sm">Nenhum manifesto encontrado</p>
        )}
      </div>
    </div>
  )
}
