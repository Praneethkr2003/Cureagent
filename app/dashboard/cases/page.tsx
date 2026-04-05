'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCases } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SpecialtyBadge } from '@/components/dashboard/SpecialtyBadge'
import { SeverityBadge } from '@/components/dashboard/SeverityBadge'
import { Search, FolderOpen, Eye, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { QueueItem, CaseStatus } from '@/lib/types'

const statusStyles: Record<CaseStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  reviewed: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<CaseStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  reviewed: 'Reviewed',
  closed: 'Closed',
}

export default function CasesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filter = searchParams.get('filter') as 'mine' | null

  const [cases, setCases] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCases = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    try {
      const data = await getCases(session.access_token, filter || 'all')
      setCases(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cases')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [filter])

  const filteredCases = useMemo(() => {
    if (!debouncedSearch) return cases
    const search = debouncedSearch.toLowerCase()
    return cases.filter(
      (c) =>
        c.patient_name.toLowerCase().includes(search) ||
        c.symptoms_summary.toLowerCase().includes(search)
    )
  }, [cases, debouncedSearch])

  const handleViewCase = (sessionId: string) => {
    router.push(`/dashboard/cases/${sessionId}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">
              {filter === 'mine' ? 'My Cases' : 'All Cases'}
            </h1>
            <Badge variant="secondary" className="text-sm">
              {filteredCases.length} cases
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCases}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex rounded-lg border border-border p-1">
            <Button
              variant={filter === 'mine' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/dashboard/cases?filter=mine')}
              className="h-8"
            >
              My Cases
            </Button>
            <Button
              variant={!filter ? 'default' : 'ghost'}
              size="sm"
              onClick={() => router.push('/dashboard/cases')}
              className="h-8"
            >
              All Cases
            </Button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* Cases table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchCases} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No cases found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {debouncedSearch ? 'Try adjusting your search' : 'No cases available'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.session_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{caseItem.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.age}y, {caseItem.sex}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SpecialtyBadge specialty={caseItem.detected_specialty} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={caseItem.severity} showIcon={false} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusStyles[caseItem.status]}
                      >
                        {statusLabels[caseItem.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(caseItem.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCase(caseItem.session_id)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
