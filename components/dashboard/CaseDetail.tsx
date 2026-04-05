'use client'

import { useEffect } from 'react'
import { useActiveCase } from '@/lib/ActiveCaseContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SpecialtyBadge } from './SpecialtyBadge'
import { SeverityBadge } from './SeverityBadge'
import { 
  ArrowLeft, 
  Download, 
  User, 
  FileText, 
  MessageSquare, 
  Cpu,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import type { CaseDetail as CaseDetailType, CaseStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

type CaseDetailProps = {
  caseData: CaseDetailType
  onBack: () => void
  onStatusChange: (status: CaseStatus) => void
  isUpdatingStatus: boolean
}

const statusOptions: { value: CaseStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'closed', label: 'Closed' },
]

const messageTypeStyles: Record<string, string> = {
  follow_up: 'bg-blue-100 text-blue-700',
  diagnosis: 'bg-green-100 text-green-700',
  emergency: 'bg-red-100 text-red-700',
  advice: 'bg-purple-100 text-purple-700',
}

export function CaseDetail({ 
  caseData, 
  onBack, 
  onStatusChange, 
  isUpdatingStatus 
}: CaseDetailProps) {
  const { setActiveCase, clearActiveCase } = useActiveCase()

  useEffect(() => {
    setActiveCase({
      session_id: caseData.session_id,
      patient_name: caseData.patient.name,
      age: caseData.patient.age,
      sex: caseData.patient.sex,
      top_symptoms: caseData.structured_symptoms
        .slice(0, 3)
        .map((s) => s.symptom),
    })

    return () => clearActiveCase()
  }, [caseData, setActiveCase, clearActiveCase])

  const handleDownloadReport = () => {
    const blob = new Blob([caseData.doctor_report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cureagent_${caseData.session_id.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreStroke = (score: number) => {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {caseData.patient.name}
                </h1>
                <span className="text-muted-foreground">
                  {caseData.patient.age}y, {caseData.patient.sex}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <SpecialtyBadge specialty={caseData.detected_specialty} />
                <SeverityBadge severity={caseData.severity} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={caseData.status}
              onValueChange={(value) => onStatusChange(value as CaseStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="summary" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary" className="gap-1">
              <User className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1">
              <FileText className="h-4 w-4" />
              Full Report
            </TabsTrigger>
            <TabsTrigger value="conversation" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-1">
              <Cpu className="h-4 w-4" />
              Model Outputs
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Patient Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patient Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{caseData.patient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age / Sex</p>
                      <p className="font-medium">
                        {caseData.patient.age} years, {caseData.patient.sex}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Living Conditions</p>
                    <p className="font-medium">
                      {caseData.patient.living_conditions || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Family History</p>
                    <p className="font-medium">
                      {caseData.patient.family_history || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Detected Specialty</p>
                    <SpecialtyBadge specialty={caseData.detected_specialty} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Diagnosis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    {/* Circular Progress */}
                    <div className="relative h-24 w-24">
                      <svg className="h-24 w-24 -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={getScoreStroke(caseData.consensus.agreement_score)}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(caseData.consensus.agreement_score / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn('text-xl font-bold', getScoreColor(caseData.consensus.agreement_score))}>
                          {caseData.consensus.agreement_score}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <Badge variant="outline" className="capitalize">
                          {caseData.consensus.confidence}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Models Used</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {caseData.consensus.models_used.map((model) => (
                            <Badge key={model} variant="secondary" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {caseData.consensus.models_failed && 
                       caseData.consensus.models_failed.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Models Failed</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {caseData.consensus.models_failed.map((model) => (
                              <Badge 
                                key={model} 
                                variant="outline" 
                                className="text-xs text-destructive border-destructive/30"
                              >
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms Table */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Structured Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symptom</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Onset</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseData.structured_symptoms.map((symptom, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {symptom.symptom}
                          </TableCell>
                          <TableCell>{symptom.location || '—'}</TableCell>
                          <TableCell>{symptom.duration || '—'}</TableCell>
                          <TableCell>{symptom.severity || '—'}</TableCell>
                          <TableCell>{symptom.onset || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Document Preview */}
              {caseData.document_text && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Document Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {caseData.document_text.slice(0, 500)}
                        {caseData.document_text.length > 500 && '...'}
                      </p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Full Report Tab */}
          <TabsContent value="report" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Doctor Report</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadReport}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{caseData.doctor_report}</ReactMarkdown>
                  </div>
                </ScrollArea>
                <div className="mt-4 rounded-md bg-muted/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                    Disclaimer: This report is generated by AI and should be reviewed 
                    by a qualified healthcare professional before any medical decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversation Tab */}
          <TabsContent value="conversation" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="flex flex-col gap-4">
                    {caseData.conversation_history.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex flex-col gap-1',
                          message.role === 'user' ? 'items-end' : 'items-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                            message.role === 'user'
                              ? 'rounded-tr-sm bg-primary text-primary-foreground'
                              : 'rounded-tl-sm bg-muted text-foreground'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          {message.role !== 'user' && message.message_type && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                messageTypeStyles[message.message_type] || ''
                              )}
                            >
                              {message.message_type}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Outputs Tab */}
          <TabsContent value="models" className="mt-0">
            <div className="grid gap-4 lg:grid-cols-3">
              {Object.entries(caseData.consensus.all_outputs).map(([model, output]) => {
                const isFailed = caseData.consensus.models_failed?.includes(model)
                return (
                  <Card key={model} className={cn(isFailed && 'opacity-60')}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {model}
                        {isFailed && (
                          <Badge variant="outline" className="text-destructive">
                            Unavailable
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <p className="text-sm whitespace-pre-wrap">
                          {isFailed ? 'Model output unavailable' : output}
                        </p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
