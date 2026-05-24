import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg } from '@/lib/utils/telegram'
import { z } from 'zod'

const schema = z.object({
  name:    z.string().min(1).max(100).trim(),
  message: z.string().min(1).max(2000).trim(),
  page:    z.string().max(300).trim().default('/'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { name, message, page } = parsed.data

  // ── Save to DB ────────────────────────────────────────────────────────────
  const { error: dbErr } = await adminClient
    .from('support_messages')
    .insert({ name, message, page })

  if (dbErr) {
    // Table might not exist yet — log but don't block Telegram notification
    console.error('[support] DB insert error:', dbErr.message)
  }

  // ── Telegram notification ─────────────────────────────────────────────────
  const botToken = process.env.SUPPORT_BOT_TOKEN
  const chatId   = process.env.SUPPORT_CHAT_ID

  if (botToken && chatId) {
    const time = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const text = [
      '💬 <b>Новое сообщение поддержки</b>',
      '',
      `👤 <b>Имя:</b> ${name}`,
      `📄 <b>Страница:</b> <code>${page}</code>`,
      `⏰ <b>Время:</b> ${time} МСК`,
      '',
      `✉️ ${message}`,
    ].join('\n')

    await tg(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }).catch(e => console.error('[support] Telegram error:', e))
  } else {
    console.warn('[support] SUPPORT_BOT_TOKEN or SUPPORT_CHAT_ID not set')
  }

  return NextResponse.json({ ok: true })
}
