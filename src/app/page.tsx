import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WindIcon from '@/components/ui/WindIcon'

const SERVICES = [
  {
    icon: '📦',
    title: 'Личные заказы',
    desc: 'Найдём и выкупим любой товар — одежда, электроника, аксессуары. Доставим прямо до двери.',
  },
  {
    icon: '🤝',
    title: 'Совместные закупки',
    desc: 'Объединяем заказы для снижения стоимости доставки. Выгодно для небольших партий.',
  },
  {
    icon: '⚡',
    title: 'Срочная доставка',
    desc: 'Экспресс-маршрут из Китая за 15–20 дней. Подходит для товаров с дедлайном.',
  },
  {
    icon: '🛃',
    title: 'Таможенное оформление',
    desc: 'Берём на себя все вопросы с таможней. Сертификация и декларирование под ключ.',
  },
]

const STEPS = [
  { num: '01', title: 'Оставьте заявку', desc: 'Заполните форму — опишите товар, прикрепите ссылку или фото.' },
  { num: '02', title: 'Ищем поставщика', desc: 'Находим надёжного поставщика и согласовываем условия.' },
  { num: '03', title: 'Выкуп и отправка', desc: 'Оплачиваем товар и отправляем с нашего склада в России.' },
  { num: '04', title: 'Получаете товар', desc: 'Забираете заказ. Вы отслеживаете каждый шаг в реальном времени.' },
]

const STATS = [
  { val: '500+', label: 'Выполненных заказов' },
  { val: '25–40', label: 'Дней доставки' },
  { val: '100%', label: 'Прозрачность' },
  { val: '3 года', label: 'На рынке' },
]

/* Radiating thin lines around the wind logo */
function RadiatingBurst() {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ width: 200, height: 160, left: -30, top: -48, zIndex: 0 }}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i * 20 * Math.PI) / 180
        const cx = 100
        const cy = 80
        return (
          <line
            key={i}
            x1={cx + 28 * Math.cos(angle)}
            y1={cy + 28 * Math.sin(angle)}
            x2={cx + 90 * Math.cos(angle)}
            y2={cy + 90 * Math.sin(angle)}
            stroke="#8B1A2F"
            strokeWidth="0.6"
            strokeOpacity="0.22"
          />
        )
      })}
      <ellipse cx="100" cy="80" rx="54" ry="40" stroke="#8B1A2F" strokeWidth="0.5" strokeOpacity="0.15" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-100" />
        {/* Burgundy orbs */}
        <div
          className="orb w-[700px] h-[700px] top-[-250px] right-[-180px]"
          style={{ background: 'rgba(139,26,47,0.07)' }}
        />
        <div
          className="orb w-[450px] h-[450px] bottom-[-120px] left-[-120px]"
          style={{ background: 'rgba(139,26,47,0.05)' }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full py-20">
          <div className="flex flex-col items-center text-center">

            {/* Label */}
            <div className="section-label justify-center mb-6">Прямые поставки из Китая</div>

            {/* ── Brand name  +  Wind logo (справа от названия) ── */}
            <div className="flex items-end justify-center gap-5 sm:gap-8 mb-6 flex-wrap">
              <h1 className="font-display leading-[1.04] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}>
                <span style={{ color: '#F5F0E8' }}>EAST</span>
                <span style={{ color: '#8B1A2F' }}>WIND</span>
                <br />
                <span
                  className="font-bold tracking-widest"
                  style={{ color: 'rgba(245,240,232,0.6)', fontSize: '0.52em', letterSpacing: '0.28em' }}
                >
                  LOGISTIC
                </span>
              </h1>

              {/* Wind icon with glow + radiating burst */}
              <div className="relative flex-shrink-0 mb-2">
                {/* Radial glow backdrop */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 180,
                    height: 145,
                    left: -25,
                    top: -32,
                    background: 'radial-gradient(ellipse, rgba(139,26,47,0.22) 0%, transparent 68%)',
                  }}
                />
                {/* Radiating thin lines */}
                <RadiatingBurst />
                {/* The logo SVG */}
                <WindIcon
                  size={96}
                  className="relative z-10 logo-glow-lg"
                  style={{ color: '#8B1A2F' }}
                />
              </div>
            </div>

            <p className="text-milk/50 leading-relaxed max-w-xl mb-8" style={{ fontSize: '1.05rem' }}>
              Надёжная доставка товаров из Китая для бизнеса и частных лиц.
              Отслеживание в реальном времени — вы знаете, где ваш груз.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-14">
              <Link href="/order" className="btn-primary">
                Оформить заявку →
              </Link>
              <Link href="/track" className="btn-outline">
                Отследить посылку
              </Link>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-16 pt-10 w-full max-w-2xl"
              style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}
            >
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-2xl text-milk">{s.val}</div>
                  <div className="text-xs mt-1 leading-snug" style={{ color: 'rgba(245,240,232,0.38)' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Что мы делаем</div>
            <h2 className="font-display text-4xl sm:text-5xl text-milk">Наши услуги</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 transition-colors"
                  style={{ background: 'rgba(139,26,47,0.13)' }}
                >
                  {s.icon}
                </div>
                <h3 className="font-semibold text-milk mb-2 text-sm tracking-wide uppercase" style={{ letterSpacing: '0.06em' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.42)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="process" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Процесс</div>
            <h2 className="font-display text-4xl sm:text-5xl text-milk">Как мы работаем</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div
              className="hidden lg:block absolute top-[38px] left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,47,0.25), transparent)' }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="relative text-center lg:text-left">
                  <div
                    className="inline-flex items-center justify-center w-[76px] h-[76px] rounded-full mb-5 lg:mx-0 mx-auto"
                    style={{
                      border: '1px solid rgba(139,26,47,0.3)',
                      background: 'rgba(139,26,47,0.08)',
                    }}
                  >
                    <span
                      className="font-display text-lg font-bold"
                      style={{ color: '#8B1A2F' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-milk mb-2 tracking-wide text-sm" style={{ letterSpacing: '0.05em' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.42)' }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 mx-4 sm:mx-6">
        <div className="mx-auto max-w-4xl rounded-3xl overflow-hidden relative">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #8B1A2F 0%, #6B1424 60%, #111C33 100%)' }}
          />
          <div className="absolute inset-0 bg-grid opacity-10" />
          {/* Decorative wind icon bottom-right */}
          <div className="absolute bottom-[-20px] right-[-20px] opacity-10 pointer-events-none">
            <WindIcon size={160} style={{ color: '#F5F0E8' }} />
          </div>
          <div className="relative z-10 px-8 py-16 text-center">
            <h2 className="font-display text-4xl sm:text-5xl text-milk mb-4">
              Готовы сделать заказ?
            </h2>
            <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.65)' }}>
              Оставьте заявку — мы свяжемся в течение 30 минут и уточним все детали.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/order"
                className="btn-outline"
                style={{ borderColor: 'rgba(245,240,232,0.35)' }}
              >
                Оформить заявку →
              </Link>
              <Link
                href="/track"
                className="btn-outline"
                style={{ borderColor: 'rgba(245,240,232,0.15)', color: 'rgba(245,240,232,0.65)' }}
              >
                Отследить заявку
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
