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

export async function notifyClientStatusChange({
  clientChatId,
  firstName,
  orderCode,
  statusCode,
  statusName,
  managerComment,
}: {
  clientChatId: bigint | number | null
  firstName: string
  orderCode: string
  statusCode: string
  statusName: string
  managerComment?: string | null
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !clientChatId) return

  const emoji = FRIENDLY[statusCode] ?? statusName

  const lines = [
    `Привет, ${firstName}! 👋`,
    '',
    `Статус вашей заявки <b>${orderCode}</b> обновился:`,
    '',
    `${emoji}`,
    '',
    managerComment ? `💬 <i>${managerComment}</i>\n` : null,
    `Следить за заявкой: china-orders.vercel.app/track/${orderCode}`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  await tg(token, 'sendMessage', {
    chat_id: Number(clientChatId),
    text: lines,
    parse_mode: 'HTML',
  })
}
