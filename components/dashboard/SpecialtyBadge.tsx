import { Badge } from '@/components/ui/badge'
import type { Specialty } from '@/lib/types'
import { cn } from '@/lib/utils'

const specialtyStyles: Record<Specialty, string> = {
  ENT: 'bg-[#0F6E56] text-white hover:bg-[#0F6E56]/90',
  Cardiology: 'bg-[#A32D2D] text-white hover:bg-[#A32D2D]/90',
  Neurology: 'bg-[#534AB7] text-white hover:bg-[#534AB7]/90',
  Orthopedics: 'bg-[#854F0B] text-white hover:bg-[#854F0B]/90',
  General: 'bg-[#5F5E5A] text-white hover:bg-[#5F5E5A]/90',
}

type SpecialtyBadgeProps = {
  specialty: Specialty | null
  className?: string
}

export function SpecialtyBadge({ specialty, className }: SpecialtyBadgeProps) {
  if (!specialty) {
    return (
      <Badge variant="outline" className={cn('font-medium', className)}>
        Unassigned
      </Badge>
    )
  }

  return (
    <Badge className={cn(specialtyStyles[specialty], 'font-medium', className)}>
      {specialty}
    </Badge>
  )
}
