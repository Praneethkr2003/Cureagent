'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { claimCase } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpecialtyBadge } from './SpecialtyBadge'
import { SeverityBadge } from './SeverityBadge'
import { ConfidenceBar } from './ConfidenceBar'
import { Clock, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QueueItem } from '@/lib/types'

type QueueCardProps = {
  item: QueueItem
}

export function QueueCard({ item }: QueueCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const getWaitTimeColor = () => {
    if (item.wait_minutes > 30) return 'bg-red-100 text-red-700 border-red-200'
    if (item.wait_minutes > 15) return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Call the internal Next.js API route
      const response = await fetch('/api/doctor/claim-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: item.session_id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to claim case')
      }

      router.push(`/dashboard/cases/${item.session_id}`)
    } catch (error) {
      console.error('Failed to claim case:', error)
      setIsLoading(false)
    }
  }

  // Parse symptoms from summary
  const symptoms = item.symptoms_summary
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left section - Patient info */}
          <div className="flex flex-col gap-2 min-w-0">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {item.patient_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.age}y, {item.sex}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn('w-fit gap-1 text-xs', getWaitTimeColor())}
            >
              <Clock className="h-3 w-3" />
              Waiting {item.wait_minutes} min
            </Badge>
          </div>

          {/* Center section - Symptoms and specialty */}
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="flex flex-wrap justify-center gap-1">
              {symptoms.map((symptom, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {symptom}
                </Badge>
              ))}
            </div>
            <SpecialtyBadge specialty={item.detected_specialty} className="text-xs" />
          </div>

          {/* Right section - Severity and actions */}
          <div className="flex flex-col items-end gap-3">
            <SeverityBadge severity={item.severity} />
            <ConfidenceBar score={item.agreement_score} className="w-32" />
            <Button
              size="sm"
              onClick={handleClaim}
              disabled={isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  Claim & Review
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
