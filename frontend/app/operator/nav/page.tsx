'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
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

export default function OperatorNavPage() {
  const { currentTask, setCurrentTask, setQueue, queue } = useForkliftStore()
  const [loading, setLoading] = useState(true)
  const [forkliftId, setForkliftId] = useState<string | null>(null)
  const [containerCode, setContainerCode] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const fId = localStorage.getItem('operator_forklift_id')
        if (!fId) {
          window.location.href = '/operator'
          return
        }
        setForkliftId(fId)

        const queueData = await api.get<QueueTask[]>(`/api/v1/forklifts/${fId}/queue`)
        if (queueData.length > 0) {
          const active = queueData.find((t) => t.status === 'in_progress') || queueData[0]
          setCurrentTask({
            id: active.id,
            container_code: '',
            container_id: active.container_id,
            destination_x: active.destination_x || 0,
            destination_y: active.destination_y || 0,
            destination_label: active.destination_label,
            ai_instructions: active.ai_instructions,
            type: active.type,
            priority: active.priority,
          })
          setQueue(
            queueData
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
          setContainerCode(active.container_id.slice(0, 8))
        }
      } catch (err) {
        console.error('Init error:', err)
      }
      setLoading(false)
    }
    init()
  }, [setCurrentTask, setQueue])

  function handleChangeForklift() {
    localStorage.removeItem('operator_forklift_id')
    window.location.href = '/operator'
  }

  async function handleComplete() {
    if (!currentTask) return
    const yardId = localStorage.getItem('current_yard_id')
    if (!yardId) return

    try {
      await api.put(`/api/v1/yards/${yardId}/tasks/${currentTask.id}/status`, {
        status: 'done',
        notes: 'Operador confirmou conclusão',
      })

      if (forkliftId) {
        const newQueue = await api.get<QueueTask[]>(`/api/v1/forklifts/${forkliftId}/queue`)
        if (newQueue.length > 0) {
          const next = newQueue[0]
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
          setContainerCode(next.container_id.slice(0, 8))
          setQueue(newQueue.slice(1).map((t) => ({
            id: t.id, container_code: '', container_id: t.container_id,
            destination_x: t.destination_x || 0, destination_y: t.destination_y || 0,
            destination_label: t.destination_label, ai_instructions: t.ai_instructions,
            type: t.type, priority: t.priority,
          })))
        } else {
          setCurrentTask(null)
        }
      }
    } catch (err) {
      console.error('Error completing task:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-lg">Carregando...</p>
        </div>
      </div>
    )
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
        <div className="w-10" />
      </div>

      {/* Arrow */}
      <div className="flex-1 flex items-center justify-center">
        <NavigationArrow angle={0} />
      </div>

      {/* Task info */}
      <div className="w-full space-y-3">
        <TaskCard
          containerCode={containerCode || currentTask.container_id.slice(0, 8)}
          destinationLabel={currentTask.destination_label}
          instructions={currentTask.ai_instructions}
        />

        {queue.length > 0 && (
          <div className="w-full px-4 py-2.5 bg-harbor-surface border border-harbor-border rounded-lg text-center">
            <span className="text-sm text-harbor-muted">
              +{queue.length} tarefa{queue.length > 1 ? 's' : ''} na fila
            </span>
          </div>
        )}

        <button
          onClick={handleComplete}
          className="w-full py-5 bg-harbor-green text-harbor-bg text-2xl font-bold rounded-xl active:bg-green-500 transition-colors"
        >
          Concluir Tarefa
        </button>
      </div>
    </div>
  )
}
