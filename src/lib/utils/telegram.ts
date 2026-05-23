import type { Order, OrderItem } from '@/types'

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
 */
async function sendFilesByUrl(token: string, chatId: string, fileUrls: string[]) {
  if (!fileUrls.length) return

  const photos = fileUrls.filter(isImageUrl)
  const docs   = fileUrls.filter(u => !isImageUrl(u))

  if (photos.length === 1) {
    const res = await tg(token, 'sendPhoto', { chat_id: chatId, photo: photos[0] })
    if (!res.ok) console.error('sendPhoto failed:', JSON.stringify(await res.json().catch(() => ({}))))
  } else if (photos.length > 1) {
    const res = await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: photos.map(url => ({ type: 'photo', media: url })),
    })
    if (!res.ok) console.error('sendMediaGroup photos failed:', JSON.stringify(await res.json().catch(() => ({}))))
  }

  if (docs.length === 1) {
    const res = await tg(token, 'sendDocument', { chat_id: chatId, document: docs[0] })
    if (!res.ok) console.error('sendDocument failed:', JSON.stringify(await res.json().catch(() => ({}))))
  } else if (docs.length > 1) {
    const res = await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: docs.map(url => ({ type: 'document', media: url })),
    })
    if (!res.ok) console.error('sendMediaGroup docs failed:', JSON.stringify(await res.json().catch(() => ({}))))
  }
}

export function buildContactButton(orderId: string, contact: string) {
  const c = contact.trim()
  if (c.startsWith('@')) {
    return { text: '💬 Написать клиенту', url: `https://t.me/${c.slice(1)}` }
  }
  return { text: '💬 Контакт клиента', callback_data: `c|${orderId}` }
}

/**
 * Уведомление менеджеру о новой заявке.
 *
 * @param order   — объект заявки из БД
 * @param items   — товары (переданные явно из API, т.к. в БД может не быть колонки items)
 */
export async function notifyNewOrder(order: Order, items?: OrderItem[]) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  // Берём товары из аргумента, иначе из order.items, иначе строим из legacy-полей
  const effectiveItems: OrderItem[] =
    items?.length
      ? items
      : order.items?.length
        ? order.items
        : [{ product_name: order.product_name, description: order.description, link: order.link, file_urls: order.file_urls }]

  // Строки с товарами
  const itemLines: string[] = []
  if (effectiveItems.length === 1) {
    const it = effectiveItems[0]
    itemLines.push(`📦 <b>Товар:</b> ${it.product_name}`)
    if (it.description) itemLines.push(`📝 <b>Описание:</b> ${it.description}`)
    if (it.link)        itemLines.push(`🔗 <b>Ссылка:</b> ${it.link}`)
  } else {
    itemLines.push(`📦 <b>Товары (${effectiveItems.length}):</b>`)
    itemLines.push('')
    effectiveItems.forEach((it, i) => {
      itemLines.push(`<b>${i + 1}. ${it.product_name}</b>`)
      if (it.description) itemLines.push(`   📝 ${it.description}`)
      if (it.link)        itemLines.push(`   🔗 ${it.link}`)
    })
  }

  // Все файлы из всех товаров
  const allFileUrls = effectiveItems.flatMap(it => it.file_urls ?? [])
  const fileCount   = allFileUrls.length

  const lines = [
    `🆕 <b>Новая заявка ${order.code}</b>`,
    '',
    `👤 ${order.first_name} ${order.last_name}`,
    `📞 ${order.contact}`,
    '',
    ...itemLines,
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

  if (fileCount > 0) {
    await sendFilesByUrl(token, chatId, allFileUrls)
  }
}
