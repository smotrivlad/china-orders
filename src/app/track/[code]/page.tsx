import Link from 'next/link'
import { cookies } from 'next/headers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TrackTimeline from './TrackTimeline'
import TrackVerifyCard from './TrackVerifyCard'
import { adminClient } from '@/lib/supabase/admin'
import { buildStartParam } from '@/lib/utils/subscribeToken'
import { makeTrackAccessToken, contactType } from '@/lib/utils/trackAccess'
import type { Order, OrderItem, Status } from '@/types'

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'chinaorders_notify_bot'

export default async function TrackCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const upperCode = code.toUpperCase()

  const { data: order, error } = await adminClient
    .from('orders')
    .select('*, statuses(*)')
    .eq('code', upperCode)
    .single()

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid" />
          <div className="relative z-10 text-center px-4">
            <div className="text-5xl mb-6">🔍</div>
            <h1 className="font-display text-3xl font-bold" style={{ color: '#F5F0E8' }}>
              Заявка не найдена
            </h1>
            <p className="mt-3" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Проверьте номер и попробуйте снова
            </p>
            <Link href="/track" className="btn-outline mt-8 inline-flex">
              ← Попробовать снова
            </Link>
          </div>
        </main>
      </>
    )
  }

  const o = order as Order & { statuses: Status }

  // ── Проверка доступа: cookie с HMAC-токеном ────────────────────────────────
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(`track_${upperCode}`)?.value
  const hasAccess   = cookieToken === makeTrackAccessToken(upperCode)

  if (!hasAccess) {
    return (
      <>
        <Navbar />
        <TrackVerifyCard code={upperCode} contactType={contactType(o.contact)} />
      </>
    )
  }

  // ── Товары: items из БД или legacy-поля ────────────────────────────────────
  const items: OrderItem[] =
    o.items && o.items.length > 0
      ? o.items
      : [{ product_name: o.product_name, description: o.description, link: o.link, file_urls: o.file_urls }]

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="orb w-[400px] h-[400px] top-0 right-[-100px]"
          style={{ background: 'rgba(139,26,47,0.08)' }} />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="section-label mb-3">Отслеживание</div>
              <h1 className="font-display text-4xl font-bold" style={{ color: '#F5F0E8' }}>
                {o.code}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
                Создана {new Date(o.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <div className="glass rounded-2xl px-5 py-3 text-right shrink-0">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(245,240,232,0.4)' }}>
                Статус
              </p>
              <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>
                {o.statuses.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2 glass rounded-3xl p-7">
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-6"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                Прогресс
              </h2>
              <TrackTimeline order={o} />
            </div>

            {/* Details */}
            <div className="lg:col-span-3 space-y-4">
              {/* Subscription status */}
              {o.client_chat_id ? (
                <div className="glass rounded-3xl px-6 py-4 flex items-center gap-3"
                  style={{ borderColor: 'rgba(34,158,217,0.2)' }}>
                  <span className="text-lg">✅</span>
                  <p className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
                    Уведомления Telegram подключены
                  </p>
                </div>
              ) : (
                <div className="glass rounded-3xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,158,217,0.12)' }}>
                      <svg viewBox="0 0 24 24" fill="#229ED9" className="w-4 h-4">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.048 13.84l-2.948-.924c-.64-.203-.653-.64.136-.953l11.57-4.461c.532-.194 1.00.13.756.746z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#F5F0E8' }}>
                        Уведомления в Telegram
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
                        Подпишитесь — узнавайте о статусе первыми
                      </p>
                    </div>
                    <a
                      href={`https://t.me/${BOT_USERNAME}?start=${buildStartParam(o.code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                      style={{ background: '#229ED9' }}
                    >
                      Подписаться
                    </a>
                  </div>
                </div>
              )}

              {o.manager_comment && (
                <div className="glass rounded-3xl p-6"
                  style={{ borderColor: 'rgba(139,26,47,0.25)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: 'rgba(139,26,47,0.8)' }}>
                    Комментарий менеджера
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.8)' }}>
                    {o.manager_comment}
                  </p>
                </div>
              )}

              <div className="glass rounded-3xl p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: 'rgba(245,240,232,0.4)' }}>
                  Детали заявки
                </h2>
                <div className="space-y-3">
                  <Row label="Клиент"    value={`${o.first_name} ${o.last_name}`} />
                  <Row label="Контакт"   value={o.contact} />
                  <Row label="Срочность" value={o.urgency === 'urgent' ? '⚡ Срочная' : '🕐 Обычная'} />
                  <Row label="Тип"       value={o.order_type === 'group' ? '👥 Совместный' : '👤 Личный'} />
                </div>
              </div>

              {/* Товары */}
              <div className="glass rounded-3xl p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: 'rgba(245,240,232,0.4)' }}>
                  {items.length === 1 ? 'Товар' : `Товары · ${items.length}`}
                </h2>
                <div className="space-y-5">
                  {items.map((item, idx) => (
                    <div key={idx} className={items.length > 1 ? 'pb-5 border-b last:border-0 last:pb-0' : ''}
                      style={{ borderColor: 'rgba(245,240,232,0.06)' }}>
                      {items.length > 1 && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                          style={{ color: 'rgba(245,240,232,0.3)' }}>
                          Товар {idx + 1}
                        </p>
                      )}
                      <div className="space-y-2">
                        <Row label="Название" value={item.product_name} />
                        {item.description && <Row label="Описание" value={item.description} />}
                        {item.link && item.link !== '-' && (
                          <Row label="Ссылка" value={
                            <a href={item.link} target="_blank" rel="noopener"
                              className="break-all text-burgundy hover:text-burgundy-light transition-colors">
                              {item.link}
                            </a>
                          } />
                        )}
                        {item.file_urls && item.file_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.file_urls.map((url, fi) => (
                              <a key={fi} href={url} target="_blank" rel="noopener"
                                className="flex items-center gap-1.5 text-xs transition-colors"
                                style={{ color: 'rgba(245,240,232,0.5)' }}>
                                <span style={{ color: '#8B1A2F' }}>📎</span> Файл {fi + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <Link href="/track" className="text-sm transition-colors"
                  style={{ color: 'rgba(245,240,232,0.4)' }}>
                  ← Отследить другую заявку
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 text-xs uppercase tracking-wider leading-5 pt-0.5"
        style={{ color: 'rgba(245,240,232,0.35)' }}>
        {label}
      </span>
      <span className="text-sm flex-1" style={{ color: 'rgba(245,240,232,0.7)' }}>
        {value}
      </span>
    </div>
  )
}
