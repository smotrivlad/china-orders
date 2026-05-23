import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { notifyNewOrder } from '@/lib/utils/telegram'
import { orderSchema } from '@/lib/validations/order'

// Увеличиваем лимит времени Vercel (работает на Pro плане; на Hobby — 10s по умолчанию)
export const maxDuration = 30

const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

/** Запускает промис, но гарантированно резолвится через timeoutMs — не блокирует ответ */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | void> {
  return Promise.race([
    promise,
    new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
  ])
}

export async function POST(req: NextRequest) {
  // ── Парсим тело ────────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    console.error('[orders] formData parse error:', e)
    return NextResponse.json({ error: 'Не удалось прочитать данные формы' }, { status: 400 })
  }

  const raw = {
    first_name:   formData.get('first_name')   as string,
    last_name:    formData.get('last_name')    as string,
    contact:      formData.get('contact')      as string,
    product_name: formData.get('product_name') as string,
    description:  (formData.get('description') as string) || undefined,
    link:         (formData.get('link')         as string) || undefined,
    urgency:      formData.get('urgency')      as string,
    order_type:   formData.get('order_type')   as string,
  }

  const parsed = orderSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // ── Загружаем файлы в Supabase Storage ────────────────────────────────────
  const files = formData.getAll('files') as File[]
  const fileUrls: string[] = []

  for (const file of files) {
    if (!file.size) continue

    if (file.size > MAX_FILE_BYTES) {
      console.warn(`[orders] Skipping oversized file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
      continue
    }

    const ext  = file.name.split('.').pop() ?? 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    console.log(`[orders] Uploading ${file.name} (${(file.size / 1024).toFixed(0)} KB) → ${path}`)

    const { data: up, error: uploadError } = await adminClient.storage
      .from('orders-files')
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })

    if (uploadError) {
      console.error(`[orders] Storage upload error for ${file.name}:`, uploadError.message)
      continue
    }

    if (up) {
      const { data: { publicUrl } } = adminClient.storage.from('orders-files').getPublicUrl(up.path)
      fileUrls.push(publicUrl)
      console.log(`[orders] Uploaded → ${publicUrl}`)
    }
  }

  // ── Создаём заявку в БД ────────────────────────────────────────────────────
  console.log(`[orders] Inserting order for ${raw.first_name} ${raw.last_name}`)

  const { data: order, error } = await adminClient
    .from('orders')
    .insert({
      ...parsed.data,
      description: parsed.data.description || null,
      link:        parsed.data.link        || null,
      file_urls:   fileUrls,
    })
    .select('*, statuses(*)')
    .single()

  if (error) {
    console.error('[orders] DB insert error:', error.message)
    return NextResponse.json({ error: 'Ошибка сохранения заявки. Попробуйте ещё раз.' }, { status: 500 })
  }

  console.log(`[orders] Order created: ${order.code}`)

  // ── Telegram уведомление (с таймаутом — не блокирует ответ) ───────────────
  // Если Telegram API тормозит или недоступен, заявка всё равно создана.
  withTimeout(notifyNewOrder(order), 7_000)
    .catch(e => console.error('[orders] Telegram notification error:', e))

  return NextResponse.json({ code: order.code })
}

export async function GET(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  const session = req.cookies.get('admin_session')?.value
  if (!adminSecret || session !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminClient
    .from('orders')
    .select('*, statuses(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
