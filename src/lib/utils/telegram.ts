import type { Order } from '@/types'

const isImage = (url: string) => /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url)

async function tg(token: string, method: string, body: object) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function sendFiles(token: string, chatId: string, fileUrls: string[]) {
  if (!fileUrls.length) return

  const photos = fileUrls.filter(isImage)
  const docs = fileUrls.filter((u) => !isImage(u))

  // Фото: альбом или одиночное
  if (photos.length === 1) {
    await tg(token, 'sendPhoto', { chat_id: chatId, photo: photos[0] })
  } else if (photos.length > 1) {
    await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: photos.map((url) => ({ type: 'photo', media: url })),
    })
  }

  // Документы: альбом или одиночный
  if (docs.length === 1) {
    await tg(token, 'sendDocument', { chat_id: chatId, document: docs[0] })
  } else if (docs.length > 1) {
    await tg(token, 'sendMediaGroup', {
      chat_id: chatId,
      media: docs.map((url) => ({ type: 'document', media: url })),
    })
  }
}

export async function notifyNewOrder(order: Order) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const lines = [
    `🆕 <b>Новая заявка ${order.code}</b>`,
    '',
    `👤 ${order.first_name} ${order.last_name}`,
    `📞 ${order.contact}`,
    '',
    `📦 <b>Товар:</b> ${order.product_name}`,
    order.description ? `📝 <b>Описание:</b> ${order.description}` : null,
    order.link ? `🔗 <b>Ссылка:</b> ${order.link}` : null,
    '',
    order.urgency === 'urgent' ? '⚡ Срочный заказ' : '🕐 Обычная срочность',
    order.order_type === 'group' ? '👥 Совместный заказ' : '👤 Личный заказ',
  ]
    .filter((l) => l !== null)
    .join('\n')

  await tg(token, 'sendMessage', { chat_id: chatId, text: lines, parse_mode: 'HTML' })

  if (order.file_urls?.length) {
    await sendFiles(token, chatId, order.file_urls)
  }
}
