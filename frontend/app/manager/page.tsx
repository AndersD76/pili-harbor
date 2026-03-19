'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/websocket'

interface KPIs {
  containers_monitored: number
  containers_missing: number
  forklifts_active: number
  forklifts_offline: number
  tasks_pending: number
  tasks_in_progress: number
  tasks_done_today: number
}

interface Alert {
  id: string
  code: string
  message: string
  timestamp: string
}

interface ManifestProgress {
  name: string
  status: string
  total: number
  done: number
  deadline_at: string | null
}

export default function ManagerPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [manifests, setManifests] = useState<ManifestProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const yardId = localStorage.getItem('current_yard_id')
    if (!yardId) return

    async function loadData() {
      try {
        const state = await api.get<any>(`/api/v1/yards/${yardId}/state`)

        const containers = state.containers || []
        const forklifts = state.forklifts || []
        const tasks = state.tasks || []

        setKpis({
          containers_monitored: containers.filter((c: any) => c.status !== 'missing').length,
          containers_missing: containers.filter((c: any) => c.status === 'missing').length,
          forklifts_active: forklifts.filter((f: any) => f.status !== 'offline' && f.status !== 'maintenance').length,
          forklifts_offline: forklifts.filter((f: any) => f.status === 'offline').length,
          tasks_pending: tasks.filter((t: any) => t.status === 'pending').length,
          tasks_in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
          tasks_done_today: tasks.filter((t: any) => t.status === 'done').length,
        })

        // Load manifests
        const manifestsData = await api.get<any[]>(`/api/v1/yards/${yardId}/manifests`)
        const activeManifests = manifestsData.filter((m) => m.status === 'active')
        const manifestProgress: ManifestProgress[] = []
        for (const m of activeManifests.slice(0, 3)) {
          const detail = await api.get<any>(`/api/v1/yards/${yardId}/manifests/${m.id}`)
          manifestProgress.push({
            name: m.name,
            status: m.status,
            total: detail.progress?.total || 0,
            done: detail.progress?.done || 0,
            deadline_at: m.deadline_at,
          })
        }
        setManifests(manifestProgress)
      } catch (err) {
        console.error('Error loading data:', err)
      }
      setLoading(false)
    }

    loadData()

    // WebSocket for alerts
    wsClient.connect(yardId)
    const unsub = wsClient.on('alert', (msg: any) => {
      setAlerts((prev) => [
        { id: Date.now().toString(), code: msg.code, message: msg.message, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 20))
    })

    return () => {
      unsub()
      wsClient.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <p className="text-harbor-muted text-lg">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-harbor-bg p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-harbor-accent tracking-wider">PILI HARBOR</h1>
        <p className="text-xs text-harbor-muted mt-1">Painel do Gestor</p>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <KPICard label="Containers" value={kpis.containers_monitored} color="text-harbor-green" />
          <KPICard label="Sem sinal" value={kpis.containers_missing} color="text-red-400" />
          <KPICard label="Empilhadeiras" value={kpis.forklifts_active} color="text-harbor-green" />
          <KPICard label="Offline" value={kpis.forklifts_offline} color="text-red-400" />
          <KPICard label="Pendentes" value={kpis.tasks_pending} color="text-yellow-400" />
          <KPICard label="Em andamento" value={kpis.tasks_in_progress} color="text-blue-400" />
        </div>
      )}

      {/* Active Manifests */}
      {manifests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Manifestos Ativos</h2>
          {manifests.map((m, i) => {
            const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0
            return (
              <div key={i} className="p-3 bg-harbor-surface border border-harbor-border rounded-lg mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-harbor-text">{m.name}</span>
                  <span className="text-xs font-mono text-harbor-green">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-harbor-border rounded-full overflow-hidden">
                  <div className="h-full bg-harbor-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-harbor-muted">
                  <span>{m.done}/{m.total} tarefas</span>
                  {m.deadline_at && <span>Prazo: {new Date(m.deadline_at).toLocaleTimeString('pt-BR')}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alerts */}
      <div>
        <h2 className="text-sm font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Alertas</h2>
        {alerts.length === 0 ? (
          <p className="text-xs text-harbor-muted">Nenhum alerta recente</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-red-500">{alert.code}</span>
                  <span className="text-xs text-harbor-muted">{new Date(alert.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <p className="text-sm text-red-400 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 bg-harbor-surface border border-harbor-border rounded-lg text-center">
      <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-harbor-muted mt-1">{label}</div>
    </div>
  )
}
