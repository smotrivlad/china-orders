import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg, buildContactButton } from '@/lib/utils/telegram'
import { notifyClientStatusChange } from '@/lib/utils/notifyClient'
import { parseStartParam, verifySubscribeToken } from '@/lib/utils/subscribeToken'
import { verifyOrderPin } from '@/lib/utils/orderPin'

const MAX_BOT_ATTEMPTS = 5
const BOT_BLOCK_WINDOW = 60 * 60 * 1000 // 1 hour

// ── PIN rate limiting helpers (bot uses 'tg:{chatId}' as identifier) ────────

async function botAttemptCount(chatId: number): Promise<number> {
  try {
    const since = new Date(Date.now() - BOT_BLOCK_WINDOW).toISOString()
    const { count } = await adminClient
      .from('pin_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', `tg:${chatId}`)
      .gte('created_at', since)
    return count ?? 0
  } catch { return 0 }
}

async function recordBotFailure(chatId: number): Promise<void> {
  try {
    await adminClient.from('pin_attempts').insert({ identifier: `tg:${chatId}` })
  } catch { /* ignore if table missing */ }
}

async function clearBotFailures(chatId: number): Promise<void> {
  try {
    const since = new Date(Date.now() - BOT_BLOCK_WINDOW).toISOString()
    await adminClient.from('pin_attempts').delete()
      .eq('identifier', `tg:${chatId}`)
      .gte('created_at', since)
  } catch { /* ignore */ }
}

// Marker embedded in the PIN-request message so we can parse the order code back
// from reply_to_message.text without any session storage.
const PIN_MARKER = '🔑 PIN · '    // e.g. "🔑 PIN · CH-1234"
function buildPinRequestText(orderCode: string) {
  return `${PIN_MARKER}${orderCode}\n\nВведите 6-значный PIN вашей заявки:`
}
function parsePinRequestCode(text: string): string | null {
  const m = text.match(/🔑 PIN · (CH-\d+)/)
  return m ? m[1].toUpperCase() : null
}

// ────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN!
  const update = await req.json()

  // ── Incoming message from client ────────────────────────────────────────
  if (update.message) {
    const { chat, text, reply_to_message } = update.message
    const chatId   = chat.id  as number
    const username = (chat.username ?? '').toLowerCase()
    const raw      = (text ?? '').trim()

    // ── Handle PIN reply (user replied to the bot's PIN request message) ──
    if (reply_to_message && !raw.startsWith('/')) {
      const replyText = reply_to_message.text ?? ''
      const pendingCode = parsePinRequestCode(replyText)

      if (pendingCode) {
        // Rate limit check
        const failures = await botAttemptCount(chatId)
        if (failures >= MAX_BOT_ATTEMPTS) {
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: '🚫 Слишком много неверных попыток. Попробуйте через 1 час.',
          })
          return NextResponse.json({ ok: true })
        }

        // Verify PIN
        if (!verifyOrderPin(pendingCode, raw)) {
          await recordBotFailure(chatId)
          const remaining = MAX_BOT_ATTEMPTS - failures - 1
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: `❌ Неверный PIN${remaining > 0 ? ` (осталось ${remaining} попыток)` : '. Лимит исчерпан — попробуйте через час'}.`,
            reply_markup: remaining > 0 ? { force_reply: false } : undefined,
          })
          return NextResponse.json({ ok: true })
        }

        // Correct PIN — find order and subscribe
        const { data: order, error: orderErr } = await adminClient
          .from('orders')
          .select('id, first_name, code, client_chat_id')
          .eq('code', pendingCode)
          .single()

        if (orderErr || !order) {
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: `❌ Заявка <b>${pendingCode}</b> не найдена.`,
            parse_mode: 'HTML',
          })
          return NextResponse.json({ ok: true })
        }

        await clearBotFailures(chatId)

        // Already subscribed?
        if (order.client_chat_id && String(order.client_chat_id) === String(chatId)) {
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Вы уже подписаны на уведомления по заявке <b>${order.code}</b>.`,
            parse_mode: 'HTML',
          })
          return NextResponse.json({ ok: true })
        }

        // Subscribe
        const { error: saveError } = await adminClient
          .from('orders')
          .update({ client_chat_id: chatId })
          .eq('id', order.id)

        if (saveError) {
          console.error('[webhook] Failed to save client_chat_id for order', order.code, ':', saveError.message)
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: '❌ Не удалось сохранить подписку. Пожалуйста, попробуйте чуть позже.',
          })
          return NextResponse.json({ ok: true })
        }

        console.log(`[webhook] Subscribed chat_id=${chatId} to order ${order.code} (PIN verified)`)

        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: `Привет, ${order.first_name}! 🎉\n\nВы подписались на уведомления по заявке <b>${order.code}</b>.\nКак только статус изменится — я сразу напишу вам.\n\n🔗 Отследить: https://china-orders.vercel.app/track`,
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }
    }

    // ── Handle /start ──────────────────────────────────────────────────────
    if (raw.startsWith('/start')) {
      const param = raw.slice(6).trim()

      if (!param) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: 'Привет! 👋\n\nЭтот бот отправляет уведомления об изменении статуса вашей заявки.\n\nДля подписки перейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Expected format: CH-XXXX_<16hexchars>
      const parsed = parseStartParam(param)
      if (!parsed || !verifySubscribeToken(parsed.orderCode, parsed.token)) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: '❌ Ссылка недействительна.\n\nПерейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Find order
      const { data: order, error: orderErr } = await adminClient
        .from('orders')
        .select('id, first_name, code, contact, client_chat_id')
        .eq('code', parsed.orderCode)
        .single()

      if (orderErr || !order) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: `❌ Заявка <b>${parsed.orderCode}</b> не найдена.`,
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Owner check for @username contacts
      const contact = (order.contact ?? '').trim()
      if (contact.startsWith('@')) {
        const orderUsername = contact.slice(1).toLowerCase()
        if (!username || username !== orderUsername) {
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: '🔒 Эта заявка принадлежит другому клиенту.\n\nЕсли это ваша заявка — проверьте, что вы вошли в тот Telegram-аккаунт, с которого оформляли заказ.',
          })
          return NextResponse.json({ ok: true })
        }
      }

      // Rate limit check before asking for PIN
      const failures = await botAttemptCount(chatId)
      if (failures >= MAX_BOT_ATTEMPTS) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: '🚫 Слишком много неверных попыток. Попробуйте через 1 час.',
        })
        return NextResponse.json({ ok: true })
      }

      // Ask for PIN (embed order code in message text for stateless parsing)
      await tg(token, 'sendMessage', {
        chat_id: chatId,
        text: buildPinRequestText(order.code),
        reply_markup: { force_reply: true, selective: true },
      })
      return NextResponse.json({ ok: true })
    }

    // ── Any other message ──────────────────────────────────────────────────
    const { data: subscribedOrders } = await adminClient
      .from('orders')
      .select('code, statuses(name)')
      .eq('client_chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (subscribedOrders && subscribedOrders.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = subscribedOrders.map((o: any) => {
        const statusName = Array.isArray(o.statuses) ? o.statuses[0]?.name : o.statuses?.name
        return `• <b>${o.code}</b> — ${statusName ?? '—'}`
      })
      await tg(token, 'sendMessage', {
        chat_id: chatId,
        text: `Ваши заявки:\n\n${lines.join('\n')}\n\n🔗 Отследить: https://china-orders.vercel.app/track`,
        parse_mode: 'HTML',
      })
    } else {
      await tg(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Для подписки на уведомления перейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
        parse_mode: 'HTML',
      })
    }
    return NextResponse.json({ ok: true })
  }

  // ── Callback from inline keyboard buttons ────────────────────────────────
  const cq = update.callback_query
  if (!cq) return NextResponse.json({ ok: true })

  const { id: cqId, data, message } = cq

  // Status: s|orderId|statusCode
  if (data?.startsWith('s|')) {
    const parts      = data.split('|')
    const orderId    = parts[1]
    const statusCode = parts[2]

    const { data: status } = await adminClient
      .from('statuses')
      .select('id, name')
      .eq('code', statusCode)
      .single()

    if (!status) {
      await tg(token, 'answerCallbackQuery', { callback_query_id: cqId, text: '❌ Статус не найден' })
      return NextResponse.json({ ok: true })
    }

    const { data: order, error } = await adminClient
      .from('orders')
      .update({ status_id: status.id })
      .eq('id', orderId)
      .select('contact, first_name, code, client_chat_id, manager_comment')
      .single()

    if (error) {
      await tg(token, 'answerCallbackQuery', { callback_query_id: cqId, text: '❌ Ошибка обновления' })
      return NextResponse.json({ ok: true })
    }

    await tg(token, 'answerCallbackQuery', {
      callback_query_id: cqId,
      text: `✅ Статус → ${status.name}`,
    })

    if (message) {
      await tg(token, 'editMessageReplyMarkup', {
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: `📌 Статус: ${status.name}`, callback_data: 'noop' }],
            [buildContactButton(orderId, order?.contact ?? '')],
          ],
        },
      })
    }

    notifyClientStatusChange({
      clientChatId: order.client_chat_id,
      contact: order.contact,
      firstName: order.first_name,
      orderCode: order.code,
      statusCode,
      statusName: status.name,
      managerComment: order.manager_comment,
    }).catch(console.error)

    return NextResponse.json({ ok: true })
  }

  // Contact: c|orderId
  if (data?.startsWith('c|')) {
    const orderId = data.split('|')[1]
    const { data: order } = await adminClient
      .from('orders')
      .select('contact, first_name, last_name')
      .eq('id', orderId)
      .single()

    await tg(token, 'answerCallbackQuery', {
      callback_query_id: cqId,
      text: order ? `${order.first_name} ${order.last_name}: ${order.contact}` : 'Не найдено',
      show_alert: true,
    })
    return NextResponse.json({ ok: true })
  }

  if (data === 'noop') {
    await tg(token, 'answerCallbackQuery', { callback_query_id: cqId })
  }

  return NextResponse.json({ ok: true })
}
