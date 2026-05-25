import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get('sid')
  if (!sid || sid.length > 100) {
    return NextResponse.json({ session: null, messages: [] }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const [{ data: session }, { data: messages }] = await Promise.all([
    adminClient
      .from('support_sessions')
      .select('session_id, name, status, created_at')
      .eq('session_id', sid)
      .maybeSingle(),
    adminClient
      .from('support_messages')
      .select('id, text, sender, created_at')
      .eq('session_id', sid)
      .order('created_at', { ascending: true }),
  ])

  return NextResponse.json(
    { session: session ?? null, messages: messages ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
