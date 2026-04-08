"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function CasesPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  async function fetchCases() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError("Not authenticated")
        return
      }

      const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL
      const isNgrok = FASTAPI?.includes('ngrok')

      const res = await fetch(`${FASTAPI}/doctor/cases`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          ...(isNgrok
            ? {
                "ngrok-skip-browser-warning": "true",
              }
            : {}),
        },
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`${res.status}: ${err}`)
      }

      const data = await res.json()
      console.log("[cases] loaded:", data.length)
      setCases(data)
    } catch (err) {
      console.error("[cases] error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch cases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  // Filter cases client-side
  const filtered = cases.filter((c: any) => {
    if (filter === "mine") return c.status === "in_progress"
    return true
  })

  if (loading)
    return <div className="p-8 text-center">Loading cases...</div>

  if (error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCases}
          className="mt-4 px-4 py-2 border rounded"
        >
          Try Again
        </button>
      </div>
    )

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-sm
            ${
              filter === "all"
                ? "bg-[#0F6E56] text-white"
                : "border"
            }`}
        >
          All Cases ({cases.length})
        </button>
        <button
          onClick={() => setFilter("mine")}
          className={`px-3 py-1 rounded-full text-sm
            ${
              filter === "mine"
                ? "bg-[#0F6E56] text-white"
                : "border"
            }`}
        >
          In Progress
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No cases found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => (
            <div
              key={c.session_id}
              className="p-4 border rounded-xl 
                bg-white hover:shadow-sm 
                cursor-pointer"
              onClick={() =>
                (window.location.href = `/dashboard/cases/${c.session_id}`)
              }
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{c.patient_name}</p>
                  <p className="text-sm text-gray-500">{c.symptoms_summary}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 
                    rounded-full
                    ${
                      c.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : c.severity === "urgent"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.severity || "none"}
                  </span>
                  <p className="text-xs text-gray-400 
                    mt-1">
                    {c.wait_minutes}m ago
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <span
                  className="text-xs px-2 py-0.5 
                  rounded-full bg-[#E1F5EE] 
                  text-[#0F6E56]"
                >
                  {c.detected_specialty || "General"}
                </span>
                <span
                  className="text-xs px-2 py-0.5 
                  rounded-full bg-gray-100 
                  text-gray-600"
                >
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
