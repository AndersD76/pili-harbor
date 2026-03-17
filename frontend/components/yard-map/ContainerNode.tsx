'use client'

import { Group, Rect, Text } from 'react-konva'
import { useYardStore } from '@/lib/store/yard'

interface ContainerNodeProps {
  id: string
  code: string
  x: number
  y: number
  status: string
  scale: number
}

const STATUS_COLORS: Record<string, string> = {
  stored: '#00e07a',
  moving: '#facc15',
  loaded: '#3b82f6',
  missing: '#ef4444',
}

export default function ContainerNode({ id, code, x, y, status, scale }: ContainerNodeProps) {
  const selectContainer = useYardStore((s) => s.selectContainer)
  const selectedId = useYardStore((s) => s.selectedContainerId)

  // Container size in pixels (approx 6m x 2.4m scaled)
  const w = Math.max(6 * scale, 30)
  const h = Math.max(2.4 * scale, 12)

  const color = STATUS_COLORS[status] || '#7d8590'
  const isSelected = selectedId === id

  return (
    <Group
      x={x - w / 2}
      y={y - h / 2}
      onClick={() => selectContainer(id)}
      onTap={() => selectContainer(id)}
    >
      <Rect
        width={w}
        height={h}
        fill={color + '20'}
        stroke={isSelected ? '#ffffff' : color}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
      />
      {w > 40 && (
        <Text
          text={code.slice(-7)}
          x={2}
          y={h / 2 - 5}
          fontSize={Math.min(10, w / 6)}
          fill={color}
          fontFamily="monospace"
        />
      )}
    </Group>
  )
}
