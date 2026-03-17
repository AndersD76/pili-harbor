'use client'

import { useEffect, useState } from 'react'
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
}

const columns = [
  { key: 'pending', label: 'Pendente', color: 'text-harbor-muted' },
  { key: 'assigned', label: 'Atribuída', color: 'text-blue-400' },
  { key: 'in_progress', label: 'Em Andamento', color: 'text-yellow-400' },
  { key: 'done', label: 'Concluída', color: 'text-harbor-green' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Get yardId from context/cookie
    const yardId = localStorage.getItem('current_yard_id')
    if (yardId) {
      api.get<Task[]>(`/api/v1/yards/${yardId}/tasks`).then((data) => {
        setTasks(data)
        setLoading(false)
      })
    }
  }, [])

  if (loading) {
    return <div className="p-8 text-harbor-muted">Carregando tarefas...</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-harbor-text mb-6">Tarefas</h2>
      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                <span className="text-xs text-harbor-muted bg-harbor-border px-1.5 py-0.5 rounded">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {colTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-harbor-surface border border-harbor-border rounded">
                    <div className="font-mono text-xs text-harbor-text">{task.container_id.slice(0, 8)}</div>
                    <div className="text-[10px] text-harbor-muted mt-1">
                      {task.type} | P{task.priority}
                    </div>
                    {task.destination_label && (
                      <div className="text-[10px] text-harbor-muted mt-1">→ {task.destination_label}</div>
                    )}
                    {task.estimated_duration_seconds && (
                      <div className="text-[10px] text-harbor-green mt-1">
                        ~{Math.round(task.estimated_duration_seconds / 60)}min
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
