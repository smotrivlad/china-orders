import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { notifyNewOrder } from '@/lib/utils/telegram'
import { orderSchema } from '@/lib/validations/order'

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const raw = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    contact: formData.get('contact') as string,
    product_name: formData.get('product_name') as string,
    description: (formData.get('description') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    urgency: formData.get('urgency') as string,
    order_type: formData.get('order_type') as string,
  }

  const parsed = orderSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const files = formData.getAll('files') as File[]
  const fileUrls: string[] = []

  for (const file of files) {
    if (!file.size) continue
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data: up, error } = await adminClient.storage.from('order-files').upload(path, file)
    if (!error && up) {
      const { data: { publicUrl } } = adminClient.storage.from('order-files').getPublicUrl(up.path)
      fileUrls.push(publicUrl)
    }
  }

  const { data: order, error } = await adminClient
    .from('orders')
    .insert({
      ...parsed.data,
      description: parsed.data.description || null,
      link: parsed.data.link || null,
      file_urls: fileUrls,
    })
    .select('*, statuses(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  notifyNewOrder(order).catch(console.error)

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
