import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { tg, buildContactButton } from '@/lib/utils/telegram'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!
  const update = await req.json()
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
      .select('contact')
      .single()

    if (error) {
      await tg(token, 'answerCallbackQuery', { callback_query_id: cqId, text: '❌ Ошибка обновления' })
      return NextResponse.json({ ok: true })
    }

    await tg(token, 'answerCallbackQuery', {
      callback_query_id: cqId,
      text: `✅ Статус → ${status.name}`,
    })

    // Обновляем клавиатуру: убираем нажатые кнопки, показываем новый статус
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

  // noop — игнорируем
  if (data === 'noop') {
    await tg(token, 'answerCallbackQuery', { callback_query_id: cqId })
  }

  return NextResponse.json({ ok: true })
}
