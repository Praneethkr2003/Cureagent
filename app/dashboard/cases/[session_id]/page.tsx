'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCase, updateStatus } from '@/lib/api'
import { CaseDetail } from '@/components/dashboard/CaseDetail'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import type { CaseDetail as CaseDetailType, CaseStatus } from '@/lib/types'

type PageProps = {
  params: Promise<{ session_id: string }>
}

export default function CaseDetailPage(props: PageProps) {
  const params = use(props.params)
  const { session_id } = params
  const router = useRouter()
  const [caseData, setCaseData] = useState<CaseDetailType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://127.0.0.1:8000'

  useEffect(() => {
    const fetchCase = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          setError('Not authenticated')
          return
        }

        const response = await fetch(
          `${FASTAPI}/doctor/case/${session_id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'ngrok-skip-browser-warning': 'true',
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          const errText = await response.text()
          console.error('Case fetch error:', errText)
          setError(`Error loading case: ${response.status} - ${errText}`)
          return
        }

        const data = await response.json()
        setCaseData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch case')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCase()
  }, [session_id, FASTAPI])

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!caseData) return

    setIsUpdatingStatus(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Not authenticated')
        return
      }

      await updateStatus(session.access_token, session_id, newStatus)
      setCaseData({ ...caseData, status: newStatus })
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-6 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load case</h2>
        <div className="text-muted-foreground text-center max-w-md">
          {error || 'Case not found'}
        </div>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    )
  }

  return (
    <CaseDetail
      caseData={caseData}
      onBack={handleBack}
      onStatusChange={handleStatusChange}
      isUpdatingStatus={isUpdatingStatus}
    />
  )
}
