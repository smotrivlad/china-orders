import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg, buildContactButton } from '@/lib/utils/telegram'
import { notifyClientStatusChange } from '@/lib/utils/notifyClient'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!
  const update = await req.json()

  // Клиент пишет боту — регистрируем chat_id по коду заявки
  if (update.message) {
    const { chat, text } = update.message
    const chatId = chat.id
    const raw = (text ?? '').trim()

    // Извлекаем код из "/start CH-1000" или просто "CH-1000"
    const match = raw.match(/CH-\d+/i)
    if (match) {
      const code = match[0].toUpperCase()
      const { data: order, error } = await adminClient
        .from('orders')
        .update({ client_chat_id: chatId })
        .eq('code', code)
        .select('first_name, code')
        .single()

      if (!error && order) {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: `Привет, ${order.first_name}! 🎉\n\nВы подписались на уведомления по заявке <b>${order.code}</b>.\n\nКак только статус изменится — я сразу напишу вам.`,
          parse_mode: 'HTML',
        })
      } else {
        await tg(token, 'sendMessage', {
          chat_id: chatId,
          text: `Заявка <b>${code}</b> не найдена. Проверьте номер и попробуйте ещё раз.`,
          parse_mode: 'HTML',
        })
      }
    } else {
      await tg(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Пришлите номер вашей заявки в формате <b>CH-1000</b>, чтобы подписаться на уведомления.',
        parse_mode: 'HTML',
      })
    }

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

    // Уведомляем клиента если подписан
    if (order?.client_chat_id) {
      notifyClientStatusChange({
        clientChatId: order.client_chat_id,
        firstName: order.first_name,
        orderCode: order.code,
        statusCode,
        statusName: status.name,
        managerComment: order.manager_comment,
      }).catch(console.error)
    }

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
