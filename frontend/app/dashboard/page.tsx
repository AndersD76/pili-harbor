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

  useEffect(() => {
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
  }, [])

  function selectYard(yard: Yard) {
    localStorage.setItem('current_yard_id', yard.id)
    localStorage.setItem('current_yard_name', yard.name)
    router.push(`/dashboard/yard/${yard.id}`)
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (yards.length === 0) {
    return (
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
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-harbor-text">Selecione um Pátio</h2>
        <p className="text-harbor-muted text-sm mt-1">Escolha o pátio que deseja gerenciar</p>
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
  )
}
