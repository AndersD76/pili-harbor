'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/websocket'
import { useYardStore } from '@/lib/store/yard'
import { useTasksStore } from '@/lib/store/tasks'
import YardCanvas from '@/components/yard-map/YardCanvas'

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

  useEffect(() => {
    // Load initial state
    api.get<YardStateResponse>(`/api/v1/yards/${yardId}/state`).then((data) => {
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

    // Connect WebSocket
    wsClient.connect(yardId)

    const unsub1 = wsClient.on('position_update', (msg: any) => {
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

    const unsub2 = wsClient.on('task_update', (msg: any) => {
      updateTask(msg.task_id, { status: msg.new_status })
    })

    const unsub3 = wsClient.on('alert', (msg: any) => {
      addAlert({
        id: Date.now().toString(),
        code: msg.code,
        entity_id: msg.entity_id,
        message: msg.message,
        timestamp: new Date().toISOString(),
      })
    })

    return () => {
      unsub1()
      unsub2()
      unsub3()
      wsClient.disconnect()
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
        <div className="text-harbor-muted">Carregando pátio...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar with KPIs */}
      <div className="h-14 border-b border-harbor-border flex items-center px-6 gap-8 bg-harbor-surface">
        <h2 className="text-sm font-semibold text-harbor-text">{useYardStore.getState().yard?.name}</h2>
        <div className="flex gap-6 ml-auto text-xs font-mono">
          <div>
            <span className="text-harbor-muted">Containers:</span>{' '}
            <span className="text-harbor-green">{monitoredCount}</span>
          </div>
          <div>
            <span className="text-harbor-muted">Empilhadeiras:</span>{' '}
            <span className="text-harbor-green">{activeForklifts}</span>
          </div>
          <div>
            <span className="text-harbor-muted">Tarefas ativas:</span>{' '}
            <span className="text-yellow-400">{activeTasks.length}</span>
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-harbor-text">{selectedContainer.code}</h3>
                <button onClick={() => selectContainer(null)} className="text-harbor-muted text-xs hover:text-harbor-text">✕</button>
              </div>
              <div className="text-xs text-harbor-muted space-y-1 font-mono">
                <p>Status: <span className={selectedContainer.status === 'stored' ? 'text-harbor-green' : 'text-yellow-400'}>{selectedContainer.status}</span></p>
                <p>Posição: {selectedContainer.x?.toFixed(1)}m, {selectedContainer.y?.toFixed(1)}m</p>
                <p>Confiança: {((selectedContainer.confidence || 0) * 100).toFixed(0)}%</p>
                {selectedContainer.weight_kg && <p>Peso: {selectedContainer.weight_kg}kg</p>}
              </div>
            </div>
          )}

          {/* Active tasks */}
          <div className="p-4 border-b border-harbor-border">
            <h3 className="text-xs font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Tarefas Ativas</h3>
            <div className="space-y-2">
              {activeTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="p-2 bg-harbor-bg rounded border border-harbor-border text-xs">
                  <div className="flex justify-between">
                    <span className="text-harbor-text font-mono">{task.container_id.slice(0, 8)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      task.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-400' :
                      task.status === 'assigned' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-harbor-border text-harbor-muted'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <p className="text-xs text-harbor-muted">Nenhuma tarefa ativa</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-harbor-muted mb-3 uppercase tracking-wider">Alertas</h3>
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="p-2 bg-red-900/10 border border-red-900/30 rounded text-xs text-red-400">
                  <p className="font-mono text-[10px] text-red-600 mb-1">{alert.code}</p>
                  <p>{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-harbor-muted">Nenhum alerta</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
