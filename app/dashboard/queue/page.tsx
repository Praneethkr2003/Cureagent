'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getQueue } from '@/lib/api'
import { QueueCard } from '@/components/dashboard/QueueCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Users, RefreshCw, Inbox } from 'lucide-react'
import type { QueueItem, Severity, Specialty } from '@/lib/types'

const severityFilters: (Severity | 'all')[] = ['all', 'critical', 'urgent', 'monitor', 'none']

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorSpecialty, setDoctorSpecialty] = useState<Specialty | null>(null)
  
  // Filters
  const [specialtyFilter, setSpecialtyFilter] = useState<'mine' | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchQueue = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    // Get doctor specialty
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('specialty')
        .eq('id', user.id)
        .single()
      
      if (doctor?.specialty) {
        setDoctorSpecialty(doctor.specialty as Specialty)
      } else if (user.user_metadata?.specialty) {
        setDoctorSpecialty(user.user_metadata.specialty as Specialty)
      }
    }

    try {
      const data = await getQueue(session.access_token)
      setQueue(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        () => {
          fetchQueue()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchQueue])

  // Filter and sort queue
  const filteredQueue = useMemo(() => {
    let result = [...queue]

    // Specialty filter
    if (specialtyFilter === 'mine' && doctorSpecialty) {
      result = result.filter((item) => item.detected_specialty === doctorSpecialty)
    }

    // Severity filter
    if (severityFilter !== 'all') {
      result = result.filter((item) => item.severity === severityFilter)
    }

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase()
      result = result.filter(
        (item) =>
          item.patient_name.toLowerCase().includes(search) ||
          item.symptoms_summary.toLowerCase().includes(search)
      )
    }

    // Sort: specialty match first, then severity, then wait time
    const severityOrder: Record<Severity, number> = {
      critical: 0,
      urgent: 1,
      monitor: 2,
      none: 3,
    }

    result.sort((a, b) => {
      // Specialty match first
      if (doctorSpecialty) {
        const aMatch = a.detected_specialty === doctorSpecialty ? 0 : 1
        const bMatch = b.detected_specialty === doctorSpecialty ? 0 : 1
        if (aMatch !== bMatch) return aMatch - bMatch
      }

      // Then severity
      const aSeverity = severityOrder[a.severity]
      const bSeverity = severityOrder[b.severity]
      if (aSeverity !== bSeverity) return aSeverity - bSeverity

      // Then wait time (longest first)
      return b.wait_minutes - a.wait_minutes
    })

    return result
  }, [queue, specialtyFilter, severityFilter, debouncedSearch, doctorSpecialty])

  const handleRefresh = () => {
    setIsLoading(true)
    fetchQueue()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Patient Queue</h1>
            <Badge variant="secondary" className="text-sm">
              {filteredQueue.length} patients
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* Specialty toggle */}
          <div className="flex rounded-lg border border-border p-1">
            <Button
              variant={specialtyFilter === 'mine' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSpecialtyFilter('mine')}
              className="h-8"
              disabled={!doctorSpecialty}
            >
              My Specialty
            </Button>
            <Button
              variant={specialtyFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSpecialtyFilter('all')}
              className="h-8"
            >
              All
            </Button>
          </div>

          {/* Severity pills */}
          <div className="flex flex-wrap gap-1">
            {severityFilters.map((severity) => (
              <Badge
                key={severity}
                variant={severityFilter === severity ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setSeverityFilter(severity)}
              >
                {severity === 'all' ? 'All' : severity}
              </Badge>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No cases in queue</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {specialtyFilter === 'mine'
                ? 'No cases matching your specialty right now'
                : 'The queue is currently empty'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQueue.map((item) => (
              <QueueCard key={item.session_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
