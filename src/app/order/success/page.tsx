import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { buildStartParam } from '@/lib/utils/subscribeToken'
import { generateOrderPin } from '@/lib/utils/orderPin'

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'chinaorders_notify_bot'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const pin = code ? generateOrderPin(code) : null

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="orb w-[400px] h-[400px] top-0 right-[-100px]"
          style={{ background: 'rgba(139,26,47,0.08)' }} />

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 text-center">
          {/* Success icon */}
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full"
            style={{ background: 'rgba(139,26,47,0.15)', border: '1px solid rgba(139,26,47,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9"
              stroke="#8B1A2F" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-display text-4xl font-bold" style={{ color: '#F5F0E8' }}>
            Заявка принята!
          </h1>

          {/* Code + PIN — primary CTA block */}
          {code && pin && (
            <div className="mt-6 glass rounded-2xl px-8 py-6"
              style={{ borderColor: 'rgba(139,26,47,0.3)' }}>
              <p className="text-xs uppercase tracking-widest mb-5"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                📋 Сохраните оба кода для отслеживания
              </p>

              <div className="flex items-center justify-center gap-8 flex-wrap">
                {/* Order code */}
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'rgba(245,240,232,0.35)' }}>
                    Код заявки
                  </p>
                  <p className="font-mono font-bold text-3xl" style={{ color: '#F5F0E8' }}>
                    {code}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-px h-12 hidden sm:block"
                  style={{ background: 'rgba(245,240,232,0.08)' }} />

                {/* PIN */}
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'rgba(245,240,232,0.35)' }}>
                    PIN
                  </p>
                  <p className="font-mono font-bold text-3xl tracking-[0.25em]"
                    style={{ color: '#8B1A2F' }}>
                    {pin}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>
                Оба кода нужны для просмотра заявки на сайте
              </p>
            </div>
          )}

          <p className="mt-6 text-base leading-relaxed max-w-sm mx-auto"
            style={{ color: 'rgba(245,240,232,0.5)' }}>
            Свяжемся с вами в течение 30 минут.
          </p>

          {/* Telegram subscription */}
          {code && (
            <div className="mt-8 glass rounded-2xl p-6 text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(34,158,217,0.15)' }}>
                  <svg viewBox="0 0 24 24" fill="#229ED9" className="w-5 h-5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.048 13.84l-2.948-.924c-.64-.203-.653-.64.136-.953l11.57-4.461c.532-.194 1.00.13.756.746z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>
                    Уведомления в Telegram
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'rgba(245,240,232,0.5)' }}>
                    Подпишитесь на бота — как только статус изменится, вы сразу узнаете.
                  </p>
                  <a
                    href={`https://t.me/${BOT_USERNAME}?start=${buildStartParam(code)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
                    style={{ background: '#229ED9' }}
                  >
                    Подписаться на уведомления
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/track" className="btn-primary">
              Отследить заявку →
            </Link>
            <Link href="/order" className="btn-outline">
              Ещё одна заявка
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
