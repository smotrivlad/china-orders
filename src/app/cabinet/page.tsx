import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import ClaimOrderForm from './ClaimOrderForm'
import LogoutButton from './LogoutButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Личный кабинет — EASTWIND LOGISTIC' }

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  '1': { bg: 'rgba(245,240,232,0.07)', text: 'rgba(245,240,232,0.5)',  label: 'Новая'          },
  '2': { bg: 'rgba(234,179,8,0.15)',   text: '#fbbf24',                label: 'В обработке'    },
  '3': { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa',                label: 'Закуплен'       },
  '4': { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa',                label: 'В пути'         },
  '5': { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',                label: 'Доставлен'      },
  '6': { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',                label: 'Отменён'        },
}

interface Order {
  id: string
  code: string
  product_name: string
  status_id: number
  created_at: string
  manager_comment: string | null
  items?: Array<{ product_name: string }>
  statuses?: { name: string; color: string } | null
}

export default async function CabinetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's orders via admin client (service role), filtered by user_id
  const { data: orders } = await adminClient
    .from('orders')
    .select('id, code, product_name, status_id, created_at, manager_comment, items, statuses(name, color)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orderList = (orders ?? []) as unknown as Order[]

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-28 pb-20 px-4 sm:px-6"
        style={{ background: '#0f1729' }}
      >
        <div className="mx-auto max-w-4xl space-y-10">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="section-label mb-3">Личный кабинет</div>
              <h1 className="font-display text-3xl sm:text-4xl text-milk">Мои заявки</h1>
              <p className="text-sm mt-2" style={{ color: 'rgba(245,240,232,0.4)' }}>{user.email}</p>
            </div>
            <LogoutButton />
          </div>

          {/* Orders list */}
          {orderList.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }}
            >
              <div className="text-4xl mb-4">📦</div>
              <p className="text-milk/60 text-sm">У вас ещё нет заявок</p>
              <Link href="/order" className="btn-primary inline-flex mt-6 py-2.5 px-5 text-sm">
                Оформить заявку
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orderList.map(order => {
                const sid = String(order.status_id)
                const sc  = STATUS_COLORS[sid] ?? STATUS_COLORS['1']
                const label = order.statuses?.name ?? sc.label
                const names = order.items?.length
                  ? order.items.map(it => it.product_name).join(', ')
                  : order.product_name

                return (
                  <Link
                    key={order.id}
                    href={`/cabinet/${order.code}`}
                    className="block rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.005] group"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(245,240,232,0.07)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <span className="font-mono text-sm font-bold" style={{ color: '#8B1A2F' }}>
                            {order.code}
                          </span>
                          <span
                            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {label}
                          </span>
                          {order.manager_comment && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(139,26,47,0.15)', color: 'rgba(139,26,47,0.8)' }}>
                              Новое сообщение
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-milk/70 truncate">{names}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.3)' }}>
                          {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <span className="text-[11px] text-milk/30 group-hover:text-milk/60 transition-colors">
                          Подробнее →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* New order CTA */}
          {orderList.length > 0 && (
            <div className="text-center">
              <Link href="/order" className="btn-primary inline-flex py-2.5 px-6 text-sm">
                + Новая заявка
              </Link>
            </div>
          )}

          {/* Claim order form */}
          <ClaimOrderForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
