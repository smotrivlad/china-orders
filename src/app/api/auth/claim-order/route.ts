import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { checkPin } from '@/lib/utils/orderPin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // Verify authenticated session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })

  const body = await req.json()
  const code = (body.code as string)?.trim().toUpperCase()
  const pin  = (body.pin  as string)?.trim()

  if (!code || !pin) {
    return NextResponse.json({ error: 'Укажите код заявки и PIN' }, { status: 400 })
  }

  // Fetch the order (no user_id filter — we're claiming an unclaimed one)
  const { data: order, error: fetchErr } = await adminClient
    .from('orders')
    .select('id, code, pin, user_id')
    .eq('code', code)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
  }

  // Already linked to this user — idempotent success
  if (order.user_id === user.id) {
    return NextResponse.json({ ok: true, message: 'Заявка уже привязана к вашему аккаунту' })
  }

  // Already linked to another user
  if (order.user_id && order.user_id !== user.id) {
    return NextResponse.json({ error: 'Эта заявка уже привязана к другому аккаунту' }, { status: 409 })
  }

  // Verify PIN (constant-time comparison)
  if (!checkPin(order.code, pin, order.pin)) {
    return NextResponse.json({ error: 'Неверный PIN-код' }, { status: 403 })
  }

  // Link the order to this user
  const { error: updateErr } = await adminClient
    .from('orders')
    .update({ user_id: user.id })
    .eq('id', order.id)

  if (updateErr) {
    // Graceful fallback if user_id column doesn't exist yet (migration not applied)
    if (updateErr.code === '42703') {
      return NextResponse.json({ error: 'Функция ещё не доступна — применить миграцию 015' }, { status: 503 })
    }
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
