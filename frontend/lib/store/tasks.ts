import { create } from 'zustand'

export interface TaskState {
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
}

interface TasksStore {
  tasks: TaskState[]
  alerts: AlertState[]
  setTasks: (tasks: TaskState[]) => void
  updateTask: (id: string, data: Partial<TaskState>) => void
  addAlert: (alert: AlertState) => void
  clearAlerts: () => void
}

export interface AlertState {
  id: string
  code: string
  entity_id: string
  message: string
  timestamp: string
}

export const useTasksStore = create<TasksStore>((set) => ({
  tasks: [],
  alerts: [],

  setTasks: (tasks) => set({ tasks }),

  updateTask: (id, data) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50),
    })),

  clearAlerts: () => set({ alerts: [] }),
}))
