import { create } from 'zustand'

export interface ContainerState {
  id: string
  code: string
  x: number | null
  y: number | null
  status: string
  confidence: number | null
  weight_kg: number | null
  stack_level: number
  block_label: string | null
  row: number | null
  col: number | null
}

export interface ForkliftState {
  id: string
  code: string
  x: number | null
  y: number | null
  heading: number | null
  status: string
  operator_id: string | null
}

export interface YardState {
  id: string
  name: string
  width_meters: number
  height_meters: number
}

interface YardStore {
  yard: YardState | null
  containers: Map<string, ContainerState>
  forklifts: Map<string, ForkliftState>
  selectedContainerId: string | null
  setYard: (yard: YardState) => void
  setContainers: (containers: ContainerState[]) => void
  updateContainer: (id: string, data: Partial<ContainerState>) => void
  setForklifts: (forklifts: ForkliftState[]) => void
  updateForklift: (id: string, data: Partial<ForkliftState>) => void
  selectContainer: (id: string | null) => void
}

export const useYardStore = create<YardStore>((set) => ({
  yard: null,
  containers: new Map(),
  forklifts: new Map(),
  selectedContainerId: null,

  setYard: (yard) => set({ yard }),

  setContainers: (containers) =>
    set({
      containers: new Map(containers.map((c) => [c.id, c])),
    }),

  updateContainer: (id, data) =>
    set((state) => {
      const containers = new Map(state.containers)
      const existing = containers.get(id)
      if (existing) {
        containers.set(id, { ...existing, ...data })
      }
      return { containers }
    }),

  setForklifts: (forklifts) =>
    set({
      forklifts: new Map(forklifts.map((f) => [f.id, f])),
    }),

  updateForklift: (id, data) =>
    set((state) => {
      const forklifts = new Map(state.forklifts)
      const existing = forklifts.get(id)
      if (existing) {
        forklifts.set(id, { ...existing, ...data })
      }
      return { forklifts }
    }),

  selectContainer: (id) => set({ selectedContainerId: id }),
}))
