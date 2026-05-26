import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

async function isAuthorized(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export const dynamic = 'force-dynamic'

// POST /api/admin/reviews/[id]/photos  — upload a photo (multipart/form-data, field: "file")
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: reviewId } = await params

  // Check review exists
  const { data: review, error: revErr } = await adminClient
    .from('reviews')
    .select('id')
    .eq('id', reviewId)
    .single()

  if (revErr || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  // Count existing photos
  const { count } = await adminClient
    .from('review_photos')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId)

  if ((count ?? 0) >= 4) {
    return NextResponse.json({ error: 'Максимум 4 фото на отзыв' }, { status: 400 })
  }

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate type and size
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Только изображения (JPEG, PNG, WebP)' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 5 МБ)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${reviewId}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await adminClient.storage
    .from('reviews')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminClient.storage
    .from('reviews')
    .getPublicUrl(filename)

  // Determine sort_order (next available)
  const { data: existing } = await adminClient
    .from('review_photos')
    .select('sort_order')
    .eq('review_id', reviewId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data: photo, error: dbErr } = await adminClient
    .from('review_photos')
    .insert({ review_id: reviewId, url: publicUrl, sort_order: nextOrder })
    .select()
    .single()

  if (dbErr) {
    // Clean up uploaded file on DB failure
    await adminClient.storage.from('reviews').remove([filename])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ photo })
}

// GET /api/admin/reviews/[id]/photos — list photos for a review
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: reviewId } = await params

  const { data, error } = await adminClient
    .from('review_photos')
    .select('id, url, sort_order')
    .eq('review_id', reviewId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ photos: [] })
  return NextResponse.json({ photos: data ?? [] })
}
