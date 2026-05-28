import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  '1': { bg: 'rgba(245,240,232,0.07)', text: 'rgba(245,240,232,0.5)'  },
  '2': { bg: 'rgba(234,179,8,0.15)',   text: '#fbbf24'                },
  '3': { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa'                },
  '4': { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa'                },
  '5': { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80'                },
  '6': { bg: 'rgba(239,68,68,0.15)',   text: '#f87171'                },
}

export default async function CabinetOrderPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await adminClient
    .from('orders')
    .select('*, statuses(name, color)')
    .eq('code', code.toUpperCase())
    .eq('user_id', user.id)   // security: only owner can view
    .single()

  if (!order) notFound()

  const sc = STATUS_COLORS[String(order.status_id)] ?? STATUS_COLORS['1']
  const statusLabel = order.statuses?.name ?? 'Новая'

  const items: Array<{ product_name: string; description?: string; link?: string; file_urls?: string[] }> =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ product_name: order.product_name, description: order.description, link: order.link, file_urls: order.file_urls }]

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-28 pb-20 px-4 sm:px-6"
        style={{ background: '#0f1729' }}
      >
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Back */}
          <Link href="/cabinet" className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'rgba(245,240,232,0.4)' }}>
            ← Все заявки
          </Link>

          {/* Header card */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="font-mono text-lg font-bold" style={{ color: '#8B1A2F' }}>
                    {order.code}
                  </span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>
                  Создана {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="mt-5 pt-5 grid sm:grid-cols-2 gap-3 text-sm"
              style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}>
              <div>
                <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Имя</span>
                <p className="text-milk mt-0.5">{order.first_name} {order.last_name}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Контакт</span>
                <p className="text-milk mt-0.5">{order.contact}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Тип</span>
                <p className="text-milk mt-0.5 capitalize">
                  {order.order_type === 'group' ? 'Групповой закуп' : 'Личный заказ'}
                </p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Срочность</span>
                <p className="text-milk mt-0.5">
                  {order.urgency === 'urgent' ? '⚡ Срочный' : 'Обычный'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }}
          >
            <h2 className="text-sm font-semibold text-milk">
              {items.length === 1 ? 'Товар' : `Товары (${items.length})`}
            </h2>
            {items.map((item, i) => (
              <div key={i} className="space-y-1.5">
                {items.length > 1 && (
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(245,240,232,0.3)' }}>
                    Товар {i + 1}
                  </p>
                )}
                <p className="text-sm font-medium text-milk">{item.product_name}</p>
                {item.description && (
                  <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>{item.description}</p>
                )}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer"
                    className="text-xs hover:underline truncate block"
                    style={{ color: '#8B1A2F' }}>
                    {item.link}
                  </a>
                )}
                {item.file_urls && item.file_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.file_urls.map((url, fi) => (
                      <a key={fi} href={url} target="_blank" rel="noreferrer"
                        className="text-[11px] px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: 'rgba(245,240,232,0.07)', color: 'rgba(245,240,232,0.6)' }}>
                        📎 Файл {fi + 1}
                      </a>
                    ))}
                  </div>
                )}
                {i < items.length - 1 && (
                  <div className="border-b mt-3" style={{ borderColor: 'rgba(245,240,232,0.06)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Manager comment / correspondence */}
          {order.manager_comment && (
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }}
            >
              <h2 className="text-sm font-semibold text-milk">Сообщение от менеджера</h2>
              <div
                className="flex gap-3"
              >
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: 'rgba(139,26,47,0.2)', border: '1px solid rgba(139,26,47,0.35)', color: '#8B1A2F' }}
                >
                  М
                </div>
                <div
                  className="flex-1 rounded-xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: 'rgba(139,26,47,0.08)',
                    border: '1px solid rgba(139,26,47,0.15)',
                    color: 'rgba(245,240,232,0.75)',
                  }}
                >
                  {order.manager_comment}
                </div>
              </div>
            </div>
          )}

          {/* Track link */}
          <div className="text-center pt-2">
            <Link
              href={`/track/${order.code}`}
              className="text-sm transition-colors"
              style={{ color: 'rgba(245,240,232,0.35)' }}
            >
              Публичное отслеживание →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
