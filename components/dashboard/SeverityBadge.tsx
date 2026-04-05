import { Badge } from '@/components/ui/badge'
import type { Severity } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Eye, CheckCircle } from 'lucide-react'

const severityConfig: Record<Severity, { style: string; icon: typeof AlertTriangle; label: string }> = {
  critical: {
    style: 'bg-red-500 text-white hover:bg-red-500/90',
    icon: AlertTriangle,
    label: 'Critical',
  },
  urgent: {
    style: 'bg-orange-500 text-white hover:bg-orange-500/90',
    icon: AlertCircle,
    label: 'Urgent',
  },
  monitor: {
    style: 'bg-yellow-500 text-white hover:bg-yellow-500/90',
    icon: Eye,
    label: 'Monitor',
  },
  none: {
    style: 'bg-gray-400 text-white hover:bg-gray-400/90',
    icon: CheckCircle,
    label: 'None',
  },
}

type SeverityBadgeProps = {
  severity: Severity
  showIcon?: boolean
  className?: string
}

export function SeverityBadge({ severity, showIcon = true, className }: SeverityBadgeProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <Badge className={cn(config.style, 'font-medium gap-1', className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
