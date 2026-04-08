import { NextResponse } from 'next/server'
import { getSession, getSupabase } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id } = await request.json()
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const supabase = await getSupabase()
    
    // Update the session in Supabase
    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress',
        claimed_by: session.user.id
      })
      .eq('session_id', session_id)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to claim case in database' }, { status: 500 })
    }

    // Optional: Also notify FastAPI if it manages local state
    const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000'
    const isNgrok = FASTAPI_URL.includes('ngrok')
    
    try {
      await fetch(`${FASTAPI_URL}/doctor/claim/${session_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          ...(isNgrok ? { 'ngrok-skip-browser-warning': 'true' } : {}),
        }
      })
    } catch (e) {
      console.warn('Failed to notify FastAPI about claim, but Supabase was updated', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Claim Case API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
