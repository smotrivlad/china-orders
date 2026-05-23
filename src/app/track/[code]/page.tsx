import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TrackTimeline from './TrackTimeline'
import { adminClient } from '@/lib/supabase/admin'
import type { Order, Status } from '@/types'

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
                  <Row label="Товар"     value={o.product_name} />
                  {o.description && <Row label="Описание" value={o.description} />}
                  {o.link && (
                    <Row label="Ссылка" value={
                      <a href={o.link} target="_blank" rel="noopener"
                        className="break-all transition-colors"
                        style={{ color: '#8B1A2F' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#A52238')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#8B1A2F')}>
                        {o.link}
                      </a>
                    } />
                  )}
                  <Row label="Срочность" value={o.urgency === 'urgent' ? '⚡ Срочная' : '🕐 Обычная'} />
                  <Row label="Тип"       value={o.order_type === 'group' ? '👥 Совместный' : '👤 Личный'} />
                </div>
              </div>

              {o.file_urls && o.file_urls.length > 0 && (
                <div className="glass rounded-3xl p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-4"
                    style={{ color: 'rgba(245,240,232,0.4)' }}>
                    Файлы
                  </h2>
                  <div className="space-y-2">
                    {o.file_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener"
                        className="flex items-center gap-2 text-sm transition-colors"
                        style={{ color: 'rgba(245,240,232,0.55)' }}>
                        <span style={{ color: '#8B1A2F' }}>📎</span> Файл {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

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
