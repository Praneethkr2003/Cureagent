// FORCE FRESH BUILD - 2026-04-08
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { AIAssistant } from '@/components/dashboard/AIAssistant'
import { ActiveCaseProvider } from '@/lib/ActiveCaseContext'
import type { Doctor, Specialty } from '@/lib/types'

async function getDoctorInfo(): Promise<Doctor | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Try to fetch from doctors table
  let { data: doctor } = await supabase
    .from('doctors')
    .select('id, email, full_name, specialty')
    .eq('id', user.id)
    .single()

  if (!doctor) {
    const { data: newDoctor } = await supabase
      .from('doctors')
      .insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name || user.email?.split('@')[0] || 'Doctor',
        specialty: 'General',
      })
      .select()
      .single()

    doctor = newDoctor
  }

  if (doctor) {
    return doctor as Doctor
  }

  // Fallback to user metadata
  return {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Doctor',
    specialty: (user.user_metadata?.specialty as Specialty) || 'General',
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const doctor = await getDoctorInfo()

  return (
    <ActiveCaseProvider>
      <div className="flex h-svh overflow-hidden">
        <Sidebar doctor={doctor} />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
        <AIAssistant />
      </div>
    </ActiveCaseProvider>
  )
}
