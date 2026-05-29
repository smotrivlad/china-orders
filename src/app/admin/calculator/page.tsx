import { adminClient } from '@/lib/supabase/admin'
import CalcRequestsClient from './CalcRequestsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Расчёты калькулятора — Админ' }

export default async function AdminCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams

  // Stats
  const now      = new Date()
  const weekAgo  = new Date(now.getTime() - 7  * 86400_000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86400_000).toISOString()

  const [weekRes, monthRes, allRes] = await Promise.all([
    adminClient.from('calculator_requests').select('id, total_max, converted_to_order', { count: 'exact' }).gte('created_at', weekAgo),
    adminClient.from('calculator_requests').select('id, total_max, converted_to_order', { count: 'exact' }).gte('created_at', monthAgo),
    adminClient.from('calculator_requests').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const weekRows  = weekRes.data  ?? []
  const monthRows = monthRes.data ?? []
  const allRows   = allRes.data   ?? []

  const weekCount  = weekRes.count  ?? 0
  const monthCount = monthRes.count ?? 0

  const monthConverted    = monthRows.filter(r => r.converted_to_order).length
  const conversionRate    = monthCount > 0 ? Math.round((monthConverted / monthCount) * 100) : 0
  const monthWithTotal    = monthRows.filter(r => r.total_max && r.total_max > 0)
  const avgTotal          = monthWithTotal.length > 0
    ? Math.round(monthWithTotal.reduce((s, r) => s + Number(r.total_max), 0) / monthWithTotal.length)
    : 0

  // Filter
  const filtered = filter === 'converted'
    ? allRows.filter(r => r.converted_to_order)
    : filter === 'not_converted'
      ? allRows.filter(r => !r.converted_to_order)
      : allRows

  const stats = { weekCount, monthCount, conversionRate, avgTotal }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Расчёты калькулятора</h1>
        <p className="text-sm text-gray-500 mt-1">История всех расчётов стоимости доставки</p>
      </div>
      <CalcRequestsClient rows={filtered} stats={stats} currentFilter={filter} />
    </div>
  )
}
