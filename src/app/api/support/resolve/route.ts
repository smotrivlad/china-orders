import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg } from '@/lib/utils/telegram'
import { z } from 'zod'

const schema = z.object({
  session_id: z.string().min(1).max(100),
  resolved:   z.boolean(),
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

  const { session_id, resolved } = parsed.data

  if (resolved) {
    // Client confirmed: close the session
    await adminClient
      .from('support_sessions')
      .update({ status: 'closed' })
      .eq('session_id', session_id)
      .eq('status', 'pending_close')
  } else {
    // Client not resolved: reopen + add a system message + notify manager
    await adminClient
      .from('support_sessions')
      .update({ status: 'open' })
      .eq('session_id', session_id)

    const { data: session } = await adminClient
      .from('support_sessions')
      .select('name')
      .eq('session_id', session_id)
      .maybeSingle()

    await adminClient
      .from('support_messages')
      .insert({
        session_id,
        text: '⚠️ Клиент сообщил, что вопрос ещё не решён.',
        sender: 'manager',
      })

    // Notify manager in Telegram
    const botToken = process.env.SUPPORT_BOT_TOKEN
    const chatId   = process.env.SUPPORT_CHAT_ID
    if (botToken && chatId) {
      await tg(botToken, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ <b>${session?.name ?? 'Клиент'}</b> сообщил, что вопрос <b>не решён</b>. Диалог продолжается.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '✏️ Ответить',       callback_data: `sr|${session_id}` },
            { text: '🔒 Закрыть диалог', callback_data: `sc|${session_id}` },
          ]],
        },
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
