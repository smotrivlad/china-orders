import type { Order } from '@/types'

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url)

export async function tg(token: string, method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Отправляет файлы в Telegram по публичным URL Supabase Storage.
 * Бакет orders-files должен быть public=true (проверено).
 * Каждый файл отправляется отдельным сообщением: фото → sendPhoto, остальное → sendDocument.
 */
async function sendFilesByUrl(token: string, chatId: string, fileUrls: string[]) {
  if (!fileUrls.length) return

  const photos = fileUrls.filter(isImageUrl)
  const docs   = fileUrls.filter(u => !isImageUrl(u))

  // Фото — одним альбомом если их несколько, иначе по одному
  if (photos.length === 1) {
    const res = await tg(token, 'sendPhoto', { chat_id: chatId, photo: photos[0] })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('sendPhoto failed:', JSON.stringify(err))
    }
  } else if (photos.length > 1) {
    const res = await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: photos.map(url => ({ type: 'photo', media: url })),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('sendMediaGroup photos failed:', JSON.stringify(err))
    }
  }

  // Документы
  if (docs.length === 1) {
    const res = await tg(token, 'sendDocument', { chat_id: chatId, document: docs[0] })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('sendDocument failed:', JSON.stringify(err))
    }
  } else if (docs.length > 1) {
    const res = await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: docs.map(url => ({ type: 'document', media: url })),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('sendMediaGroup docs failed:', JSON.stringify(err))
    }
  }
}

export function buildContactButton(orderId: string, contact: string) {
  const c = contact.trim()
  if (c.startsWith('@')) {
    return { text: '💬 Написать клиенту', url: `https://t.me/${c.slice(1)}` }
  }
  return { text: '💬 Контакт клиента', callback_data: `c|${orderId}` }
}

export async function notifyNewOrder(order: Order) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const fileCount = order.file_urls?.length ?? 0

  const lines = [
    `🆕 <b>Новая заявка ${order.code}</b>`,
    '',
    `👤 ${order.first_name} ${order.last_name}`,
    `📞 ${order.contact}`,
    '',
    `📦 <b>Товар:</b> ${order.product_name}`,
    order.description ? `📝 <b>Описание:</b> ${order.description}` : null,
    order.link        ? `🔗 <b>Ссылка:</b> ${order.link}`          : null,
    '',
    order.urgency    === 'urgent' ? '⚡ Срочный заказ'    : '🕐 Обычная срочность',
    order.order_type === 'group'  ? '👥 Совместный заказ' : '👤 Личный заказ',
    fileCount > 0 ? `📎 Прикреплено файлов: ${fileCount}` : null,
  ]
    .filter(l => l !== null)
    .join('\n')

  await tg(token, 'sendMessage', {
    chat_id: chatId,
    text: lines,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Принять в работу', callback_data: `s|${order.id}|in_progress`        },
          { text: '🔍 Ищем поставщика',  callback_data: `s|${order.id}|searching_supplier` },
        ],
        [buildContactButton(order.id, order.contact)],
      ],
    },
  })

  // Отправляем файлы по публичным URL из Supabase Storage
  if (fileCount > 0) {
    await sendFilesByUrl(token, chatId, order.file_urls!)
  }
}
