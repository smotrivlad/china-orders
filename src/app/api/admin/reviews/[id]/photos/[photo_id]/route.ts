import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'

async function isAuthorized(): Promise<boolean> {
  const store = await cookies()
  return store.get('admin_session')?.value === process.env.ADMIN_SECRET
}

export const dynamic = 'force-dynamic'

// DELETE /api/admin/reviews/[id]/photos/[photo_id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; photo_id: string }> },
) {
  if (!await isAuthorized()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: reviewId, photo_id: photoId } = await params

  // Fetch the photo record to get the Storage path from the URL
  const { data: photo, error: fetchErr } = await adminClient
    .from('review_photos')
    .select('id, url')
    .eq('id', photoId)
    .eq('review_id', reviewId)
    .single()

  if (fetchErr || !photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  // Extract storage path from the public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/reviews/<path>
  const storagePrefix = `/storage/v1/object/public/reviews/`
  const urlObj = new URL(photo.url)
  const storagePath = urlObj.pathname.includes(storagePrefix)
    ? urlObj.pathname.slice(urlObj.pathname.indexOf(storagePrefix) + storagePrefix.length)
    : null

  if (storagePath) {
    await adminClient.storage.from('reviews').remove([storagePath])
  }

  const { error: delErr } = await adminClient
    .from('review_photos')
    .delete()
    .eq('id', photoId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
