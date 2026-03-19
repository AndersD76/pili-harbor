'use client'

import { useYardStore } from '@/lib/store/yard'

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  stored: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  in_transit: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  missing: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
}

const forkliftColors: Record<string, string> = {
  idle: 'text-blue-400 border-blue-400 bg-blue-400/20',
  working: 'text-amber-400 border-amber-400 bg-amber-400/20',
  offline: 'text-gray-500 border-gray-500 bg-gray-500/20',
  maintenance: 'text-gray-500 border-gray-500 bg-gray-500/20',
}

interface StackGroup {
  block: string
  row: number
  col: number
  containers: Array<{ id: string; code: string; status: string; stack_level: number }>
}

export default function YardCanvas() {
  const { yard, containers, forklifts, selectedContainerId, selectContainer } = useYardStore()

  if (!yard) return null

  const containersArray = Array.from(containers.values())
  const forkliftsArray = Array.from(forklifts.values())

  // Group containers by stack position (block + row + col)
  const stacks = new Map<string, StackGroup>()
  const loose: typeof containersArray = []

  for (const c of containersArray) {
    if (c.block_label && c.row != null && c.col != null) {
      const key = `${c.block_label}-${c.row}-${c.col}`
      if (!stacks.has(key)) {
        stacks.set(key, { block: c.block_label, row: c.row, col: c.col, containers: [] })
      }
      stacks.get(key)!.containers.push({
        id: c.id,
        code: c.code,
        status: c.status,
        stack_level: c.stack_level || 0,
      })
    } else {
      loose.push(c)
    }
  }

  // Sort containers in each stack by level (top first for display)
  Array.from(stacks.values()).forEach((stack) => {
    stack.containers.sort((a, b) => b.stack_level - a.stack_level)
  })

  // Group stacks by block
  const blocks = new Map<string, StackGroup[]>()
  Array.from(stacks.values()).forEach((stack) => {
    if (!blocks.has(stack.block)) blocks.set(stack.block, [])
    blocks.get(stack.block)!.push(stack)
  })

  return (
    <div className="w-full h-full overflow-auto p-6">
      {/* Yard header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs font-mono text-gray-500">
          {yard.name} &mdash; {yard.width_meters}m &times; {yard.height_meters}m
        </div>
        <div className="flex gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Armazenado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50" /> Em trânsito</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500/50" /> Sem sinal</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-blue-400" /> Empilhadeira</span>
        </div>
      </div>

      {/* Blocks grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Array.from(blocks.entries()).map(([blockName, blockStacks]) => (
          <div key={blockName} className="bg-[#0a0f14] rounded-xl border border-white/5 p-4">
            {/* Block header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                {blockName}
              </div>
              <div className="text-xs text-gray-500">
                Bloco {blockName} &middot; {blockStacks.reduce((sum, s) => sum + s.containers.length, 0)} containers
              </div>
            </div>

            {/* Stacks in block */}
            <div className="space-y-2">
              {blockStacks.map((stack) => (
                <div key={`${stack.block}-${stack.row}-${stack.col}`} className="bg-[#060a0e] rounded-lg p-2.5">
                  {/* Stack position label */}
                  <div className="text-[9px] font-mono text-gray-600 mb-1.5">
                    Fila {stack.row} &middot; Col {stack.col} &middot; {stack.containers.length} nível{stack.containers.length > 1 ? 'is' : ''}
                  </div>

                  {/* Stacked containers (top to bottom) */}
                  <div className="space-y-0.5">
                    {stack.containers.map((c, idx) => {
                      const colors = statusColors[c.status] || statusColors.stored
                      const isSelected = selectedContainerId === c.id
                      const isTop = idx === 0
                      const isBottom = idx === stack.containers.length - 1
                      const isBlocked = !isTop

                      return (
                        <button
                          key={c.id}
                          onClick={() => selectContainer(c.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-all text-left ${colors.bg} ${colors.border} ${isSelected ? 'ring-1 ring-white' : ''} ${isBlocked ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold ${colors.text}`}>
                              {c.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isBlocked && (
                              <span className="text-[8px] text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">
                                BLOQ
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-gray-500">
                              N{c.stack_level}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Loose containers (no block) */}
      {loose.length > 0 && (
        <div className="bg-[#0a0f14] rounded-xl border border-white/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-400">
              ?
            </div>
            <div className="text-xs text-gray-500">Sem bloco definido &middot; {loose.length} containers</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {loose.map((c) => {
              const colors = statusColors[c.status] || statusColors.stored
              const isSelected = selectedContainerId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => selectContainer(c.id)}
                  className={`px-3 py-1.5 rounded border text-[10px] font-mono font-bold transition-all ${colors.bg} ${colors.border} ${colors.text} ${isSelected ? 'ring-1 ring-white' : ''}`}
                >
                  {c.code}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Forklifts */}
      <div className="bg-[#0a0f14] rounded-xl border border-white/5 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <div className="text-xs text-gray-500">Empilhadeiras &middot; {forkliftsArray.length} total</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {forkliftsArray.map((f) => {
            const colorClass = forkliftColors[f.status] || forkliftColors.offline
            return (
              <div key={f.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${colorClass}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm">{f.code}</div>
                  <div className="text-[10px] opacity-70">
                    {f.status === 'idle' ? 'Disponível' : f.status === 'working' ? 'Trabalhando' : f.status === 'offline' ? 'Offline' : 'Manutenção'}
                    {f.x != null && <span className="ml-1">({f.x?.toFixed(0)}m, {f.y?.toFixed(0)}m)</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
