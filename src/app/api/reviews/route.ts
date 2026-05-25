import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await adminClient
    .from('reviews')
    .select('id, client_name, text, photo_url, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    // Table might not exist yet
    return NextResponse.json({ reviews: [] })
  }

  return NextResponse.json({ reviews: data ?? [] })
}
