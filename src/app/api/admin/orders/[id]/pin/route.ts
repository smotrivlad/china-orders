import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

/** POST /api/admin/orders/[id]/pin
 *  Generates a new random 6-digit PIN for an order and saves it to DB.
 *  Requires admin session cookie.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET
  const session     = req.cookies.get('admin_session')?.value
  if (!adminSecret || session !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // ── Verify order exists ──────────────────────────────────────────────────
  const { data: order, error: fetchErr } = await adminClient
    .from('orders')
    .select('id, code')
    .eq('id', id)
    .single()

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // ── Generate random 6-digit PIN ──────────────────────────────────────────
  // Pad to 6 digits: 100000–999999 range to ensure it's always 6 chars
  const pin = Math.floor(100_000 + Math.random() * 900_000).toString()

  // ── Save to DB ───────────────────────────────────────────────────────────
  const { error: updateErr } = await adminClient
    .from('orders')
    .update({ pin })
    .eq('id', id)

  if (updateErr) {
    const isMigrationMissing =
      updateErr.code === '42703' ||
      updateErr.message?.toLowerCase().includes('"pin"') ||
      updateErr.message?.toLowerCase().includes("column")

    if (isMigrationMissing) {
      return NextResponse.json(
        { error: 'migration_required', detail: 'Примените миграцию 009_add_pin_column.sql в Supabase Dashboard' },
        { status: 400 },
      )
    }
    console.error('[pin] DB update error:', updateErr.message)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  console.log(`[pin] Regenerated PIN for order ${order.code}`)
  return NextResponse.json({ pin, code: order.code })
}
