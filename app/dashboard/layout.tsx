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

  // Try to fetch existing doctor profile
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('id, email, full_name, specialty')
    .eq('id', user.id)
    .single()

  if (doctor) return doctor as Doctor

  // Auto-create profile if not found
  // User is guaranteed to exist in auth.users
  // so foreign key constraint is satisfied
  const { data: newDoctor } = await supabase
    .from('doctors')
    .insert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name 
        ?? user.email?.split('@')[0] 
        ?? 'Doctor',
      specialty: 'General'
    })
    .select()
    .single()

  return newDoctor as Doctor ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name 
      ?? 'Doctor',
    specialty: 'General' as Specialty
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
