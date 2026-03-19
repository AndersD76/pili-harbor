'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, getToken } from '@/lib/api'
import { wsClient } from '@/lib/websocket'
import { useForkliftStore } from '@/lib/store/forklift'
import NavigationArrow from '@/components/operator/NavigationArrow'
import TaskCard from '@/components/operator/TaskCard'

interface QueueTask {
  id: string
  container_id: string
  type: string
  priority: number
  status: string
  destination_x: number | null
  destination_y: number | null
  destination_label: string | null
  ai_instructions: string | null
}

interface ContainerInfo {
  id: string
  code: string
  x_meters: number | null
  y_meters: number | null
}

export default function OperatorNavPage() {
  const { currentTask, myPosition, setCurrentTask, setQueue, setMyPosition } = useForkliftStore()
  const [containerCode, setContainerCode] = useState<string>('')
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [forkliftId, setForkliftId] = useState<string | null>(null)

  // Calculate distance between two points
  const calcDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }, [])

  // Load forklift queue
  useEffect(() => {
    async function init() {
      try {
        const me = await api.get<{ user: { id: string } }>('/api/v1/auth/me')
        const fId = localStorage.getItem('operator_forklift_id')
        if (!fId) {
          // No forklift selected, go to operator home
          window.location.href = '/operator'
          return
        }
        setForkliftId(fId)

        const queue = await api.get<QueueTask[]>(`/api/v1/forklifts/${fId}/queue`)
        if (queue.length > 0) {
          const active = queue.find((t) => t.status === 'in_progress') || queue[0]
          setCurrentTask({
            id: active.id,
            container_code: '', // Will be loaded
            container_id: active.container_id,
            destination_x: active.destination_x || 0,
            destination_y: active.destination_y || 0,
            destination_label: active.destination_label,
            ai_instructions: active.ai_instructions,
            type: active.type,
            priority: active.priority,
          })
          setQueue(
            queue
              .filter((t) => t.id !== active.id)
              .map((t) => ({
                id: t.id,
                container_code: '',
                container_id: t.container_id,
                destination_x: t.destination_x || 0,
                destination_y: t.destination_y || 0,
                destination_label: t.destination_label,
                ai_instructions: t.ai_instructions,
                type: t.type,
                priority: t.priority,
              }))
          )

          // Load container info
          const yardId = localStorage.getItem('current_yard_id')
          if (yardId) {
            try {
              const containerInfo = await api.get<{ container: ContainerInfo }>(
                `/api/v1/yards/${yardId}/containers/${active.container_id}`
              )
              setContainerCode(containerInfo.container.code)
              if (containerInfo.container.x_meters != null && containerInfo.container.y_meters != null) {
                setTargetPos({ x: containerInfo.container.x_meters, y: containerInfo.container.y_meters })
              }
            } catch {
              // Container might not be accessible
            }
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      }
      setLoading(false)
    }

    init()
  }, [])

  // WebSocket for real-time position updates
  useEffect(() => {
    const yardId = localStorage.getItem('current_yard_id')
    if (!yardId) return

    wsClient.connect(yardId)

    const unsub = wsClient.on('position_update', (msg: any) => {
      if (msg.entity_type === 'forklift' && msg.entity_id === forkliftId) {
        setMyPosition({
          x: msg.data.x,
          y: msg.data.y,
          heading: msg.data.heading || 0,
        })
      }
    })

    return () => {
      unsub()
      wsClient.disconnect()
    }
  }, [forkliftId])

  // Update distance
  useEffect(() => {
    if (myPosition && targetPos) {
      const d = calcDistance(myPosition.x, myPosition.y, targetPos.x, targetPos.y)
      setDistance(Math.round(d * 10) / 10)
    }
  }, [myPosition, targetPos, calcDistance])

  // Calculate bearing to target
  const bearing = myPosition && targetPos
    ? (Math.atan2(targetPos.y - myPosition.y, targetPos.x - myPosition.x) * 180 / Math.PI - (myPosition.heading || 0))
    : 0

  async function handleArrived() {
    if (!currentTask) return
    const yardId = localStorage.getItem('current_yard_id')
    if (!yardId) return

    try {
      await api.put(`/api/v1/yards/${yardId}/tasks/${currentTask.id}/status`, {
        status: 'done',
        notes: 'Operador confirmou chegada',
      })

      // Load next task
      if (forkliftId) {
        const queue = await api.get<QueueTask[]>(`/api/v1/forklifts/${forkliftId}/queue`)
        if (queue.length > 0) {
          const next = queue[0]
          setCurrentTask({
            id: next.id,
            container_code: '',
            container_id: next.container_id,
            destination_x: next.destination_x || 0,
            destination_y: next.destination_y || 0,
            destination_label: next.destination_label,
            ai_instructions: next.ai_instructions,
            type: next.type,
            priority: next.priority,
          })
        } else {
          setCurrentTask(null)
          setTargetPos(null)
          setDistance(null)
        }
      }
    } catch (err) {
      console.error('Error completing task:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <p className="text-harbor-muted text-xl">Carregando...</p>
      </div>
    )
  }

  const { queue } = useForkliftStore()

  function handleChangeForklift() {
    localStorage.removeItem('operator_forklift_id')
    window.location.href = '/operator'
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen bg-harbor-bg flex flex-col items-center justify-center p-8">
        <div className="text-harbor-accent text-3xl font-bold tracking-[0.3em] mb-2">EAZE</div>
        <div className="text-harbor-muted text-xl text-center mt-4 mb-8">
          Fila vazia — aguardando novas tarefas
        </div>
        <button onClick={handleChangeForklift} className="px-6 py-3 text-sm text-harbor-muted border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">
          Trocar Empilhadeira
        </button>
      </div>
    )
  }

  const isClose = distance != null && distance < 3

  return (
    <div className="min-h-screen bg-harbor-bg flex flex-col items-center justify-between p-6 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button onClick={handleChangeForklift} className="p-2 text-harbor-muted hover:text-harbor-text transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-harbor-accent text-lg font-bold tracking-[0.2em]">EAZE</h1>
        <div className="w-10" /> {/* spacer */}
      </div>

      {/* Navigation Arrow */}
      <div className="flex-1 flex items-center justify-center">
        <NavigationArrow angle={bearing} />
      </div>

      {/* Distance */}
      <div className="text-center mb-4">
        <div className="text-6xl font-bold font-mono text-harbor-text">
          {distance != null ? `${distance}m` : '--'}
        </div>
        <div className="text-harbor-muted text-lg mt-2">distância</div>
      </div>

      {/* Container code */}
      <TaskCard
        containerCode={containerCode || currentTask.container_id.slice(0, 8)}
        destinationLabel={currentTask.destination_label}
        instructions={currentTask.ai_instructions}
      />

      {/* Queue info */}
      {queue.length > 0 && (
        <div className="w-full mt-3 px-4 py-2.5 bg-harbor-surface border border-harbor-border rounded-lg text-center">
          <span className="text-xs text-harbor-muted">
            +{queue.length} tarefa{queue.length > 1 ? 's' : ''} na fila
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full mt-4 space-y-3">
        {isClose ? (
          <button
            onClick={handleArrived}
            className="w-full py-5 bg-harbor-green text-harbor-bg text-2xl font-bold rounded-xl active:bg-green-500 transition-colors"
          >
            Cheguei
          </button>
        ) : (
          <button
            onClick={handleArrived}
            className="w-full py-4 bg-harbor-surface border border-harbor-border text-harbor-text text-lg font-semibold rounded-xl active:bg-harbor-bg transition-colors"
          >
            Concluir Tarefa
          </button>
        )}
      </div>
    </div>
  )
}
