'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Container {
  id: string
  code: string
  iso_type: string | null
  cargo_type: string
  cargo_description: string | null
  imo_class: string | null
  ncm_code: string | null
  is_reefer: boolean
  reefer_temp_celsius: number | null
  description: string | null
  weight_kg: number | null
  status: string
  x_meters: number | null
  y_meters: number | null
  stack_level: number
  block_label: string | null
  row: number | null
  col: number | null
  max_stack: number
  position_confidence: number | null
  last_seen_at: string | null
  created_at: string
}

const cargoConfig: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: 'Geral', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  reefer: { label: 'Reefer', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  imo: { label: 'IMO', color: 'text-red-400', bg: 'bg-red-400/10' },
  bulk: { label: 'Granel', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  empty: { label: 'Vazio', color: 'text-gray-500', bg: 'bg-gray-500/10' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  stored: { label: 'Armazenado', color: 'text-harbor-green', bg: 'bg-harbor-green/10', border: 'border-harbor-green/20', dot: 'bg-harbor-green' },
  in_transit: { label: 'Em Trânsito', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', dot: 'bg-amber-400' },
  missing: { label: 'Sem Sinal', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', dot: 'bg-red-400' },
}

export default function ContainersPage() {
  const router = useRouter()
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', cargo_type: 'general', cargo_description: '', iso_type: '', imo_class: '', ncm_code: '', is_reefer: false, reefer_temp_celsius: '', description: '', weight_kg: '', x_meters: '', y_meters: '', block_label: '', row: '', col: '', stack_level: '0' })
  const [search, setSearch] = useState('')
  const [yardId, setYardId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadContainers(id)
  }, [router])

  function loadContainers(id: string) {
    api.get<Container[]>(`/api/v1/yards/${id}/containers`)
      .then((data) => { setContainers(data); setLoading(false) })
      .catch((err) => { setError(err.message || 'Erro ao carregar containers'); setLoading(false) })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!yardId) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.post(`/api/v1/yards/${yardId}/containers`, {
        code: form.code,
        cargo_type: form.cargo_type,
        cargo_description: form.cargo_description || null,
        iso_type: form.iso_type || null,
        imo_class: form.imo_class || null,
        ncm_code: form.ncm_code || null,
        is_reefer: form.is_reefer,
        reefer_temp_celsius: form.reefer_temp_celsius ? Number(form.reefer_temp_celsius) : null,
        description: form.description || null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        x_meters: form.x_meters ? Number(form.x_meters) : null,
        y_meters: form.y_meters ? Number(form.y_meters) : null,
        block_label: form.block_label || null,
        row: form.row ? Number(form.row) : null,
        col: form.col ? Number(form.col) : null,
        stack_level: Number(form.stack_level) || 0,
      })
      setShowCreate(false)
      setForm({ code: '', cargo_type: 'general', cargo_description: '', iso_type: '', imo_class: '', ncm_code: '', is_reefer: false, reefer_temp_celsius: '', description: '', weight_kg: '', x_meters: '', y_meters: '', block_label: '', row: '', col: '', stack_level: '0' })
      loadContainers(yardId)
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar container')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(containerId: string, code: string) {
    if (!yardId || !confirm(`Excluir container ${code}?`)) return
    try {
      await api.delete(`/api/v1/yards/${yardId}/containers/${containerId}`)
      loadContainers(yardId)
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir')
    }
  }

  async function handleStatusChange(containerId: string, status: string) {
    if (!yardId) return
    try {
      await api.put(`/api/v1/yards/${yardId}/containers/${containerId}`, { status })
      loadContainers(yardId)
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status')
    }
  }

  const filtered = containers.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando containers...</p>
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
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar containers</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">Tentar novamente</button>
        </div>
      </div>
    )
  }

  const storedCount = containers.filter(c => c.status === 'stored').length
  const transitCount = containers.filter(c => c.status === 'in_transit').length
  const missingCount = containers.filter(c => c.status === 'missing').length

  return (
    <>
      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">Adicionar Container</h3>
              <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{createError}</div>
              )}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Código do Container *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                  placeholder="Ex: CNTR-001" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Tipo de Carga *</label>
                  <select value={form.cargo_type} onChange={(e) => setForm({ ...form, cargo_type: e.target.value, is_reefer: e.target.value === 'reefer' })}
                    className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none">
                    <option value="general">Carga Geral</option>
                    <option value="reefer">Refrigerado (Reefer)</option>
                    <option value="imo">IMO / Perigosa</option>
                    <option value="bulk">Granel</option>
                    <option value="empty">Vazio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Tipo ISO</label>
                  <input type="text" value={form.iso_type} onChange={(e) => setForm({ ...form, iso_type: e.target.value })}
                    className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                    placeholder="Ex: 22G1, 42G1, 45R1" maxLength={10} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Descrição da Carga</label>
                <input type="text" value={form.cargo_description} onChange={(e) => setForm({ ...form, cargo_description: e.target.value })}
                  className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"
                  placeholder="Ex: Peças automotivas" />
              </div>
              {form.cargo_type === 'imo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Classe IMO *</label>
                    <input type="text" value={form.imo_class} onChange={(e) => setForm({ ...form, imo_class: e.target.value })}
                      className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                      placeholder="Ex: 3, 5.1, 8" />
                  </div>
                  <div>
                    <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">NCM</label>
                    <input type="text" value={form.ncm_code} onChange={(e) => setForm({ ...form, ncm_code: e.target.value })}
                      className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                      placeholder="Ex: 2807.00.10" />
                  </div>
                </div>
              )}
              {form.cargo_type === 'reefer' && (
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Temperatura Alvo (°C)</label>
                  <input type="number" value={form.reefer_temp_celsius} onChange={(e) => setForm({ ...form, reefer_temp_celsius: e.target.value })}
                    className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                    placeholder="Ex: -18" step="0.1" />
                </div>
              )}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Peso (kg)</label>
                <input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                  placeholder="Ex: 5000" min={0} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Posição X (metros)</label>
                  <input type="number" value={form.x_meters} onChange={(e) => setForm({ ...form, x_meters: e.target.value })}
                    className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                    placeholder="0" step="0.1" />
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Posição Y (metros)</label>
                  <input type="number" value={form.y_meters} onChange={(e) => setForm({ ...form, y_meters: e.target.value })}
                    className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none"
                    placeholder="0" step="0.1" />
                </div>
              </div>
              <div className="pt-2 border-t border-harbor-border">
                <div className="text-xs text-harbor-muted uppercase tracking-wider mb-3">Posição na Pilha</div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-harbor-muted mb-1">Bloco</label>
                    <input type="text" value={form.block_label} onChange={(e) => setForm({ ...form, block_label: e.target.value })}
                      className="w-full px-3 py-2 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono text-sm focus:border-harbor-accent focus:outline-none"
                      placeholder="A" maxLength={10} />
                  </div>
                  <div>
                    <label className="block text-xs text-harbor-muted mb-1">Fila</label>
                    <input type="number" value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })}
                      className="w-full px-3 py-2 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono text-sm focus:border-harbor-accent focus:outline-none"
                      placeholder="1" min={0} />
                  </div>
                  <div>
                    <label className="block text-xs text-harbor-muted mb-1">Coluna</label>
                    <input type="number" value={form.col} onChange={(e) => setForm({ ...form, col: e.target.value })}
                      className="w-full px-3 py-2 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono text-sm focus:border-harbor-accent focus:outline-none"
                      placeholder="1" min={0} />
                  </div>
                  <div>
                    <label className="block text-xs text-harbor-muted mb-1">Nível</label>
                    <input type="number" value={form.stack_level} onChange={(e) => setForm({ ...form, stack_level: e.target.value })}
                      className="w-full px-3 py-2 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono text-sm focus:border-harbor-accent focus:outline-none"
                      placeholder="0" min={0} max={5} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {creating ? 'Adicionando...' : 'Adicionar Container'}
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
            <h2 className="text-xl font-bold text-harbor-text">Containers</h2>
            <p className="text-harbor-muted text-sm mt-0.5">
              {containers.length} total &middot; {storedCount} armazenado{storedCount !== 1 ? 's' : ''} &middot; {transitCount} em trânsito &middot; {missingCount} sem sinal
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Container
          </button>
        </div>

        {/* Search */}
        {containers.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <svg className="w-4 h-4 text-harbor-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-harbor-surface border border-harbor-border rounded-lg text-harbor-text text-sm focus:border-harbor-accent focus:outline-none"
                placeholder="Buscar por código ou descrição..."
              />
            </div>
          </div>
        )}

        {/* Table */}
        {containers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-harbor-surface border border-harbor-border flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-harbor-text mb-2">Nenhum container</h3>
            <p className="text-harbor-muted text-sm text-center max-w-xs mb-6">
              Adicione containers ao pátio para rastreá-los em tempo real.
            </p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Adicionar Container
            </button>
          </div>
        ) : (
          <div className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-harbor-border">
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Código</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Carga</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Posição</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Pilha</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Peso</th>
                  <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Último Sinal</th>
                  <th className="text-right px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-harbor-border">
                {filtered.map((c) => {
                  const status = statusConfig[c.status] || statusConfig.stored
                  return (
                    <tr key={c.id} className="hover:bg-harbor-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-harbor-text">{c.code}</div>
                        {c.cargo_description && <div className="text-xs text-harbor-muted mt-0.5">{c.cargo_description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {(() => { const cg = cargoConfig[c.cargo_type] || cargoConfig.general; return (
                          <div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${cg.color} ${cg.bg}`}>{cg.label}</span>
                            {c.imo_class && <div className="text-xs text-red-400 mt-0.5">IMO {c.imo_class}</div>}
                            {c.is_reefer && c.reefer_temp_celsius != null && <div className="text-xs text-cyan-400 mt-0.5">{c.reefer_temp_celsius}°C</div>}
                          </div>
                        )})()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg} border ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-harbor-muted">
                        {c.x_meters != null ? `${c.x_meters.toFixed(1)}, ${c.y_meters?.toFixed(1)}` : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-harbor-muted">
                        {c.block_label ? (
                          <span title={`Bloco ${c.block_label}, Fila ${c.row}, Col ${c.col}, Nível ${c.stack_level}`}>
                            {c.block_label}-{c.row}/{c.col} <span className="text-harbor-text">N{c.stack_level}</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-harbor-muted">
                        {c.weight_kg ? `${c.weight_kg.toLocaleString('pt-BR')} kg` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-harbor-muted">
                        {c.last_seen_at ? new Date(c.last_seen_at).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            className="text-xs bg-harbor-bg border border-harbor-border rounded px-1.5 py-1 text-harbor-text focus:outline-none"
                          >
                            <option value="stored">Armazenado</option>
                            <option value="in_transit">Em Trânsito</option>
                            <option value="missing">Sem Sinal</option>
                          </select>
                          <button onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-harbor-muted hover:text-red-400 transition-colors" title="Excluir">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-harbor-muted">Nenhum resultado para &ldquo;{search}&rdquo;</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
