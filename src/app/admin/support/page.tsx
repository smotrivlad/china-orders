import { adminClient } from '@/lib/supabase/admin'
import SupportSessionCard from './SupportSessionCard'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams

  let query = adminClient
    .from('support_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'open')   query = query.in('status', ['open', 'pending_close'])
  if (filter === 'closed') query = query.eq('status', 'closed')

  const { data: sessions, error } = await query

  // Badge count: open + pending_close
  const { count: openCount } = await adminClient
    .from('support_sessions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['open', 'pending_close'])

  const tabs = [
    { key: undefined,  label: 'Все' },
    { key: 'open',     label: `Открытые${openCount ? ` (${openCount})` : ''}` },
    { key: 'closed',   label: 'Закрытые' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Поддержка</h1>
          {openCount ? (
            <p className="text-sm text-red-600 mt-0.5 font-medium">{openCount} активных диалогов</p>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">Нет активных диалогов</p>
          )}
        </div>
      </div>

      {/* Tabs */}
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

      {/* Error: tables don't exist yet */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700 font-medium">Таблицы не найдены</p>
          <p className="text-xs text-red-600 mt-1">
            Примените миграцию <code>012_redesign_support.sql</code> в Supabase Dashboard → SQL Editor
          </p>
        </div>
      ) : !sessions?.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Диалогов нет
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <SupportSessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}
