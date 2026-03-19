'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Task {
  id: string
  container_id: string
  forklift_id: string | null
  type: string
  priority: number
  status: string
  destination_label: string | null
  estimated_duration_seconds: number | null
  notes: string | null
  created_at: string
}

const columns = [
  { key: 'pending', label: 'Pendente', color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/20', dot: 'bg-amber-400' },
  { key: 'assigned', label: 'Atribuída', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20', dot: 'bg-blue-400' },
  { key: 'in_progress', label: 'Em Andamento', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20', dot: 'bg-purple-400' },
  { key: 'done', label: 'Concluída', color: 'text-harbor-green', bgColor: 'bg-harbor-green/10', borderColor: 'border-harbor-green/20', dot: 'bg-harbor-green' },
]

const priorityColors: Record<number, string> = {
  1: 'text-harbor-muted',
  2: 'text-harbor-muted',
  3: 'text-blue-400',
  4: 'text-blue-400',
  5: 'text-amber-400',
  6: 'text-amber-400',
  7: 'text-orange-400',
  8: 'text-orange-400',
  9: 'text-red-400',
  10: 'text-red-400',
}

const typeLabels: Record<string, string> = {
  relocate: 'Relocar',
  load: 'Carregar',
  unload: 'Descarregar',
  inspect: 'Inspecionar',
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const yardId = localStorage.getItem('current_yard_id')
    if (!yardId) {
      router.push('/dashboard')
      return
    }

    api.get<Task[]>(`/api/v1/yards/${yardId}/tasks`)
      .then((data) => {
        setTasks(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar tarefas')
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando tarefas...</p>
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
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar tarefas</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const totalTasks = tasks.length

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Tarefas</h2>
          <p className="text-harbor-muted text-sm mt-0.5">{totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${col.bgColor} border ${col.borderColor}`}>
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                <span className={`ml-auto text-xs font-mono ${col.color}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-harbor-surface border border-harbor-border rounded-lg hover:border-harbor-border/80 transition-colors">
                    {/* Container ID */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-harbor-text bg-harbor-bg px-2 py-0.5 rounded">
                        {task.container_id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] font-bold ${priorityColors[task.priority] || 'text-harbor-muted'}`}>
                        P{task.priority}
                      </span>
                    </div>

                    {/* Type */}
                    <div className="text-xs text-harbor-muted mb-1">
                      {typeLabels[task.type] || task.type}
                    </div>

                    {/* Destination */}
                    {task.destination_label && (
                      <div className="flex items-center gap-1 text-xs text-harbor-green mt-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {task.destination_label}
                      </div>
                    )}

                    {/* Duration */}
                    {task.estimated_duration_seconds && (
                      <div className="flex items-center gap-1 text-[10px] text-harbor-muted mt-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{Math.round(task.estimated_duration_seconds / 60)}min
                      </div>
                    )}

                    {/* Forklift badge */}
                    {task.forklift_id && (
                      <div className="mt-2 text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded w-fit">
                        {task.forklift_id.slice(0, 6)}
                      </div>
                    )}
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-harbor-muted/50 text-xs border border-dashed border-harbor-border rounded-lg">
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
