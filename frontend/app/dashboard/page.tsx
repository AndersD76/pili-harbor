'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Yard {
  id: string
  name: string
  description: string | null
  width_meters: number
  height_meters: number
  active: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [yards, setYards] = useState<Yard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', width_meters: 100, height_meters: 80 })

  useEffect(() => {
    loadYards()
  }, [])

  function loadYards() {
    setLoading(true)
    api.get<Yard[]>('/api/v1/yards')
      .then((data) => {
        setYards(data)
        setLoading(false)
        if (data.length === 1) {
          selectYard(data[0])
        }
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar pátios')
        setLoading(false)
      })
  }

  function selectYard(yard: Yard) {
    localStorage.setItem('current_yard_id', yard.id)
    localStorage.setItem('current_yard_name', yard.name)
    router.push(`/dashboard/yard/${yard.id}`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const yard = await api.post<Yard>('/api/v1/yards', {
        name: form.name,
        description: form.description || null,
        width_meters: form.width_meters,
        height_meters: form.height_meters,
      })
      setShowCreate(false)
      setForm({ name: '', description: '', width_meters: 100, height_meters: 80 })
      selectYard(yard)
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar pátio')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando pátios...</p>
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
          <button
            onClick={() => { setError(null); loadYards() }}
            className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Create yard modal
  const createModal = showCreate && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-harbor-border">
          <h3 className="text-lg font-bold text-harbor-text">Criar Novo Pátio</h3>
          <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {createError}
            </div>
          )}
          <div>
            <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Nome do Pátio *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none transition-colors"
              placeholder="Ex: Pátio Principal"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none transition-colors"
              placeholder="Ex: Área de armazenamento norte"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Largura (metros) *</label>
              <input
                type="number"
                value={form.width_meters}
                onChange={(e) => setForm({ ...form, width_meters: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none transition-colors"
                min={10}
                max={2000}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Comprimento (metros) *</label>
              <input
                type="number"
                value={form.height_meters}
                onChange={(e) => setForm({ ...form, height_meters: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text font-mono focus:border-harbor-accent focus:outline-none transition-colors"
                min={10}
                max={2000}
                required
              />
            </div>
          </div>
          <div className="bg-harbor-bg rounded-lg p-4 border border-harbor-border">
            <div className="text-xs text-harbor-muted mb-2">Área total</div>
            <div className="text-2xl font-bold font-mono text-harbor-text">
              {(form.width_meters * form.height_meters).toLocaleString('pt-BR')} m²
            </div>
            <div className="text-xs text-harbor-muted mt-1">{form.width_meters}m × {form.height_meters}m</div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </span>
              ) : 'Criar Pátio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (yards.length === 0) {
    return (
      <>
        {createModal}
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-harbor-surface border border-harbor-border flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-harbor-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-harbor-text mb-2">Nenhum pátio cadastrado</h3>
            <p className="text-harbor-muted text-sm mb-6">
              Crie seu primeiro pátio para começar a gerenciar containers e empilhadeiras.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-harbor-accent text-white font-bold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Primeiro Pátio
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {createModal}
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-harbor-text">Selecione um Pátio</h2>
            <p className="text-harbor-muted text-sm mt-1">Escolha o pátio que deseja gerenciar</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pátio
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yards.map((yard) => (
            <button
              key={yard.id}
              onClick={() => selectYard(yard)}
              className="group p-6 bg-harbor-surface border border-harbor-border rounded-xl text-left hover:border-harbor-accent/50 hover:bg-harbor-accent/5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-harbor-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-harbor-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-harbor-muted group-hover:text-harbor-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-harbor-text group-hover:text-harbor-accent transition-colors">{yard.name}</h3>
              {yard.description && <p className="text-sm text-harbor-muted mt-1">{yard.description}</p>}
              <div className="mt-4 flex items-center gap-2 text-xs text-harbor-muted font-mono bg-harbor-bg/50 px-3 py-1.5 rounded-md w-fit">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {yard.width_meters}m × {yard.height_meters}m
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
