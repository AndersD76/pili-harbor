'use client'

interface TaskCardProps {
  containerCode: string
  destinationLabel: string | null
  instructions: string | null
}

export default function TaskCard({ containerCode, destinationLabel, instructions }: TaskCardProps) {
  return (
    <div className="w-full bg-harbor-surface border border-harbor-border rounded-lg p-4">
      <div className="text-center">
        <div className="text-3xl font-bold font-mono text-harbor-text tracking-wider">
          {containerCode}
        </div>
        {destinationLabel && (
          <div className="text-lg text-harbor-green mt-2">&rarr; {destinationLabel}</div>
        )}
        {instructions && (
          <div className="text-sm text-harbor-muted mt-3 leading-relaxed">{instructions}</div>
        )}
      </div>
    </div>
  )
}
