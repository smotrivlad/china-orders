import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

async function isAuthorized(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export const dynamic = 'force-dynamic'

// PATCH update review
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.client_name  !== undefined) update.client_name  = body.client_name.trim()
  if (body.text         !== undefined) update.text         = body.text.trim()
  if (body.photo_url    !== undefined) update.photo_url    = body.photo_url || null
  if (body.is_published !== undefined) update.is_published = body.is_published
  if (body.created_at   !== undefined) {
    // Accepts YYYY-MM-DD from the date picker; store as UTC midnight
    const d = new Date(body.created_at)
    if (!isNaN(d.getTime())) update.created_at = d.toISOString()
  }

  const { error } = await adminClient
    .from('reviews')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE review
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await adminClient
    .from('reviews')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
