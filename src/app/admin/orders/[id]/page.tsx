import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Order, Status } from '@/types'
import OrderEditor from './OrderEditor'

export const dynamic = 'force-dynamic'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: order }, { data: statuses }] = await Promise.all([
    adminClient.from('orders').select('*, statuses(*)').eq('id', id).single(),
    adminClient.from('statuses').select('*').order('sort_order'),
  ])

  if (!order) notFound()

  const o = order as Order & { statuses: Status }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-800">← Все заявки</a>
        <h1 className="mt-2 text-2xl font-bold font-mono text-gray-900">{o.code}</h1>
      </div>

      {/* Инфо о заявке */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 mb-4">Данные заявки</h2>
        <Row label="Клиент" value={`${o.first_name} ${o.last_name}`} />
        <Row label="Контакт" value={o.contact} />
        <Row label="Товар" value={o.product_name} />
        {o.description && <Row label="Описание" value={o.description} />}
        {o.link && (
          <Row label="Ссылка" value={
            <a href={o.link} target="_blank" rel="noopener" className="text-red-600 hover:underline break-all">{o.link}</a>
          } />
        )}
        <Row label="Срочность" value={o.urgency === 'urgent' ? '⚡ Срочно' : '🕐 Обычная'} />
        <Row label="Тип" value={o.order_type === 'group' ? '👥 Совместный' : '👤 Личный'} />
        <Row label="Дата" value={new Date(o.created_at).toLocaleString('ru-RU')} />
        {o.file_urls && o.file_urls.length > 0 && (
          <div className="pt-2 space-y-1">
            <span className="text-sm text-gray-500">Файлы</span>
            <div className="flex flex-wrap gap-3 mt-1">
              {o.file_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener"
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-red-600 hover:bg-gray-50">
                  📎 Файл {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
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
