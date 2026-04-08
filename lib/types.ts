export type Specialty = 
  | "ENT" 
  | "Cardiology" 
  | "Neurology" 
  | "Orthopedics" 
  | "General"

export type Severity = 
  | "critical" 
  | "urgent" 
  | "monitor" 
  | "none"

export type CaseStatus = 
  | "pending" 
  | "in_progress" 
  | "reviewed" 
  | "closed"

export type Doctor = {
  id: string
  email: string
  full_name: string
  specialty: Specialty
}

export type StructuredSymptom = {
  symptom: string
  location: string | null
  duration: string | null
  severity: string | null
  onset: string | null
  modifiers: string[]
}

export type QueueItem = {
  session_id: string
  patient_name: string
  age: number
  sex: string
  detected_specialty: Specialty | null
  symptoms_summary: string
  severity: Severity
  agreement_score: number
  confidence: string
  created_at: string
  status: CaseStatus
  wait_minutes: number
}

export type CaseDetail = {
  session_id: string
  patient: {
    name: string
    age: number
    sex: string
    living_conditions: string
    family_history: string
  }
  structured_symptoms: StructuredSymptom[]
  detected_specialty: Specialty | null
  document_text: string | null
  doctor_report: string
  consensus: {
    agreement_score: number
    confidence: string
    models_used: string[]
    models_failed?: string[]
    all_outputs: Record<string, string>
  }
  conversation_history: {
    role: string
    content: string
    message_type: string
    created_at: string
  }[]
  severity: Severity
  status: CaseStatus
  created_at: string
}

export type Metrics = {
  total_cases: number
  pending: number
  in_progress: number
  reviewed: number
  closed: number
  emergency_count: number
  avg_agreement_score: number
  avg_wait_minutes: number
  cases_by_specialty: Record<Specialty, number>
  cases_by_severity: Record<Severity, number>
  cases_by_confidence: Record<string, number>
  recent_cases: {
    session_id: string
    patient_name: string
    severity: Severity
    status: CaseStatus
    created_at: string
  }[]
}

export type AIMessage = {
  role: "user" | "assistant"
  content: string
}
