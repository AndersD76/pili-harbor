'use client'

import { useYardStore } from '@/lib/store/yard'

const statusColors: Record<string, string> = {
  stored: '#22c55e',
  in_transit: '#eab308',
  missing: '#ef4444',
}

const forkliftStatusColors: Record<string, string> = {
  idle: '#3b82f6',
  working: '#eab308',
  offline: '#6b7280',
  maintenance: '#6b7280',
}

export default function YardCanvas() {
  const { yard, containers, forklifts, selectedContainerId, selectContainer } = useYardStore()

  if (!yard) return null

  const containersArray = Array.from(containers.values())
  const forkliftsArray = Array.from(forklifts.values())

  return (
    <div className="w-full h-full relative bg-[#060a0e] overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: `${800 / yard.width_meters * 10}px ${600 / yard.height_meters * 10}px`,
        }}
      />

      {/* Yard boundary label */}
      <div className="absolute top-2 left-3 text-[10px] font-mono text-gray-600">
        {yard.name} ({yard.width_meters}m × {yard.height_meters}m)
      </div>

      {/* Containers */}
      {containersArray.map((c) => {
        if (c.x == null || c.y == null) return null
        const left = (c.x / yard.width_meters) * 100
        const top = (c.y / yard.height_meters) * 100
        const color = statusColors[c.status] || '#22c55e'
        const isSelected = selectedContainerId === c.id

        return (
          <button
            key={c.id}
            onClick={() => selectContainer(c.id)}
            className="absolute transition-all duration-300 hover:scale-125 group"
            style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            title={`${c.code} | ${c.status}`}
          >
            <div
              className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold whitespace-nowrap border ${isSelected ? 'ring-2 ring-white scale-125' : ''}`}
              style={{
                color,
                borderColor: color + '60',
                backgroundColor: color + '15',
              }}
            >
              {c.code.split('-').pop()?.slice(0, 4)}
            </div>
            {/* Stack level indicator */}
            {(c as any).stack_level > 0 && (
              <div className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-[7px] text-black font-bold flex items-center justify-center">
                {(c as any).stack_level}
              </div>
            )}
          </button>
        )
      })}

      {/* Forklifts */}
      {forkliftsArray.map((f) => {
        if (f.x == null || f.y == null) return null
        const left = (f.x / yard.width_meters) * 100
        const top = (f.y / yard.height_meters) * 100
        const color = forkliftStatusColors[f.status] || '#3b82f6'

        return (
          <div
            key={f.id}
            className="absolute transition-all duration-500"
            style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            title={`${f.code} | ${f.status}`}
          >
            <div className="relative">
              <div
                className="w-5 h-5 rounded-full border-2 shadow-lg animate-pulse"
                style={{
                  borderColor: color,
                  backgroundColor: color + '40',
                  boxShadow: `0 0 12px ${color}50`,
                  animationDuration: f.status === 'working' ? '1s' : '3s',
                }}
              />
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[7px] font-mono font-bold whitespace-nowrap" style={{ color }}>
                {f.code}
              </div>
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-3 text-[9px] text-gray-500 bg-[#060a0e]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/5">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Armazenado</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Trânsito</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Sem sinal</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Empilhadeira</span>
      </div>
    </div>
  )
}
