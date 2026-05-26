import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await adminClient
    .from('reviews')
    .select('id, client_name, text, created_at, review_photos(id, url, sort_order)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    // Table might not exist yet
    return NextResponse.json({ reviews: [] })
  }

  // Sort photos by sort_order within each review
  const reviews = (data ?? []).map(r => ({
    ...r,
    photos: ((r.review_photos as { id: string; url: string; sort_order: number }[] | null) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order),
  }))

  return NextResponse.json({ reviews })
}
