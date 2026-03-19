'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useYardStore } from '@/lib/store/yard'
import { useTasksStore } from '@/lib/store/tasks'
import dynamic from 'next/dynamic'

const YardCanvas = dynamic(() => import('@/components/yard-map/YardCanvas'), { ssr: false })

let wsClient: any = null
if (typeof window !== 'undefined') {
  import('@/lib/websocket').then((mod) => { wsClient = mod.wsClient }).catch(() => {})
}

interface YardStateResponse {
  yard: {
    id: string
    name: string
    width_meters: number
    height_meters: number
  }
  containers: Array<{
    id: string
    code: string
    x_meters: number | null
    y_meters: number | null
    status: string
    position_confidence: number | null
    weight_kg: number | null
  }>
  forklifts: Array<{
    id: string
    code: string
    x_meters: number | null
    y_meters: number | null
    heading_degrees: number | null
    status: string
    operator_id: string | null
  }>
  tasks: Array<{
    id: string
    container_id: string
    forklift_id: string | null
    type: string
    priority: number
    status: string
    destination_x: number | null
    destination_y: number | null
    destination_label: string | null
    ai_instructions: string | null
    estimated_duration_seconds: number | null
  }>
}

export default function ControlCenter() {
  const params = useParams()
  const yardId = params.yardId as string
  const { setYard, setContainers, setForklifts, updateContainer, updateForklift, selectedContainerId, selectContainer, containers } = useYardStore()
  const { setTasks, updateTask, addAlert, tasks, alerts } = useTasksStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Save yardId to localStorage so other pages can use it
    localStorage.setItem('current_yard_id', yardId)

    api.get<YardStateResponse>(`/api/v1/yards/${yardId}/state`)
      .then((data) => {
        localStorage.setItem('current_yard_name', data.yard.name)
        setYard({
          id: data.yard.id,
          name: data.yard.name,
          width_meters: data.yard.width_meters,
          height_meters: data.yard.height_meters,
        })
        setContainers(
          data.containers.map((c) => ({
            id: c.id,
            code: c.code,
            x: c.x_meters,
            y: c.y_meters,
            status: c.status,
            confidence: c.position_confidence,
            weight_kg: c.weight_kg,
          }))
        )
        setForklifts(
          data.forklifts.map((f) => ({
            id: f.id,
            code: f.code,
            x: f.x_meters,
            y: f.y_meters,
            heading: f.heading_degrees,
            status: f.status,
            operator_id: f.operator_id,
          }))
        )
        setTasks(data.tasks)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar pátio')
        setLoading(false)
      })

    // Connect WebSocket (safe - won't crash if WS_URL not configured)
    try { wsClient?.connect(yardId) } catch {}

    const unsub1 = wsClient?.on('position_update', (msg: any) => {
      if (msg.entity_type === 'container') {
        updateContainer(msg.entity_id, {
          x: msg.data.x,
          y: msg.data.y,
          confidence: msg.data.confidence,
        })
      } else if (msg.entity_type === 'forklift') {
        updateForklift(msg.entity_id, {
          x: msg.data.x,
          y: msg.data.y,
          heading: msg.data.heading,
        })
      }
    })

    const unsub2 = wsClient?.on('task_update', (msg: any) => {
      updateTask(msg.task_id, { status: msg.new_status })
    })

    const unsub3 = wsClient?.on('alert', (msg: any) => {
      addAlert({
        id: Date.now().toString(),
        code: msg.code,
        entity_id: msg.entity_id,
        message: msg.message,
        timestamp: new Date().toISOString(),
      })
    })

    return () => {
      unsub1?.()
      unsub2?.()
      unsub3?.()
      wsClient?.disconnect()
    }
  }, [yardId])

  const selectedContainer = selectedContainerId ? containers.get(selectedContainerId) : null

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const containersArray = Array.from(containers.values())
  const monitoredCount = containersArray.filter((c) => c.status !== 'missing').length
  const forkliftsArray = Array.from(useYardStore.getState().forklifts.values())
  const activeForklifts = forkliftsArray.filter((f) => f.status !== 'offline' && f.status !== 'maintenance').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando centro de controle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar pátio</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar with KPIs */}
      <div className="h-14 border-b border-harbor-border flex items-center px-6 gap-8 bg-harbor-surface">
        <h2 className="text-sm font-semibold text-harbor-text">{useYardStore.getState().yard?.name}</h2>
        <div className="flex gap-6 ml-auto text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-harbor-green" />
            <span className="text-harbor-muted">Containers:</span>{' '}
            <span className="text-harbor-green font-bold">{monitoredCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-harbor-muted">Empilhadeiras:</span>{' '}
            <span className="text-blue-400 font-bold">{activeForklifts}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-harbor-muted">Tarefas ativas:</span>{' '}
            <span className="text-amber-400 font-bold">{activeTasks.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map area - 70% */}
        <div className="flex-[7] bg-harbor-bg">
          <YardCanvas />
        </div>

        {/* Side panel - 30% */}
        <div className="flex-[3] border-l border-harbor-border bg-harbor-surface overflow-y-auto">
          {/* Selected container details */}
          {selectedContainer && (
            <div className="p-4 border-b border-harbor-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-harbor-text">{selectedContainer.code}</h3>
                <button onClick={() => selectContainer(null)} className="text-harbor-muted text-xs hover:text-harbor-text transition-colors p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-harbor-muted space-y-2 font-mono">
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={selectedContainer.status === 'stored' ? 'text-harbor-green' : 'text-amber-400'}>{selectedContainer.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posição</span>
                  <span className="text-harbor-text">{selectedContainer.x?.toFixed(1)}m, {selectedContainer.y?.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Confiança</span>
                  <span className="text-harbor-text">{((selectedContainer.confidence || 0) * 100).toFixed(0)}%</span>
                </div>
                {selectedContainer.weight_kg && (
                  <div className="flex justify-between">
                    <span>Peso</span>
                    <span className="text-harbor-text">{selectedContainer.weight_kg}kg</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active tasks */}
          <div className="p-4 border-b border-harbor-border">
            <h3 className="text-xs font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Tarefas Ativas</h3>
            <div className="space-y-2">
              {activeTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="p-2.5 bg-harbor-bg rounded-lg border border-harbor-border text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-harbor-text font-mono">{task.container_id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      task.status === 'in_progress' ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20' :
                      task.status === 'assigned' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                      'bg-harbor-border text-harbor-muted'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <p className="text-xs text-harbor-muted py-4 text-center">Nenhuma tarefa ativa</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Alertas</h3>
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="p-2.5 bg-red-900/10 border border-red-900/30 rounded-lg text-xs text-red-400">
                  <p className="font-mono text-[10px] text-red-600 mb-1">{alert.code}</p>
                  <p>{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-harbor-muted py-4 text-center">Nenhum alerta</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
