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

interface ContainerOption { id: string; code: string }
interface ForkliftOption { id: string; code: string }

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yardId, setYardId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [containers, setContainers] = useState<ContainerOption[]>([])
  const [forkliftOptions, setForkliftOptions] = useState<ForkliftOption[]>([])
  const [taskForm, setTaskForm] = useState({ container_id: '', type: 'relocate', priority: 5, destination_label: '', notes: '', forklift_id: '' })

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadTasks(id)
  }, [router])

  function loadTasks(id: string) {
    api.get<Task[]>(`/api/v1/yards/${id}/tasks`)
      .then((data) => { setTasks(data); setLoading(false) })
      .catch((err) => { setError(err.message || 'Erro ao carregar tarefas'); setLoading(false) })
  }

  async function openCreateModal() {
    if (!yardId) return
    setShowCreate(true)
    try {
      const [c, f] = await Promise.all([
        api.get<ContainerOption[]>(`/api/v1/yards/${yardId}/containers`),
        api.get<ForkliftOption[]>(`/api/v1/yards/${yardId}/forklifts`),
      ])
      setContainers(c)
      setForkliftOptions(f)
    } catch { /* ignore */ }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault()
    if (!yardId) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.post(`/api/v1/yards/${yardId}/tasks`, {
        container_id: taskForm.container_id,
        type: taskForm.type,
        priority: taskForm.priority,
        destination_label: taskForm.destination_label || null,
        notes: taskForm.notes || null,
        forklift_id: taskForm.forklift_id || null,
      })
      setShowCreate(false)
      setTaskForm({ container_id: '', type: 'relocate', priority: 5, destination_label: '', notes: '', forklift_id: '' })
      loadTasks(yardId)
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar tarefa')
    } finally {
      setCreating(false)
    }
  }

  async function changeStatus(taskId: string, newStatus: string) {
    if (!yardId) return
    try {
      await api.put(`/api/v1/yards/${yardId}/tasks/${taskId}/status`, { status: newStatus })
      loadTasks(yardId)
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status')
    }
  }

  const nextStatus: Record<string, { label: string; status: string; color: string }[]> = {
    pending: [
      { label: 'Atribuir', status: 'assigned', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
      { label: 'Cancelar', status: 'cancelled', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
    ],
    assigned: [
      { label: 'Iniciar', status: 'in_progress', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
      { label: 'Voltar', status: 'pending', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    ],
    in_progress: [
      { label: 'Concluir', status: 'done', color: 'text-harbor-green bg-harbor-green/10 border-harbor-green/20' },
      { label: 'Voltar', status: 'pending', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    ],
    done: [],
  }

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

  const selectClass = "w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none appearance-none"
  const inputClass = "w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">Nova Tarefa</h3>
              <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {createError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{createError}</div>}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Container *</label>
                <select value={taskForm.container_id} onChange={(e) => setTaskForm({ ...taskForm, container_id: e.target.value })} className={selectClass} required>
                  <option value="">Selecione um container</option>
                  {containers.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Tipo *</label>
                  <select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })} className={selectClass}>
                    <option value="relocate">Relocar</option>
                    <option value="load">Carregar</option>
                    <option value="unload">Descarregar</option>
                    <option value="inspect">Inspecionar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Prioridade (1-10)</label>
                  <input type="number" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: Number(e.target.value) })}
                    className={inputClass + ' font-mono'} min={1} max={10} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Empilhadeira (opcional)</label>
                <select value={taskForm.forklift_id} onChange={(e) => setTaskForm({ ...taskForm, forklift_id: e.target.value })} className={selectClass}>
                  <option value="">Nenhuma (pendente)</option>
                  {forkliftOptions.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Destino</label>
                <input type="text" value={taskForm.destination_label} onChange={(e) => setTaskForm({ ...taskForm, destination_label: e.target.value })}
                  className={inputClass} placeholder="Ex: Bloco A, Posição 12" />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Observações</label>
                <input type="text" value={taskForm.notes} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className={inputClass} placeholder="Ex: Container frágil" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {creating ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">Tarefas</h2>
          <p className="text-harbor-muted text-sm mt-0.5">{totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} no total</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Tarefa
        </button>
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
                      <span className={`text-xs font-bold ${priorityColors[task.priority] || 'text-harbor-muted'}`}>
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
                      <div className="flex items-center gap-1 text-xs text-harbor-muted mt-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{Math.round(task.estimated_duration_seconds / 60)}min
                      </div>
                    )}

                    {/* Forklift badge */}
                    {task.forklift_id && (
                      <div className="mt-2 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded w-fit">
                        {task.forklift_id.slice(0, 6)}
                      </div>
                    )}

                    {/* Status actions */}
                    {(nextStatus[task.status] || []).length > 0 && (
                      <div className="mt-3 pt-2 border-t border-harbor-border flex gap-1">
                        {(nextStatus[task.status] || []).map((action) => (
                          <button key={action.status} onClick={() => changeStatus(task.id, action.status)}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded border ${action.color} hover:opacity-80 transition-opacity`}>
                            {action.label}
                          </button>
                        ))}
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
    </>
  )
}
