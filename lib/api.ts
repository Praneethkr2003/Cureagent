import type { QueueItem, CaseDetail, Metrics, CaseStatus, AIMessage } from './types'

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? 'http://127.0.0.1:8000'
const isNgrok = FASTAPI.includes('ngrok')

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
    ...(((init.headers as Record<string, string> | undefined) ?? {}) as Record<string, string>),
  }

  const res = await fetch(`${FASTAPI}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${body || 'Request failed'}`)
  }

  return res.json() as Promise<T>
}

export async function getQueue(token: string): Promise<QueueItem[]> {
  return apiFetch<QueueItem[]>('/doctor/queue', { method: 'GET' }, token)
}

export async function getCase(token: string, sessionId: string): Promise<CaseDetail> {
  return apiFetch<CaseDetail>(`/doctor/case/${sessionId}`, { method: 'GET' }, token)
}

export async function claimCase(token: string, sessionId: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/doctor/claim/${sessionId}`, { method: 'POST' }, token)
}

export async function updateStatus(
  token: string,
  sessionId: string,
  status: CaseStatus
): Promise<void> {
  await apiFetch<{ success: boolean }>(
    `/doctor/case/${sessionId}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
    token
  )
}

export async function getMetrics(token: string): Promise<Metrics> {
  return apiFetch<Metrics>('/doctor/metrics', { method: 'GET' }, token)
}

export async function aiAssist(
  token: string,
  payload: {
    session_id?: string
    message: string
    conversation_history: AIMessage[]
  }
): Promise<{ response: string }> {
  return apiFetch<{ response: string }>(
    '/doctor/ai-assist',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  )
}

export async function getCases(token: string, filter?: 'mine' | 'all'): Promise<QueueItem[]> {
  const query = filter === 'mine' ? '?filter=mine' : ''
  return apiFetch<QueueItem[]>(`/doctor/cases${query}`, { method: 'GET' }, token)
}
