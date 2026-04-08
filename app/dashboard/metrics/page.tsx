"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchMetrics() {
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

      const res = await fetch(`${FASTAPI}/doctor/metrics`, {
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
      console.log("[metrics] loaded:", data)
      setMetrics(data)
    } catch (err) {
      console.error("[metrics] error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) return <div className="p-8 text-center">Loading metrics...</div>

  if (error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <button onClick={fetchMetrics} className="px-4 py-2 border rounded">
          Try Again
        </button>
      </div>
    )

  if (!metrics) return null

  const specialtyData = Object.entries(metrics.cases_by_specialty || {}).map(
    ([name, value]) => ({ name, value })
  )

  const severityData = Object.entries(metrics.cases_by_severity || {}).map(
    ([name, value]) => ({ name, value })
  )

  const COLORS = ["#0F6E56", "#1D9E75", "#5DCAA5", "#9FE1CB", "#E1F5EE"]

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 
        gap-4">
        {[
          { label: "Total Cases", value: metrics.total_cases },
          { label: "Pending", value: metrics.pending },
          { label: "Emergencies", value: metrics.emergency_count },
          {
            label: "Avg Confidence",
            value: `${Math.round((metrics.avg_agreement_score || 0) * 100)}%`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white rounded-xl 
              border text-center"
          >
            <p
              className="text-2xl font-semibold 
              text-[#0F6E56]"
            >
              {stat.value ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 
        gap-6">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium mb-4">Cases by specialty</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={specialtyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {specialtyData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium mb-4">Cases by severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#0F6E56"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h3 className="font-medium">Recent cases</h3>
        </div>
        <div className="divide-y">
          {(metrics.recent_cases || []).map((c: any) => (
            <div
              key={c.session_id}
              className="p-4 flex justify-between 
                items-center"
            >
              <div>
                <p className="font-medium text-sm">{c.patient_name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs px-2 py-0.5 
                  rounded-full bg-gray-100">
                  {c.status}
                </span>
                <button
                  onClick={() =>
                    (window.location.href = `/dashboard/cases/${c.session_id}`)
                  }
                  className="text-xs text-[#0F6E56] 
                    hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          ))}
          {(!metrics.recent_cases || metrics.recent_cases.length === 0) && (
            <div
              className="p-8 text-center 
              text-gray-400 text-sm"
            >
              No recent cases
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
