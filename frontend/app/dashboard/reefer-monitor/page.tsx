'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface ReeferItem {
  container_id: string
  code: string
  cargo_description: string | null
  set_temp: number | null
  block_label: string | null
  pti_status: string | null
  pti_valid_until: string | null
  alarm: boolean
  latest_reading: {
    actual_temp: number | null
    power_status: string
    recorded_at: string
  } | null
}

export default function ReeferMonitorPage() {
  const router = useRouter()
  const [data, setData] = useState<{ total_reefers: number; alarms: number; items: ReeferItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [yardId, setYardId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadData(id)
    const interval = setInterval(() => loadData(id), 30000)
    return () => clearInterval(interval)
  }, [router])

  function loadData(id: string) {
    api.get<typeof data>(`/api/v1/yards/${id}/reefer-status`)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Monitoramento Reefer</h2>
          <p className="text-harbor-muted text-sm mt-0.5">
            {data.total_reefers} reefer{data.total_reefers !== 1 ? 's' : ''} monitorado{data.total_reefers !== 1 ? 's' : ''}
          </p>
        </div>
        {data.alarms > 0 && (
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-semibold animate-pulse">
            {data.alarms} ALARME{data.alarms > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-harbor-surface border border-harbor-border rounded-xl">
          <div className="text-2xl font-bold text-cyan-400">{data.total_reefers}</div>
          <div className="text-xs text-harbor-muted mt-1">Total Reefers</div>
        </div>
        <div className="p-4 bg-harbor-surface border border-harbor-border rounded-xl">
          <div className="text-2xl font-bold text-harbor-green">{data.total_reefers - data.alarms}</div>
          <div className="text-xs text-harbor-muted mt-1">Normal</div>
        </div>
        <div className={`p-4 bg-harbor-surface border rounded-xl ${data.alarms > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-harbor-border'}`}>
          <div className={`text-2xl font-bold ${data.alarms > 0 ? 'text-red-400' : 'text-harbor-muted'}`}>{data.alarms}</div>
          <div className="text-xs text-harbor-muted mt-1">Em Alarme</div>
        </div>
      </div>

      {/* Reefer list */}
      <div className="space-y-3">
        {data.items.sort((a, b) => (b.alarm ? 1 : 0) - (a.alarm ? 1 : 0)).map(item => (
          <div key={item.container_id} className={`p-4 bg-harbor-surface border rounded-xl ${item.alarm ? 'border-red-500/30 bg-red-500/5' : 'border-harbor-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-harbor-text">{item.code}</span>
                  {item.alarm && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-bold rounded animate-pulse">ALARME</span>
                  )}
                  {item.block_label && (
                    <span className="text-xs text-harbor-muted">Bloco {item.block_label}</span>
                  )}
                </div>
                {item.cargo_description && (
                  <div className="text-xs text-harbor-muted mt-1">{item.cargo_description}</div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-harbor-muted">Set</div>
                    <div className="font-mono text-sm text-cyan-400">{item.set_temp != null ? `${item.set_temp}°C` : '-'}</div>
                  </div>
                  {item.latest_reading && (
                    <>
                      <div>
                        <div className="text-xs text-harbor-muted">Atual</div>
                        <div className={`font-mono text-sm ${item.alarm ? 'text-red-400 font-bold' : 'text-harbor-text'}`}>
                          {item.latest_reading.actual_temp != null ? `${item.latest_reading.actual_temp}°C` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-harbor-muted">Energia</div>
                        <div className={`text-sm font-medium ${item.latest_reading.power_status === 'on' ? 'text-harbor-green' : 'text-red-400'}`}>
                          {item.latest_reading.power_status.toUpperCase()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {item.pti_status && (
                  <div className={`text-xs mt-1 ${item.pti_status === 'passed' ? 'text-harbor-green' : item.pti_status === 'expired' ? 'text-red-400' : 'text-amber-400'}`}>
                    PTI: {item.pti_status} {item.pti_valid_until ? `(até ${new Date(item.pti_valid_until).toLocaleDateString('pt-BR')})` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {data.items.length === 0 && (
          <div className="text-center py-12 text-harbor-muted text-sm">Nenhum container reefer no pátio</div>
        )}
      </div>
    </div>
  )
}
