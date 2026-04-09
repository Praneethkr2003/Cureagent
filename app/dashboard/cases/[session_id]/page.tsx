"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const session_id = params?.session_id as string
  
  const [caseData, setCaseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    if (session_id) fetchCase()
  }, [session_id])

  async function fetchCase() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError("Not authenticated")
        return
      }

      const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL
      const isNgrok = FASTAPI?.includes('ngrok')

      console.log("[case] fetching:", session_id)
      
      const res = await fetch(
        `${FASTAPI}/doctor/case/${session_id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            ...(isNgrok ? {
              'ngrok-skip-browser-warning': 'true'
            } : {})
          }
        }
      )

      console.log("[case] status:", res.status)

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`${res.status}: ${err}`)
      }

      const data = await res.json()
      console.log("[case] loaded:", data)
      setCaseData(data)

    } catch (err) {
      console.error("[case] error:", err)
      setError(err instanceof Error ? err.message : "Failed to load case")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="p-8 text-center text-gray-500">
      Loading case...
    </div>
  )

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-2">{error}</p>
      <button 
        onClick={() => router.back()}
        className="px-4 py-2 border rounded mr-2"
      >
        Go Back
      </button>
      <button 
        onClick={fetchCase}
        className="px-4 py-2 bg-[#0F6E56] text-white rounded"
      >
        Retry
      </button>
    </div>
  )

  if (!caseData) return null

  const symptoms = caseData.structured_symptoms || []
  const messages = caseData.conversation_history || []

  return (
    <div className="h-full flex flex-col">
      
      {/* Header */}
      <div className="p-6 border-b bg-white flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {caseData.patient?.name || "Unknown"}
          </h1>
          <p className="text-sm text-gray-500">
            {caseData.patient?.age}y · {" "}
            {caseData.patient?.sex} · {" "}
            {caseData.detected_specialty || "General"}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${caseData.severity === 'critical' 
              ? 'bg-red-100 text-red-700'
              : caseData.severity === 'urgent'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600'}`}
          >
            {caseData.severity || 'none'}
          </span>
          <span className="px-3 py-1 rounded-full text-sm bg-[#E1F5EE] text-[#0F6E56]">
            {caseData.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white px-6">
        <div className="flex gap-6">
          {["summary","report","conversation","models"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm capitalize border-b-2 transition-colors
                ${activeTab === tab
                  ? 'border-[#0F6E56] text-[#0F6E56]'
                  : 'border-transparent text-gray-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        
        {/* Summary tab */}
        {activeTab === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              {/* Patient profile */}
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-medium mb-3">
                  Patient profile
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Living conditions</span>
                    <span>{caseData.patient?.living_conditions || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-32">Family history</span>
                    <span>{caseData.patient?.family_history || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Symptoms table */}
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-medium mb-3">
                  Symptoms
                </h3>
                {symptoms.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No structured symptoms
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2">Symptom</th>
                        <th className="pb-2">Duration</th>
                        <th className="pb-2">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symptoms.map((s: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{s.symptom}</td>
                          <td className="py-2 text-gray-500">{s.duration || '—'}</td>
                          <td className="py-2 text-gray-500">{s.severity || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* AI Diagnosis */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-medium mb-3">
                AI Diagnosis
              </h3>
              
              {/* Confidence */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Agreement score</span>
                  <span className="font-medium">
                    {Math.round((caseData.consensus?.agreement_score || 0) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#0F6E56] transition-all"
                    style={{ width: `${Math.round((caseData.consensus?.agreement_score || 0) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {caseData.consensus?.confidence || 'low'} confidence · {" "}
                  {(caseData.consensus?.models_used || []).join(", ")}
                </p>
              </div>

              {/* Best diagnosis */}
              <div className="text-sm text-gray-700 leading-relaxed max-h-64 overflow-auto">
                {caseData.consensus?.best_diagnosis || caseData.doctor_report || "No diagnosis generated yet"}
              </div>
            </div>
          </div>
        )}

        {/* Report tab */}
        {activeTab === "report" && (
          <div className="bg-white border rounded-xl p-6 max-w-3xl">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">
                Doctor report
              </h3>
              <button
                onClick={() => {
                  const blob = new Blob([caseData.doctor_report || ""], { type: "text/markdown" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `cureagent_${session_id.slice(0,8)}.md`
                  a.click()
                }}
                className="text-sm text-[#0F6E56] hover:underline"
              >
                Download
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {caseData.doctor_report || "Report not yet generated"}
            </div>
            <p className="text-xs text-gray-400 mt-6 pt-4 border-t">
              This report is AI-generated and must be reviewed by a licensed medical professional.
            </p>
          </div>
        )}

        {/* Conversation tab */}
        {activeTab === "conversation" && (
          <div className="max-w-2xl space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No conversation recorded
              </p>
            ) : messages.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm
                  ${msg.role === 'user'
                    ? 'bg-[#0F6E56] text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-700 rounded-tl-none'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Model outputs tab */}
        {activeTab === "models" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["mistral","phi3","llama3"].map(model => {
              const output = caseData.consensus?.all_outputs?.[model]
              return (
                <div key={model} className={`border rounded-xl p-4 ${!output ? 'opacity-50' : ''}`}>
                  <h3 className="font-medium capitalize mb-2 flex items-center gap-2">
                    {model}
                    {!output && (
                      <span className="text-xs text-gray-400 font-normal">unavailable</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {output || "Model did not respond"}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
