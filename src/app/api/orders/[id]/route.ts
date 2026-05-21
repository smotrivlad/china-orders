import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSecret = process.env.ADMIN_SECRET
  const session = req.cookies.get('admin_session')?.value
  if (!adminSecret || session !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { status_id, manager_comment } = await req.json()

  const { data, error } = await adminClient
    .from('orders')
    .update({ status_id, manager_comment })
    .eq('id', id)
    .select('*, statuses(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
