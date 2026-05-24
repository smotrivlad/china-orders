import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg, buildContactButton } from '@/lib/utils/telegram'
import { notifyClientStatusChange } from '@/lib/utils/notifyClient'
import { parseStartParam, verifySubscribeToken } from '@/lib/utils/subscribeToken'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!
  const update = await req.json()

  // ── Входящее сообщение от клиента ────────────────────────────────────────
  if (update.message) {
    const { chat, text } = update.message
    const chatId     = chat.id
    const username   = (chat.username ?? '').toLowerCase()   // @username без '@'
    const raw        = (text ?? '').trim()

    // ── Обработка /start ───────────────────────────────────────────────────
    if (raw.startsWith('/start')) {
      const param = raw.slice(6).trim()  // всё после '/start '

      if (!param) {
        // /start без параметра — приветствие
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: 'Привет! 👋\n\nЭтот бот отправляет уведомления об изменении статуса вашей заявки.\n\nДля подписки перейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Ожидаем формат CH-XXXX_<16hexchars>
      const parsed = parseStartParam(param)

      if (!parsed || !verifySubscribeToken(parsed.orderCode, parsed.token)) {
        // Ссылка недействительна или устарела
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: '❌ Ссылка недействительна.\n\nПерейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Токен верный — ищем заявку
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

      // ── Проверка владельца ─────────────────────────────────────────────
      const contact = (order.contact ?? '').trim()

      if (contact.startsWith('@')) {
        // Контакт — Telegram username: проверяем совпадение
        const orderUsername = contact.slice(1).toLowerCase()
        if (!username || username !== orderUsername) {
          await tg(token, 'sendMessage', {
            chat_id: chatId,
            text: '🔒 Эта заявка принадлежит другому клиенту.\n\nЕсли это ваша заявка — проверьте, что вы вошли в тот Telegram-аккаунт, с которого оформляли заказ.',
          })
          return NextResponse.json({ ok: true })
        }
      }
      // Для телефонных контактов: HMAC-токен уже проверен выше —
      // этого достаточно, т.к. ссылку видит только владелец заявки.

      // Уже подписан?
      if (order.client_chat_id && Number(order.client_chat_id) === chatId) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: `✅ Вы уже подписаны на уведомления по заявке <b>${order.code}</b>.`,
          parse_mode: 'HTML',
        })
        return NextResponse.json({ ok: true })
      }

      // Подписываем
      await adminClient
        .from('orders')
        .update({ client_chat_id: chatId })
        .eq('id', order.id)

      await tg(token, 'sendMessage', {
        chat_id: chatId,
        text: `Привет, ${order.first_name}! 🎉\n\nВы подписались на уведомления по заявке <b>${order.code}</b>.\nКак только статус изменится — я сразу напишу вам.\n\n🔗 Отследить: https://china-orders.vercel.app/track/${order.code}`,
        parse_mode: 'HTML',
      })
      return NextResponse.json({ ok: true })
    }

    // ── Любое другое сообщение (в т.ч. ввод кода вручную) ────────────────
    // Намеренно НЕ обрабатываем прямой ввод кода — только через защищённую ссылку
    await tg(token, 'sendMessage', {
      chat_id: chatId,
      text: 'Для подписки на уведомления перейдите на страницу вашей заявки и нажмите кнопку <b>«Подписаться на уведомления»</b>.',
      parse_mode: 'HTML',
    })
    return NextResponse.json({ ok: true })
  }

  // Callback от кнопок в уведомлении о заявке
  const cq = update.callback_query
  if (!cq) return NextResponse.json({ ok: true })

  const { id: cqId, data, message } = cq

  // Статус: s|orderId|statusCode
  if (data?.startsWith('s|')) {
    const parts = data.split('|')
    const orderId = parts[1]
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

    // Обновляем клавиатуру
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

    // Уведомляем клиента (по chat_id или @username)
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

  // Контакт: c|orderId
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
