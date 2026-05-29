import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg } from '@/lib/utils/telegram'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? null
  const ua = req.headers.get('user-agent') ?? null

  const { data, error } = await adminClient
    .from('calculator_requests')
    .insert({
      category:           body.category           ?? null,
      order_type:         body.order_type         ?? null,
      route:              body.route              ?? null,
      weight:             body.weight             ?? null,
      volume:             body.volume             ?? null,
      density:            body.density            ?? null,
      places:             body.places             ?? null,
      packaging:          body.packaging          ?? null,
      insurance_rate:     body.insurance_rate     ?? null,
      product_cost:       body.product_cost       ?? null,
      buyout_percent:     body.buyout_percent     ?? null,
      total_min:          body.total_min          ?? null,
      total_max:          body.total_max          ?? null,
      converted_to_order: body.converted_to_order ?? false,
      ip_address:         ip,
      user_agent:         ua,
      session_id:         body.session_id         ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[calculator/save]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Optional Telegram notification
  try {
    const { data: settings } = await adminClient
      .from('tariff_settings')
      .select('value')
      .eq('key', 'notify_telegram')
      .single()

    if (settings?.value === 'true') {
      const token  = process.env.TELEGRAM_BOT_TOKEN
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (token && chatId) {
        const cat   = body.category_label ?? body.category ?? '—'
        const type  = body.order_type === 'group' ? 'Совместный' : 'Личный'
        const route = body.route === 'tk_energy' ? 'ТК Энергия' : 'Через Уральск'
        const total = body.total_max
          ? `${Math.round(Number(body.total_min)).toLocaleString('ru')} – ${Math.round(Number(body.total_max)).toLocaleString('ru')} ₽`
          : '—'
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: [
            '🧮 <b>Новый расчёт в калькуляторе</b>',
            '',
            `📦 Категория: ${cat}`,
            `👤 Тип: ${type}`,
            `🚚 Маршрут: ${route}`,
            `⚖️ Вес: ${body.weight} кг`,
            `💰 Итого: ${total}`,
          ].join('\n'),
          parse_mode: 'HTML',
        })
      }
    }
  } catch { /* ignore notification errors */ }

  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await adminClient
    .from('calculator_requests')
    .update({ converted_to_order: true })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
