import { adminClient } from '@/lib/supabase/admin'
import SupportMessageRow from './SupportMessageRow'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams

  let query = adminClient
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'new')       query = query.eq('answered', false)
  if (filter === 'answered')  query = query.eq('answered', true)

  const { data: messages, error } = await query

  const { count: newCount } = await adminClient
    .from('support_messages')
    .select('*', { count: 'exact', head: true })
    .eq('answered', false)

  const tabs = [
    { key: undefined,    label: 'Все' },
    { key: 'new',        label: `Новые${newCount ? ` (${newCount})` : ''}` },
    { key: 'answered',   label: 'Отвеченные' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поддержка</h1>
          {newCount ? (
            <p className="text-sm text-red-600 mt-0.5 font-medium">{newCount} новых сообщений</p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">Нет новых сообщений</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {tabs.map(tab => {
          const isActive = filter === tab.key || (!filter && !tab.key)
          const href = tab.key ? `/admin/support?filter=${tab.key}` : '/admin/support'
          return (
            <a key={tab.label} href={href}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
            </a>
          )
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700 font-medium">Таблица не найдена</p>
          <p className="text-xs text-red-600 mt-1">
            Примените миграцию 010_add_support_messages.sql в Supabase Dashboard → SQL Editor
          </p>
        </div>
      ) : !messages?.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Сообщений нет
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <SupportMessageRow key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  )
}
