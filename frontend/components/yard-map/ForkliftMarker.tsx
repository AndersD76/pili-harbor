'use client'

import { Group, RegularPolygon, Text } from 'react-konva'

interface ForkliftMarkerProps {
  code: string
  x: number
  y: number
  heading: number
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#00e07a',
  working: '#facc15',
  offline: '#ef4444',
  maintenance: '#7d8590',
}

export default function ForkliftMarker({ code, x, y, heading, status }: ForkliftMarkerProps) {
  const color = STATUS_COLORS[status] || '#7d8590'

  return (
    <Group x={x} y={y} rotation={heading}>
      <RegularPolygon
        sides={3}
        radius={10}
        fill={color + '40'}
        stroke={color}
        strokeWidth={2}
        rotation={-90}
      />
      <Text
        text={code}
        x={-20}
        y={12}
        width={40}
        align="center"
        fontSize={9}
        fill={color}
        fontFamily="monospace"
      />
    </Group>
  )
}
