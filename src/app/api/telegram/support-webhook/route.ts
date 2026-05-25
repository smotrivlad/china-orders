import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg } from '@/lib/utils/telegram'

// Marker in force_reply message to recover session_id statlessly
const SESSION_MARKER = '↩️ SESSION·'

function buildReplyPrompt(sessionId: string, clientName: string, lastMsg: string) {
  const preview = lastMsg.length > 120 ? lastMsg.slice(0, 120) + '…' : lastMsg
  return [
    `✏️ <b>Ответ клиенту ${clientName}</b>`,
    '',
    `💬 <i>${preview}</i>`,
    '',
    `${SESSION_MARKER}${sessionId}`,
    '',
    'Напишите ответ:',
  ].join('\n')
}

function parseSessionId(text: string): string | null {
  const m = text.match(/↩️ SESSION·([\w-]{1,100})/)
  return m ? m[1] : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest) {
  const botToken = process.env.SUPPORT_BOT_TOKEN
  if (!botToken) return NextResponse.json({ ok: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let update: any
  try { update = await req.json() } catch { return NextResponse.json({ ok: true }) }

  // ── Callback query ────────────────────────────────────────────────────────
  if (update.callback_query) {
    const { id: queryId, data, from } = update.callback_query

    await tg(botToken, 'answerCallbackQuery', { callback_query_id: queryId }).catch(() => {})

    if (typeof data !== 'string') return NextResponse.json({ ok: true })

    // ── "✏️ Ответить" ─────────────────────────────────────────────────────
    if (data.startsWith('sr|')) {
      const sessionId = data.slice(3)

      // Get last client message for preview
      const { data: msgs } = await adminClient
        .from('support_messages')
        .select('text')
        .eq('session_id', sessionId)
        .eq('sender', 'client')
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: sess } = await adminClient
        .from('support_sessions')
        .select('name')
        .eq('session_id', sessionId)
        .maybeSingle()

      const lastMsg = msgs?.[0]?.text ?? ''
      const clientName = sess?.name ?? 'Клиент'

      await tg(botToken, 'sendMessage', {
        chat_id: from.id,
        text: buildReplyPrompt(sessionId, clientName, lastMsg),
        parse_mode: 'HTML',
        reply_markup: { force_reply: true, selective: false },
      }).catch(() => {})
    }

    // ── "🔒 Закрыть диалог" ──────────────────────────────────────────────
    if (data.startsWith('sc|')) {
      const sessionId = data.slice(3)

      const { error } = await adminClient
        .from('support_sessions')
        .update({ status: 'pending_close' })
        .eq('session_id', sessionId)
        .eq('status', 'open')

      const statusMsg = error
        ? '❌ Не удалось закрыть диалог (уже закрыт или ошибка).'
        : '⏳ Запрос отправлен клиенту — ожидаем подтверждения.'

      await tg(botToken, 'sendMessage', {
        chat_id: from.id,
        text: statusMsg,
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  }

  // ── Message reply: admin replied to the force_reply prompt ───────────────
  if (update.message?.reply_to_message) {
    const replyToText: string = update.message.reply_to_message.text ?? ''
    const sessionId = parseSessionId(replyToText)
    const replyText: string = (update.message.text ?? '').trim()

    if (sessionId && replyText) {
      // Check session exists and is open
      const { data: sess } = await adminClient
        .from('support_sessions')
        .select('status, name')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (!sess || sess.status === 'closed') {
        await tg(botToken, 'sendMessage', {
          chat_id: update.message.chat.id,
          text: '❌ Диалог закрыт или не найден.',
          reply_to_message_id: update.message.message_id,
        }).catch(() => {})
        return NextResponse.json({ ok: true })
      }

      // Save manager message
      const { error } = await adminClient
        .from('support_messages')
        .insert({ session_id: sessionId, text: replyText, sender: 'manager' })

      if (error) {
        console.error('[support-webhook] DB insert error:', error.message)
        await tg(botToken, 'sendMessage', {
          chat_id: update.message.chat.id,
          text: `❌ Ошибка сохранения: ${error.message}`,
          reply_to_message_id: update.message.message_id,
        }).catch(() => {})
      } else {
        await tg(botToken, 'sendMessage', {
          chat_id: update.message.chat.id,
          text: `✅ Ответ отправлен клиенту <b>${sess.name}</b>!`,
          parse_mode: 'HTML',
          reply_to_message_id: update.message.message_id,
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
