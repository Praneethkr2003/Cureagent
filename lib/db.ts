import { createClient } from './supabase/server'

export async function getSupabase() {
  return await createClient()
}

export async function getUser() {
  const supabase = await getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getSession() {
  const supabase = await getSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}
