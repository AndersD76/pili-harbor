'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useYardStore, ContainerState, ForkliftState } from '@/lib/store/yard'

// Color by cargo type / status
function containerColor(c: ContainerState): string {
  if (c.customs_status === 'red' || c.customs_status === 'grey') return '#ef4444'
  if (c.status === 'missing') return '#ef4444'
  if (c.status === 'in_transit') return '#f59e0b'
  if (c.cargo_type === 'imo') return '#a855f7'
  if (c.cargo_type === 'reefer' || c.is_reefer) return '#22d3ee'
  if (c.cargo_type === 'empty') return '#6b7280'
  if (c.cargo_type === 'bulk') return '#f59e0b'
  return '#22c55e' // general = green
}

function forkliftColor(f: ForkliftState): string {
  if (f.status === 'working') return '#f59e0b'
  if (f.status === 'idle') return '#3b82f6'
  return '#4b5563'
}

const LEGEND = [
  { label: 'Geral', color: '#22c55e' },
  { label: 'Reefer', color: '#22d3ee' },
  { label: 'IMO', color: '#a855f7' },
  { label: 'Trânsito', color: '#f59e0b' },
  { label: 'Vazio', color: '#6b7280' },
  { label: 'Alerta', color: '#ef4444' },
  { label: 'Empilh.', color: '#3b82f6' },
]

export default function YardCanvas() {
  const { yard, containers, forklifts, selectedContainerId, selectContainer } = useYardStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 20, y: 20 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState<{ x: number; y: number; c: ContainerState } | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'blocks'>('map')

  const containersArray = Array.from(containers.values())
  const forkliftsArray = Array.from(forklifts.values())

  if (!yard) return null

  const CONTAINER_W = 12
  const CONTAINER_H = 6

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#060a0e'
    ctx.fillRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    const scaleX = (rect.width - 40) / yard.width_meters * 0.9
    const scaleY = (rect.height - 40) / yard.height_meters * 0.9
    const scale = Math.min(scaleX, scaleY)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= yard.width_meters; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x * scale, 0)
      ctx.lineTo(x * scale, yard.height_meters * scale)
      ctx.stroke()
    }
    for (let y = 0; y <= yard.height_meters; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y * scale)
      ctx.lineTo(yard.width_meters * scale, y * scale)
      ctx.stroke()
    }

    // Yard border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, 0, yard.width_meters * scale, yard.height_meters * scale)

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '9px monospace'
    for (let x = 0; x <= yard.width_meters; x += 40) {
      ctx.fillText(`${x}m`, x * scale, yard.height_meters * scale + 14)
    }
    for (let y = 0; y <= yard.height_meters; y += 40) {
      ctx.fillText(`${y}m`, -20, y * scale + 3)
    }

    // Block zones (compute from container positions)
    const blockBounds = new Map<string, { minX: number; maxX: number; minY: number; maxY: number; count: number }>()
    for (const c of containersArray) {
      if (c.block_label && c.x != null && c.y != null) {
        const b = blockBounds.get(c.block_label) || { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, count: 0 }
        b.minX = Math.min(b.minX, c.x)
        b.maxX = Math.max(b.maxX, c.x)
        b.minY = Math.min(b.minY, c.y)
        b.maxY = Math.max(b.maxY, c.y)
        b.count++
        blockBounds.set(c.block_label, b)
      }
    }

    // Draw block zones
    Array.from(blockBounds.entries()).forEach(([label, b]) => {
      const pad = 8
      const bx = (b.minX - pad) * scale
      const by = (b.minY - pad) * scale
      const bw = (b.maxX - b.minX + pad * 2) * scale
      const bh = (b.maxY - b.minY + pad * 2) * scale

      ctx.fillStyle = 'rgba(255,255,255,0.02)'
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(bx, by, bw, bh)
      ctx.setLineDash([])

      // Block label
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(`${label}`, bx + 6, by + 16)
      ctx.font = '9px sans-serif'
      ctx.fillText(`${b.count} ct`, bx + 6, by + 28)
    })

    // Draw containers
    for (const c of containersArray) {
      if (c.x == null || c.y == null) continue
      const cx = c.x * scale - CONTAINER_W / 2
      const cy = c.y * scale - CONTAINER_H / 2
      const color = containerColor(c)
      const isSelected = selectedContainerId === c.id

      // Shadow for stacked
      if (c.stack_level > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fillRect(cx + 2, cy + 2, CONTAINER_W, CONTAINER_H)
      }

      // Container rect
      ctx.fillStyle = isSelected ? '#ffffff' : color
      ctx.globalAlpha = isSelected ? 1 : (c.stack_level > 0 ? 0.9 : 0.7)
      ctx.fillRect(cx, cy, CONTAINER_W, CONTAINER_H)
      ctx.globalAlpha = 1

      // Stack level indicator
      if (c.stack_level > 0) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 7px monospace'
        ctx.fillText(`${c.stack_level}`, cx + CONTAINER_W + 1, cy + CONTAINER_H - 1)
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(cx - 2, cy - 2, CONTAINER_W + 4, CONTAINER_H + 4)
      }
    }

    // Draw forklifts
    for (const f of forkliftsArray) {
      if (f.x == null || f.y == null) continue
      const fx = f.x * scale
      const fy = f.y * scale
      const color = forkliftColor(f)
      const r = 6

      // Outer glow
      ctx.beginPath()
      ctx.arc(fx, fy, r + 3, 0, Math.PI * 2)
      ctx.fillStyle = color + '30'
      ctx.fill()

      // Circle
      ctx.beginPath()
      ctx.arc(fx, fy, r, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Heading arrow
      if (f.heading != null) {
        const angle = (f.heading - 90) * Math.PI / 180
        ctx.beginPath()
        ctx.moveTo(fx + Math.cos(angle) * (r + 5), fy + Math.sin(angle) * (r + 5))
        ctx.lineTo(fx + Math.cos(angle - 0.4) * r, fy + Math.sin(angle - 0.4) * r)
        ctx.lineTo(fx + Math.cos(angle + 0.4) * r, fy + Math.sin(angle + 0.4) * r)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
      }

      // Label
      ctx.fillStyle = '#ffffff'
      ctx.font = '8px monospace'
      ctx.fillText(f.code, fx - 12, fy - r - 4)
    }

    ctx.restore()
  }, [yard, containersArray, forkliftsArray, zoom, offset, selectedContainerId])

  useEffect(() => { draw() }, [draw])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const obs = new ResizeObserver(() => draw())
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [draw])

  // Mouse handlers for pan
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button === 0) {
      setDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (dragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }
  function handleMouseUp() { setDragging(false) }

  // Click to select container
  function handleClick(e: React.MouseEvent) {
    if (dragging) return
    const canvas = canvasRef.current
    if (!canvas || !yard) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left - offset.x) / zoom
    const my = (e.clientY - rect.top - offset.y) / zoom

    const scaleX = (rect.width - 40) / yard.width_meters * 0.9
    const scaleY = (rect.height - 40) / yard.height_meters * 0.9
    const scale = Math.min(scaleX, scaleY)

    // Find clicked container
    for (const c of containersArray) {
      if (c.x == null || c.y == null) continue
      const cx = c.x * scale - CONTAINER_W / 2
      const cy = c.y * scale - CONTAINER_H / 2
      if (mx >= cx && mx <= cx + CONTAINER_W && my >= cy && my <= cy + CONTAINER_H) {
        selectContainer(c.id)
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, c })
        return
      }
    }
    selectContainer(null)
    setTooltip(null)
  }

  // Zoom with wheel
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.3, Math.min(5, z * delta)))
  }

  const selectedC = selectedContainerId ? containers.get(selectedContainerId) : null

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0e14]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500">{yard.name} — {yard.width_meters}m × {yard.height_meters}m</span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">{containersArray.length} containers · {forkliftsArray.length} empilhadeiras</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 mr-4">
            {LEGEND.map(l => (
              <span key={l.label} className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.7 }} />
                {l.label}
              </span>
            ))}
          </div>
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.min(5, z * 1.3))} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 text-gray-400 hover:text-white text-sm font-bold">+</button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z * 0.7))} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 text-gray-400 hover:text-white text-sm font-bold">−</button>
          <button onClick={() => { setZoom(1); setOffset({ x: 20, y: 20 }) }} className="px-2 h-7 flex items-center justify-center rounded bg-white/5 text-gray-400 hover:text-white text-xs">Reset</button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapperRef} className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 bg-[#111820] border border-white/10 rounded-lg p-3 shadow-xl pointer-events-none"
            style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
          >
            <div className="font-mono font-bold text-white text-sm">{tooltip.c.code}</div>
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              <div>Tipo: <span className="text-white capitalize">{tooltip.c.cargo_type}</span>{tooltip.c.imo_class ? ` (IMO ${tooltip.c.imo_class})` : ''}</div>
              <div>Nível: <span className="text-white">N{tooltip.c.stack_level}</span> {tooltip.c.block_label ? `| Bloco ${tooltip.c.block_label}` : ''}</div>
              {tooltip.c.weight_kg && <div>Peso: <span className="text-white">{tooltip.c.weight_kg.toLocaleString('pt-BR')} kg</span></div>}
              <div>Status: <span className="text-white">{tooltip.c.status}</span></div>
              {tooltip.c.customs_status !== 'none' && (
                <div>Aduana: <span className={tooltip.c.customs_status === 'red' ? 'text-red-400' : tooltip.c.customs_status === 'green' ? 'text-green-400' : 'text-amber-400'}>{tooltip.c.customs_status.toUpperCase()}</span></div>
              )}
              {tooltip.c.cargo_description && <div className="text-gray-500 italic">{tooltip.c.cargo_description}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Selected container detail bar */}
      {selectedC && (
        <div className="px-4 py-3 border-t border-white/5 bg-[#0a0e14] flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: containerColor(selectedC) }} />
            <span className="font-mono font-bold text-white">{selectedC.code}</span>
          </div>
          <span className="text-gray-500">Bloco {selectedC.block_label || '?'} · F{selectedC.row}/{selectedC.col} · N{selectedC.stack_level}</span>
          <span className="text-gray-500">{selectedC.cargo_type.toUpperCase()}{selectedC.imo_class ? ` IMO ${selectedC.imo_class}` : ''}</span>
          {selectedC.weight_kg && <span className="text-gray-500">{selectedC.weight_kg.toLocaleString('pt-BR')} kg</span>}
          <span className={`font-medium ${selectedC.customs_status === 'red' ? 'text-red-400' : selectedC.customs_status === 'released' ? 'text-green-400' : 'text-gray-500'}`}>
            Aduana: {selectedC.customs_status}
          </span>
          <button onClick={() => { selectContainer(null); setTooltip(null) }} className="ml-auto text-gray-500 hover:text-white">✕ Fechar</button>
        </div>
      )}
    </div>
  )
}
