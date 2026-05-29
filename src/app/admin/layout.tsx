import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Active support sessions count for the nav badge
  let newSupportCount = 0
  try {
    const { count } = await adminClient
      .from('support_sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'pending_close'])
    newSupportCount = count ?? 0
  } catch {
    // Table might not exist yet
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <span className="text-xl">🇨🇳</span>
              <span className="font-bold text-gray-900">Админ-панель</span>
            </Link>
            <Link href="/admin/orders"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Заявки
            </Link>
            <Link href="/admin/support"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Поддержка
              {newSupportCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#dc2626' }}>
                  {newSupportCount > 9 ? '9+' : newSupportCount}
                </span>
              )}
            </Link>
            <Link href="/admin/reviews"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Отзывы
            </Link>
            <Link href="/admin/tariffs"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Тарифы
            </Link>
            <Link href="/admin/calculator"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Калькулятор
            </Link>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
