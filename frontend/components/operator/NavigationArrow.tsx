'use client'

interface NavigationArrowProps {
  angle: number
}

export default function NavigationArrow({ angle }: NavigationArrowProps) {
  return (
    <div className="relative w-64 h-64">
      {/* Compass circle */}
      <div className="absolute inset-0 rounded-full border-2 border-harbor-border" />

      {/* Arrow */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.5s ease-out' }}
      >
        <polygon
          points="100,30 130,140 100,120 70,140"
          fill="#ef4444"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
