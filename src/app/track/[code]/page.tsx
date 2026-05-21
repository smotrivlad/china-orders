import Link from 'next/link'
import Header from '@/components/layout/Header'
import Badge from '@/components/ui/Badge'
import { adminClient } from '@/lib/supabase/admin'
import type { Order, Status } from '@/types'

const ALL_STATUSES: { code: string; name: string }[] = [
  { code: 'new', name: 'Новая' },
  { code: 'in_progress', name: 'Принята в работу' },
  { code: 'searching_supplier', name: 'Ищем поставщика' },
  { code: 'supplier_found', name: 'Найден поставщик' },
  { code: 'purchase', name: 'Выкуп' },
  { code: 'shipping', name: 'Едет в Россию' },
  { code: 'ready_for_pickup', name: 'Готово к выдаче' },
  { code: 'completed', name: 'Завершена' },
]

const statusOrder: Record<string, number> = Object.fromEntries(ALL_STATUSES.map((s, i) => [s.code, i]))

export default async function TrackCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { data: order, error } = await adminClient
    .from('orders')
    .select('*, statuses(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="text-xl font-bold text-gray-900">Заявка не найдена</h1>
          <p className="mt-2 text-gray-500">Проверьте номер и попробуйте снова</p>
          <Link href="/track" className="mt-6 inline-block text-red-600 hover:underline">← Попробовать снова</Link>
        </main>
      </>
    )
  }

  const o = order as Order & { statuses: Status }
  const currentIdx = statusOrder[o.statuses.code] ?? 0

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Номер заявки</p>
            <h1 className="text-2xl font-bold font-mono text-gray-900">{o.code}</h1>
          </div>
          <Badge code={o.statuses.code} name={o.statuses.name} />
        </div>

        {/* Timeline */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Статус</h2>
          <ol className="space-y-3">
            {ALL_STATUSES.map((s, i) => {
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <li key={s.code} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                    ${active ? 'bg-red-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={`text-sm ${active ? 'font-semibold text-gray-900' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s.name}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Order details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900">Детали заявки</h2>
          <Row label="Клиент" value={`${o.first_name} ${o.last_name}`} />
          <Row label="Контакт" value={o.contact} />
          <Row label="Товар" value={o.product_name} />
          {o.description && <Row label="Описание" value={o.description} />}
          {o.link && <Row label="Ссылка" value={<a href={o.link} target="_blank" rel="noopener" className="text-red-600 hover:underline break-all">{o.link}</a>} />}
          <Row label="Срочность" value={o.urgency === 'urgent' ? '⚡ Срочно' : '🕐 Обычная'} />
          <Row label="Тип" value={o.order_type === 'group' ? '👥 Совместный' : '👤 Личный'} />
          <Row label="Дата" value={new Date(o.created_at).toLocaleDateString('ru-RU')} />
        </div>

        {o.manager_comment && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-600 mb-1">Комментарий менеджера</p>
            <p className="text-sm text-blue-900">{o.manager_comment}</p>
          </div>
        )}

        {o.file_urls && o.file_urls.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Файлы</p>
            {o.file_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-red-600 hover:underline">
                📎 Файл {i + 1}
              </a>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
