import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import Badge from '@/components/ui/Badge'
import type { Order, Status } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  let query = adminClient
    .from('orders')
    .select('*, statuses(*)')
    .order('created_at', { ascending: false })

  if (status) {
    const { data: st } = await adminClient.from('statuses').select('id').eq('code', status).single()
    if (st) query = query.eq('status_id', st.id)
  }

  const { data: orders } = await query
  const { data: statuses } = await adminClient.from('statuses').select('*').order('sort_order')

  const urgencyLabel: Record<string, string> = { normal: 'Обычная', urgent: '⚡ Срочно' }
  const typeLabel: Record<string, string> = { personal: 'Личный', group: 'Совместный' }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>
        <span className="text-sm text-gray-500">{orders?.length ?? 0} шт.</span>
      </div>

      {/* Фильтр по статусу */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${!status ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          Все
        </Link>
        {statuses?.map((s) => (
          <Link
            key={s.code}
            href={`/admin/orders?status=${s.code}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${status === s.code ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {!orders?.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Заявок нет
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Код', 'Клиент', 'Товар', 'Срочность', 'Тип', 'Статус', 'Дата', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(orders as (Order & { statuses: Status })[]).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{o.code}</td>
                  <td className="px-4 py-3 text-gray-900">{o.first_name} {o.last_name}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{o.product_name}</td>
                  <td className="px-4 py-3 text-gray-600">{urgencyLabel[o.urgency]}</td>
                  <td className="px-4 py-3 text-gray-600">{typeLabel[o.order_type]}</td>
                  <td className="px-4 py-3"><Badge code={o.statuses.code} name={o.statuses.name} /></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-red-600 hover:text-red-700 font-medium">
                      Открыть →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
