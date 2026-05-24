import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Order, OrderItem, Status } from '@/types'
import OrderEditor from './OrderEditor'
import { generateOrderPin } from '@/lib/utils/orderPin'

export const dynamic = 'force-dynamic'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: order }, { data: statuses }] = await Promise.all([
    adminClient.from('orders').select('*, statuses(*)').eq('id', id).single(),
    adminClient.from('statuses').select('*').order('sort_order'),
  ])

  if (!order) notFound()

  const o = order as Order & { statuses: Status }
  const pin = generateOrderPin(o.code)

  // Товары: если есть поле items — используем его, иначе собираем из legacy-полей
  const items: OrderItem[] =
    o.items && o.items.length > 0
      ? o.items
      : [{ product_name: o.product_name, description: o.description, link: o.link, file_urls: o.file_urls }]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-800">← Все заявки</a>
        <h1 className="mt-2 text-2xl font-bold font-mono text-gray-900">{o.code}</h1>
      </div>

      {/* Инфо о заявке */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 mb-4">Данные заявки</h2>
        <Row label="Клиент"   value={`${o.first_name} ${o.last_name}`} />
        <Row label="Контакт"  value={o.contact} />
        <Row label="Срочность" value={o.urgency === 'urgent' ? '⚡ Срочно' : '🕐 Обычная'} />
        <Row label="Тип"      value={o.order_type === 'group' ? '👥 Совместный' : '👤 Личный'} />
        <Row label="Дата"     value={new Date(o.created_at).toLocaleString('ru-RU')} />
        <Row label="PIN"      value={
          <span className="font-mono font-semibold tracking-widest text-red-700">{pin}</span>
        } />
      </div>

      {/* Товары */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          {items.length === 1 ? 'Товар' : `Товары (${items.length})`}
        </h2>
        <div className="space-y-5">
          {items.map((item, idx) => (
            <div key={idx} className={items.length > 1 ? 'pb-5 border-b border-gray-100 last:border-0 last:pb-0' : ''}>
              {items.length > 1 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Товар {idx + 1}
                </p>
              )}
              <div className="space-y-2">
                <Row label="Название" value={item.product_name} />
                {item.description && <Row label="Описание" value={item.description} />}
                {item.link && (
                  <Row label="Ссылка" value={
                    <a href={item.link} target="_blank" rel="noopener"
                      className="text-red-600 hover:underline break-all">
                      {item.link}
                    </a>
                  } />
                )}
                {item.file_urls && item.file_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.file_urls.map((url, fi) => (
                      <a key={fi} href={url} target="_blank" rel="noopener"
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50">
                        📎 Файл {fi + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Редактор статуса */}
      <OrderEditor order={o} statuses={statuses ?? []} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
