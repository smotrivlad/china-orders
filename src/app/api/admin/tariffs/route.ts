import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

function isAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const session = req.cookies.get('admin_session')?.value
  return secret && session === secret
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tariffsRes, settingsRes] = await Promise.all([
    adminClient.from('tariffs').select('*').order('sort_order').order('density_min'),
    adminClient.from('tariff_settings').select('*').order('key'),
  ])

  return NextResponse.json({
    tariffs:  tariffsRes.data  ?? [],
    settings: settingsRes.data ?? [],
  })
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Update individual tariff row
  if (body.type === 'tariff') {
    const { id, slow_price, fast_price } = body
    const { error } = await adminClient
      .from('tariffs')
      .update({ slow_price: Number(slow_price), fast_price: Number(fast_price) })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Update a setting value
  if (body.type === 'setting') {
    const { key, value } = body
    const { error } = await adminClient
      .from('tariff_settings')
      .update({ value: String(value), updated_at: new Date().toISOString() })
      .eq('key', key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
