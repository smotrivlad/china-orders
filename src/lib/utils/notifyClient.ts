import { tg } from './telegram'

const FRIENDLY: Record<string, string> = {
  new:                '🆕 Новая',
  in_progress:        '⚙️ Принята в работу',
  searching_supplier: '🔍 Ищем поставщика',
  supplier_found:     '✅ Найден поставщик',
  purchase:           '💳 Выкуп',
  shipping:           '🚚 Едет в Россию',
  ready_for_pickup:   '📦 Готово к выдаче',
  completed:          '🎉 Завершена',
}

/**
 * Отправляет клиенту уведомление о смене статуса.
 *
 * Приоритет:
 * 1. client_chat_id — клиент ранее написал боту (надёжно)
 * 2. contact начинается с '@' — пробуем отправить по username.
 *    Работает только если пользователь уже писал боту хотя бы раз.
 */
export async function notifyClientStatusChange({
  clientChatId,
  contact,
  firstName,
  orderCode,
  statusCode,
  statusName,
  managerComment,
}: {
  clientChatId?: bigint | number | null
  contact?: string | null
  firstName: string
  orderCode: string
  statusCode: string
  statusName: string
  managerComment?: string | null
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  // Определяем получателя
  let chatId: number | string | null = null
  if (clientChatId) {
    chatId = Number(clientChatId)
  } else if (contact && contact.trim().startsWith('@')) {
    chatId = contact.trim() // '@username'
  }

  if (!chatId) {
    console.log(`[notify] no chat target for order ${orderCode}, contact=${contact ?? 'none'}`)
    return
  }

  const statusLabel = FRIENDLY[statusCode] ?? statusName

  const lines = [
    `Привет, ${firstName}! 👋`,
    '',
    `Статус вашей заявки <b>${orderCode}</b> изменён на:`,
    `${statusLabel}`,
  ]

  if (managerComment) {
    lines.push('', `💬 <i>${managerComment}</i>`)
  }

  lines.push('', `🔗 Отследить: https://china-orders.vercel.app/track/${orderCode}`)

  const text = lines.join('\n')

  try {
    const res = await tg(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`[notify] sendMessage failed for ${chatId}:`, JSON.stringify(err))
    } else {
      console.log(`[notify] sent status update to ${chatId} for order ${orderCode}`)
    }
  } catch (e) {
    console.error(`[notify] error sending to ${chatId}:`, e)
  }
}
