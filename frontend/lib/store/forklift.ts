import { create } from 'zustand'

export interface OperatorTask {
  id: string
  container_code: string
  container_id: string
  destination_x: number
  destination_y: number
  destination_label: string | null
  ai_instructions: string | null
  type: string
  priority: number
}

interface ForkliftStore {
  forkliftId: string | null
  currentTask: OperatorTask | null
  queue: OperatorTask[]
  myPosition: { x: number; y: number; heading: number } | null
  setForkliftId: (id: string) => void
  setCurrentTask: (task: OperatorTask | null) => void
  setQueue: (queue: OperatorTask[]) => void
  setMyPosition: (pos: { x: number; y: number; heading: number }) => void
}

export const useForkliftStore = create<ForkliftStore>((set) => ({
  forkliftId: null,
  currentTask: null,
  queue: [],
  myPosition: null,
  setForkliftId: (id) => set({ forkliftId: id }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setQueue: (queue) => set({ queue }),
  setMyPosition: (pos) => set({ myPosition: pos }),
}))
