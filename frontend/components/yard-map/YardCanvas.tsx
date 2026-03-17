'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useYardStore } from '@/lib/store/yard'

// Dynamic import to avoid SSR issues with Konva
const Stage = dynamic(() => import('react-konva').then((mod) => mod.Stage), { ssr: false })
const Layer = dynamic(() => import('react-konva').then((mod) => mod.Layer), { ssr: false })
const Rect = dynamic(() => import('react-konva').then((mod) => mod.Rect), { ssr: false })
const Line = dynamic(() => import('react-konva').then((mod) => mod.Line), { ssr: false })

const ContainerNode = dynamic(() => import('./ContainerNode'), { ssr: false })
const ForkliftMarker = dynamic(() => import('./ForkliftMarker'), { ssr: false })

const PADDING = 40

export default function YardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { yard, containers, forklifts } = useYardStore()

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  if (!yard) return null

  // Calculate scale to fit yard in canvas
  const scaleX = (dimensions.width - PADDING * 2) / yard.width_meters
  const scaleY = (dimensions.height - PADDING * 2) / yard.height_meters
  const scale = Math.min(scaleX, scaleY)

  function metersToPixels(x: number, y: number) {
    return {
      px: PADDING + x * scale,
      py: PADDING + y * scale,
    }
  }

  // Generate grid lines
  const gridLines: number[][] = []
  const gridStep = 10 // 10 meter grid
  for (let x = 0; x <= yard.width_meters; x += gridStep) {
    const { px: x1, py: y1 } = metersToPixels(x, 0)
    const { px: x2, py: y2 } = metersToPixels(x, yard.height_meters)
    gridLines.push([x1, y1, x2, y2])
  }
  for (let y = 0; y <= yard.height_meters; y += gridStep) {
    const { px: x1, py: y1 } = metersToPixels(0, y)
    const { px: x2, py: y2 } = metersToPixels(yard.width_meters, y)
    gridLines.push([x1, y1, x2, y2])
  }

  const containersArray = Array.from(containers.values())
  const forkliftsArray = Array.from(forklifts.values())

  const yardBounds = metersToPixels(0, 0)
  const yardEnd = metersToPixels(yard.width_meters, yard.height_meters)

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {/* Yard boundary */}
          <Rect
            x={yardBounds.px}
            y={yardBounds.py}
            width={yardEnd.px - yardBounds.px}
            height={yardEnd.py - yardBounds.py}
            stroke="#1a2332"
            strokeWidth={2}
            fill="#0a0f14"
          />

          {/* Grid */}
          {gridLines.map((points, i) => (
            <Line key={i} points={points} stroke="#111820" strokeWidth={0.5} />
          ))}

          {/* Containers */}
          {containersArray.map((container) => {
            if (container.x == null || container.y == null) return null
            const { px, py } = metersToPixels(container.x, container.y)
            return (
              <ContainerNode
                key={container.id}
                id={container.id}
                code={container.code}
                x={px}
                y={py}
                status={container.status}
                scale={scale}
              />
            )
          })}

          {/* Forklifts */}
          {forkliftsArray.map((forklift) => {
            if (forklift.x == null || forklift.y == null) return null
            const { px, py } = metersToPixels(forklift.x, forklift.y)
            return (
              <ForkliftMarker
                key={forklift.id}
                code={forklift.code}
                x={px}
                y={py}
                heading={forklift.heading || 0}
                status={forklift.status}
              />
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
