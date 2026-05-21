import type { Order } from '@/types'

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
    order.file_urls?.length ? `📎 Файлов: ${order.file_urls.length}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'HTML' }),
  })
}
