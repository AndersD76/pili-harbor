'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Container {
  id: string
  code: string
  cargo_type: string
  cargo_description: string | null
  shipping_line: string | null
  bl_number: string | null
  gate_in_at: string | null
  free_time_days: number
  free_time_expires_at: string | null
  demurrage_status: string
  customs_status: string
  block_label: string | null
}

function getDwellInfo(c: Container) {
  if (!c.gate_in_at) return { days: 0, urgency: 'none' as const, overDays: 0 }
  const now = new Date()
  const gateIn = new Date(c.gate_in_at)
  const days = Math.round((now.getTime() - gateIn.getTime()) / 86400000 * 10) / 10
  if (!c.free_time_expires_at) return { days, urgency: 'green' as const, overDays: 0 }
  const expires = new Date(c.free_time_expires_at)
  const overMs = now.getTime() - expires.getTime()
  const overDays = Math.max(0, Math.round(overMs / 86400000 * 10) / 10)
  const pct = days / c.free_time_days
  const urgency = overMs > 0 ? 'red' as const : pct >= 0.8 ? 'yellow' as const : 'green' as const
  return { days, urgency, overDays }
}

const urgencyColors = {
  none: { text: 'text-harbor-muted', bg: 'bg-harbor-muted/10', border: 'border-harbor-muted/20' },
  green: { text: 'text-harbor-green', bg: 'bg-harbor-green/10', border: 'border-harbor-green/20' },
  yellow: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  red: { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
}

const customsBadge: Record<string, { label: string; color: string }> = {
  none: { label: '-', color: 'text-harbor-muted' },
  pending: { label: 'Pendente', color: 'text-amber-400' },
  green: { label: 'Verde', color: 'text-harbor-green' },
  yellow: { label: 'Amarelo', color: 'text-amber-400' },
  red: { label: 'Vermelho', color: 'text-red-400' },
  grey: { label: 'Cinza', color: 'text-purple-400' },
  released: { label: 'Liberado', color: 'text-harbor-green' },
}

export default function DwellTimePage() {
  const router = useRouter()
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    api.get<Container[]>(`/api/v1/yards/${id}/containers`)
      .then(data => {
        // Only containers with gate_in, sorted by urgency
        const withGate = data.filter(c => c.gate_in_at)
        withGate.sort((a, b) => {
          const da = getDwellInfo(a)
          const db = getDwellInfo(b)
          const urgOrder = { red: 0, yellow: 1, green: 2, none: 3 }
          return (urgOrder[da.urgency] - urgOrder[db.urgency]) || (db.days - da.days)
        })
        setContainers(withGate)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const overFreeTime = containers.filter(c => getDwellInfo(c).urgency === 'red').length
  const nearExpiry = containers.filter(c => getDwellInfo(c).urgency === 'yellow').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Permanência (Dwell Time)</h2>
          <p className="text-harbor-muted text-sm mt-0.5">
            {containers.length} container{containers.length !== 1 ? 's' : ''} com gate-in
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-harbor-surface border border-harbor-border rounded-xl">
          <div className="text-2xl font-bold text-harbor-green">{containers.length - overFreeTime - nearExpiry}</div>
          <div className="text-xs text-harbor-muted mt-1">Dentro do Free Time</div>
        </div>
        <div className={`p-4 bg-harbor-surface border rounded-xl ${nearExpiry > 0 ? 'border-amber-400/30' : 'border-harbor-border'}`}>
          <div className={`text-2xl font-bold ${nearExpiry > 0 ? 'text-amber-400' : 'text-harbor-muted'}`}>{nearExpiry}</div>
          <div className="text-xs text-harbor-muted mt-1">Próximo do Vencimento (&gt;80%)</div>
        </div>
        <div className={`p-4 bg-harbor-surface border rounded-xl ${overFreeTime > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-harbor-border'}`}>
          <div className={`text-2xl font-bold ${overFreeTime > 0 ? 'text-red-400' : 'text-harbor-muted'}`}>{overFreeTime}</div>
          <div className="text-xs text-harbor-muted mt-1">Em Demurrage</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-harbor-border">
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Container</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Armador</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Gate-In</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Dias</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Free Time</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Demurrage</th>
              <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Aduana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-harbor-border">
            {containers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-harbor-muted">Nenhum container com gate-in registrado</td></tr>
            ) : containers.map(c => {
              const dw = getDwellInfo(c)
              const urg = urgencyColors[dw.urgency]
              const cust = customsBadge[c.customs_status] || customsBadge.none
              return (
                <tr key={c.id} className="hover:bg-harbor-bg/50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-harbor-text">{c.code}</div>
                    {c.cargo_description && <div className="text-xs text-harbor-muted">{c.cargo_description}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-harbor-muted capitalize">{c.cargo_type}</td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">{c.shipping_line || '-'}</td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">{c.gate_in_at ? new Date(c.gate_in_at).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${urg.text} ${urg.bg}`}>{dw.days}d</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">
                    {c.free_time_expires_at ? new Date(c.free_time_expires_at).toLocaleDateString('pt-BR') : '-'}
                    <span className="text-harbor-muted/60"> ({c.free_time_days}d)</span>
                  </td>
                  <td className="px-4 py-3">
                    {dw.overDays > 0 ? (
                      <span className="text-red-400 text-xs font-bold">{dw.overDays}d over</span>
                    ) : (
                      <span className="text-harbor-muted text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${cust.color}`}>{cust.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
