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

  useEffect(() => {
    api.get<Yard[]>('/api/v1/yards').then((data) => {
      setYards(data)
      setLoading(false)
      if (data.length === 1) {
        router.push(`/dashboard/yard/${data[0].id}`)
      }
    })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-harbor-muted">Carregando pátios...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-harbor-text mb-6">Selecione um Pátio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {yards.map((yard) => (
          <button
            key={yard.id}
            onClick={() => router.push(`/dashboard/yard/${yard.id}`)}
            className="p-6 bg-harbor-surface border border-harbor-border rounded-lg text-left hover:border-harbor-accent transition-colors"
          >
            <h3 className="text-lg font-semibold text-harbor-text">{yard.name}</h3>
            {yard.description && <p className="text-sm text-harbor-muted mt-1">{yard.description}</p>}
            <div className="mt-4 flex gap-4 text-xs text-harbor-muted font-mono">
              <span>{yard.width_meters}m × {yard.height_meters}m</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
