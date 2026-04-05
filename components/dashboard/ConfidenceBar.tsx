import { cn } from '@/lib/utils'

type ConfidenceBarProps = {
  score: number
  showLabel?: boolean
  className?: string
}

export function ConfidenceBar({ score, showLabel = true, className }: ConfidenceBarProps) {
  const percentage = Math.min(Math.max(score, 0), 100)
  
  const getColor = () => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          AI confidence: {percentage.toFixed(0)}%
        </span>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
