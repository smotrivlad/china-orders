import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

async function isAuthorized(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export const dynamic = 'force-dynamic'

// GET all reviews (admin sees unpublished too)
export async function GET() {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('reviews')
    .select('id, client_name, text, photo_url, is_published, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ reviews: [] })
  return NextResponse.json({ reviews: data ?? [] })
}

// POST create new review
export async function POST(req: Request) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { client_name, text, photo_url, is_published } = body

  if (!client_name?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'client_name and text are required' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('reviews')
    .insert({ client_name: client_name.trim(), text: text.trim(), photo_url: photo_url || null, is_published: is_published ?? true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ review: data })
}
