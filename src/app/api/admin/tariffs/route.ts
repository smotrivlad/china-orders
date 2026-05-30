import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

function isAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const session = req.cookies.get('admin_session')?.value
  return secret && session === secret
}

async function fetchCbrRate(): Promise<number | null> {
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    return data?.Valute?.USD?.Value ?? null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [tariffsRes, settingsRes, commissionRes, packagingRes, insuranceRes] = await Promise.all([
    adminClient.from('tariffs').select('*').order('sort_order').order('density_min'),
    adminClient.from('tariff_settings').select('*').order('key'),
    adminClient.from('commission_tiers').select('*').order('sort_order'),
    adminClient.from('packaging_types').select('*').order('sort_order'),
    adminClient.from('insurance_tiers').select('*').order('sort_order'),
  ])

  const cbrRate = await fetchCbrRate()

  return NextResponse.json({
    tariffs:          tariffsRes.data  ?? [],
    settings:         settingsRes.data ?? [],
    commission_tiers: commissionRes.data ?? [],
    packaging_types:  packagingRes.data  ?? [],
    insurance_tiers:  insuranceRes.data  ?? [],
    cbr_rate:         cbrRate,
  })
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // ── Cargo tariff row ──────────────────────────────────────────────────────
  if (body.type === 'tariff') {
    const { id, slow_price, fast_price } = body
    const { error } = await adminClient
      .from('tariffs')
      .update({ slow_price: Number(slow_price), fast_price: Number(fast_price) })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Setting key/value ────────────────────────────────────────────────────
  if (body.type === 'setting') {
    const { key, value } = body
    const { error } = await adminClient
      .from('tariff_settings')
      .update({ value: String(value), updated_at: new Date().toISOString() })
      .eq('key', key)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ── Commission tiers ─────────────────────────────────────────────────────
  if (body.type === 'commission_upsert') {
    const { id, amount_to, rate, sort_order } = body
    if (id) {
      await adminClient.from('commission_tiers')
        .update({ amount_to: amount_to ?? null, rate: Number(rate), sort_order: Number(sort_order) })
        .eq('id', id)
      return NextResponse.json({ ok: true })
    } else {
      const { data, error } = await adminClient.from('commission_tiers')
        .insert({ amount_to: amount_to ?? null, rate: Number(rate), sort_order: Number(sort_order) })
        .select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, id: data.id })
    }
  }
  if (body.type === 'commission_delete') {
    await adminClient.from('commission_tiers').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── Insurance tiers ──────────────────────────────────────────────────────
  if (body.type === 'insurance_upsert') {
    const { id, vpk_to, rate, sort_order } = body
    if (id) {
      await adminClient.from('insurance_tiers')
        .update({ vpk_to: vpk_to ?? null, rate: Number(rate), sort_order: Number(sort_order) })
        .eq('id', id)
      return NextResponse.json({ ok: true })
    } else {
      const { data, error } = await adminClient.from('insurance_tiers')
        .insert({ vpk_to: vpk_to ?? null, rate: Number(rate), sort_order: Number(sort_order) })
        .select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, id: data.id })
    }
  }
  if (body.type === 'insurance_delete') {
    await adminClient.from('insurance_tiers').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── Packaging types ──────────────────────────────────────────────────────
  if (body.type === 'packaging_upsert') {
    const { id, label, price_min, price_max, per_m3, sort_order } = body
    if (id) {
      await adminClient.from('packaging_types')
        .update({ label, price_min: Number(price_min), price_max: Number(price_max), per_m3: !!per_m3, sort_order: Number(sort_order) })
        .eq('id', id)
      return NextResponse.json({ ok: true })
    } else {
      const value = 'pkg_' + Date.now()
      const { data, error } = await adminClient.from('packaging_types')
        .insert({ value, label, price_min: Number(price_min), price_max: Number(price_max), per_m3: !!per_m3, sort_order: Number(sort_order) })
        .select('id, value').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, id: data.id, value: data.value })
    }
  }
  if (body.type === 'packaging_delete') {
    await adminClient.from('packaging_types').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
