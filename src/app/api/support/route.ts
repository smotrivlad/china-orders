import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg } from '@/lib/utils/telegram'
import { z } from 'zod'

const schema = z.object({
  name:       z.string().min(1).max(100).trim().optional(),
  text:       z.string().min(1).max(2000).trim(),
  session_id: z.string().min(1).max(100).trim(),
  page:       z.string().max(300).trim().default('/'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { name, text, session_id, page } = parsed.data

  // ── Upsert session ────────────────────────────────────────────────────────
  let sessionName = name ?? 'Клиент'
  let isNewSession = false

  const { data: existing } = await adminClient
    .from('support_sessions')
    .select('session_id, name, status')
    .eq('session_id', session_id)
    .maybeSingle()

  if (!existing) {
    // Create new session
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required for new session' }, { status: 400 })
    }
    const { error: sessErr } = await adminClient
      .from('support_sessions')
      .insert({ session_id, name: name.trim(), page })

    if (sessErr) {
      console.error('[support] session insert error:', sessErr.message)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
    isNewSession = true
  } else {
    sessionName = existing.name
    // Reopen if pending_close (client is writing again)
    if (existing.status === 'pending_close') {
      await adminClient
        .from('support_sessions')
        .update({ status: 'open' })
        .eq('session_id', session_id)
    }
  }

  // ── Insert message ────────────────────────────────────────────────────────
  const { error: msgErr } = await adminClient
    .from('support_messages')
    .insert({ session_id, text, sender: 'client' })

  if (msgErr) {
    console.error('[support] message insert error:', msgErr.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
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

    const label = isNewSession ? '💬 <b>Новый чат поддержки</b>' : '💬 <b>Новое сообщение</b>'
    const tgText = [
      label,
      '',
      `👤 <b>${sessionName}</b>`,
      `📄 <code>${page}</code>  ⏰ ${time}`,
      '',
      `✉️ ${text}`,
    ].join('\n')

    const tgRes = await tg(botToken, 'sendMessage', {
      chat_id: chatId,
      text: tgText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✏️ Ответить',        callback_data: `sr|${session_id}` },
          { text: '🔒 Закрыть диалог',  callback_data: `sc|${session_id}` },
        ]],
      },
    }).catch(e => { console.error('[support] Telegram network error:', e); return null })

    if (tgRes && !tgRes.ok) {
      const b = await tgRes.json().catch(() => ({}))
      console.error('[support] Telegram API error:', JSON.stringify(b))
    }
  }

  return NextResponse.json({ ok: true, session_id })
}
