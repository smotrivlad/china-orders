import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notifyNewOrder } from '@/lib/utils/telegram'
import { orderSchema } from '@/lib/validations/order'
import type { OrderItem } from '@/types'

export const maxDuration = 30

const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return Promise.race([promise, new Promise<void>(resolve => setTimeout(resolve, ms))])
}

/** Загружает один файл в Supabase Storage и возвращает публичный URL или null */
async function uploadFile(file: File): Promise<string | null> {
  if (!file.size || file.size > MAX_FILE_BYTES) return null
  const ext  = file.name.split('.').pop() ?? 'bin'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data: up, error } = await adminClient.storage
    .from('orders-files')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error || !up) {
    console.error(`[orders] upload error for ${file.name}:`, error?.message)
    return null
  }
  const { data: { publicUrl } } = adminClient.storage.from('orders-files').getPublicUrl(up.path)
  return publicUrl
}

export async function POST(req: NextRequest) {
  // ── Читаем user_id из сессии (опционально — не блокируем анонимные заявки) ─
  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch { /* ignore — auth is optional for order creation */ }

  // ── Парсим тело ────────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    console.error('[orders] formData parse error:', e)
    return NextResponse.json({ error: 'Не удалось прочитать данные формы' }, { status: 400 })
  }

  // ── Валидируем личные данные + параметры ───────────────────────────────────
  const raw = {
    first_name:  formData.get('first_name')  as string,
    last_name:   formData.get('last_name')   as string,
    contact:     formData.get('contact')     as string,
    urgency:     formData.get('urgency')     as string,
    order_type:  formData.get('order_type')  as string,
  }

  const parsed = orderSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // ── Парсим товары из JSON ───────────────────────────────────────────────────
  const itemsJson = formData.get('items') as string | null
  let itemsText: Array<{ product_name: string; description?: string; link?: string }> = []

  if (itemsJson) {
    try {
      itemsText = JSON.parse(itemsJson)
    } catch {
      return NextResponse.json({ error: 'Невалидный формат товаров' }, { status: 400 })
    }
  }

  // Обратная совместимость: старый формат без поля items
  if (!itemsText.length) {
    const product_name = formData.get('product_name') as string
    if (product_name?.trim()) {
      itemsText = [{
        product_name,
        description: (formData.get('description') as string) || undefined,
        link:        (formData.get('link')         as string) || undefined,
      }]
    }
  }

  if (!itemsText.length || !itemsText[0]?.product_name?.trim()) {
    return NextResponse.json({ error: 'Добавьте хотя бы один товар' }, { status: 400 })
  }

  // ── Загружаем файлы каждого товара ────────────────────────────────────────
  const items: OrderItem[] = await Promise.all(
    itemsText.map(async (item, i) => {
      const files    = formData.getAll(`files_${i}`) as File[]
      const legacyFiles = i === 0 ? formData.getAll('files') as File[] : []
      const allFiles = files.length > 0 ? files : legacyFiles

      const fileUrls: string[] = []
      for (const file of allFiles) {
        const url = await uploadFile(file)
        if (url) fileUrls.push(url)
      }
      console.log(`[orders] item ${i + 1}: "${item.product_name}", ${fileUrls.length} file(s)`)
      return {
        product_name: item.product_name,
        description:  item.description || null,
        link:         item.link        || null,
        file_urls:    fileUrls,
      }
    }),
  )

  // Первый товар + все файлы для обратной совместимости с существующими полями
  const firstItem   = items[0]
  const allFileUrls = items.flatMap(it => it.file_urls ?? [])

  // ── Создаём заявку ─────────────────────────────────────────────────────────
  console.log(`[orders] Inserting order for ${raw.first_name} ${raw.last_name}, ${items.length} item(s)`)

  const baseData = {
    ...parsed.data,
    product_name: firstItem.product_name,
    description:  firstItem.description || null,
    link:         firstItem.link        || null,
    file_urls:    allFileUrls,
  }

  // Пробуем с колонкой items; если её нет — fallback без неё
  const insertData = userId
    ? { ...baseData, items, user_id: userId }
    : { ...baseData, items }

  let { data: order, error } = await adminClient
    .from('orders')
    .insert(insertData)
    .select('*, statuses(*)')
    .single()

  if (error) {
    // Код 42703 — column does not exist (миграция ещё не применена)
    const isColMissing = error.code === '42703' ||
      (error.message.includes('"items"') && error.message.includes('does not exist'))

    if (isColMissing) {
      console.warn('[orders] items column missing — falling back to insert without it')
      const fallbackData = userId ? { ...baseData, user_id: userId } : baseData
      const fallback = await adminClient
        .from('orders')
        .insert(fallbackData)
        .select('*, statuses(*)')
        .single()
      if (fallback.error) {
        console.error('[orders] DB insert error:', fallback.error.message)
        return NextResponse.json({ error: 'Ошибка сохранения заявки. Попробуйте ещё раз.' }, { status: 500 })
      }
      order = fallback.data
    } else {
      console.error('[orders] DB insert error:', error.message)
      return NextResponse.json({ error: 'Ошибка сохранения заявки. Попробуйте ещё раз.' }, { status: 500 })
    }
  }

  console.log(`[orders] Order created: ${order!.code}`)

  // ── Telegram уведомление ──────────────────────────────────────────────────
  await withTimeout(notifyNewOrder(order!, items), 5_000)
    .catch(e => console.error('[orders] Telegram notification error:', e))

  return NextResponse.json({ code: order!.code })
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
