'use client'

import { useEffect, useState } from 'react'
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

export default function ForkliftsPage() {
  const [forklifts, setForklifts] = useState<Forklift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const yardId = localStorage.getItem('current_yard_id')
    if (yardId) {
      api.get<Forklift[]>(`/api/v1/yards/${yardId}/forklifts`).then((data) => {
        setForklifts(data)
        setLoading(false)
      })
    }
  }, [])

  if (loading) return <div className="p-8 text-harbor-muted">Carregando...</div>

  const statusColors: Record<string, string> = {
    idle: 'text-harbor-green',
    working: 'text-yellow-400',
    offline: 'text-red-400',
    maintenance: 'text-harbor-muted',
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-harbor-text mb-6">Empilhadeiras</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forklifts.map((f) => (
          <div key={f.id} className="p-4 bg-harbor-surface border border-harbor-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono font-bold text-harbor-text">{f.code}</h3>
              <span className={`text-sm font-semibold ${statusColors[f.status] || ''}`}>
                {f.status}
              </span>
            </div>
            <div className="text-xs text-harbor-muted font-mono space-y-1">
              {f.x_meters != null && <p>Posição: {f.x_meters.toFixed(1)}m, {f.y_meters?.toFixed(1)}m</p>}
              {f.heading_degrees != null && <p>Direção: {f.heading_degrees.toFixed(0)}°</p>}
              {f.last_seen_at && <p>Último sinal: {new Date(f.last_seen_at).toLocaleTimeString('pt-BR')}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
