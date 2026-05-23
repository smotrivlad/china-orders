import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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
  { num: '01', title: 'Оставьте заявку',   desc: 'Заполните форму — опишите товар, прикрепите ссылку или фото.' },
  { num: '02', title: 'Ищем поставщика',   desc: 'Находим надёжного поставщика и согласовываем условия.' },
  { num: '03', title: 'Выкуп и отправка',  desc: 'Оплачиваем товар и отправляем с нашего склада в России.' },
  { num: '04', title: 'Получаете товар',   desc: 'Забираете заказ. Вы отслеживаете каждый шаг в реальном времени.' },
]

const STATS = [
  { val: '500+',  label: 'Выполненных заказов' },
  { val: '25–40', label: 'Дней доставки' },
  { val: '100%',  label: 'Прозрачность' },
  { val: '3 года', label: 'На рынке' },
]

/* Decorative wind-lines drifting in the background */
function BgWindLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 1440 900"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Large swept wind lines across the hero */}
      <path d="M-80 320 C200 290 500 310 800 340 C1000 360 1200 330 1520 310"
        stroke="rgba(245,240,232,0.04)" strokeWidth="120" strokeLinecap="round"/>
      <path d="M-80 500 C250 470 550 500 850 520 C1050 535 1280 510 1520 490"
        stroke="rgba(245,240,232,0.03)" strokeWidth="80" strokeLinecap="round"/>
      <path d="M-80 680 C220 655 520 670 820 690 C1020 703 1250 680 1520 660"
        stroke="rgba(245,240,232,0.025)" strokeWidth="60" strokeLinecap="round"/>
      {/* Thin crisp wind-streak lines */}
      <path d="M100 200 C400 185 700 200 1100 215"
        stroke="rgba(245,240,232,0.06)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M50 260 C380 248 680 260 1080 272"
        stroke="rgba(245,240,232,0.05)" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M200 740 C500 728 800 740 1200 752"
        stroke="rgba(245,240,232,0.04)" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M-40 800 C300 790 620 800 1000 810"
        stroke="rgba(245,240,232,0.035)" strokeWidth="0.6" strokeLinecap="round"/>
    </svg>
  )
}

/* Radiating thin lines from the logo center */
function LogoBurst() {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ width: 240, height: 190, left: -30, top: -55, zIndex: 0 }}
      viewBox="0 0 240 190"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i * 18 * Math.PI) / 180
        const cx = 120, cy = 95
        return (
          <line
            key={i}
            x1={cx + 32 * Math.cos(angle)}
            y1={cy + 32 * Math.sin(angle)}
            x2={cx + 108 * Math.cos(angle)}
            y2={cy + 108 * Math.sin(angle)}
            stroke="rgba(245,240,232,0.07)"
            strokeWidth="0.7"
          />
        )
      })}
      {/* Faint elliptic ring around the logo */}
      <ellipse cx="120" cy="95" rx="62" ry="50"
        stroke="rgba(245,240,232,0.06)" strokeWidth="0.8" />
      <ellipse cx="120" cy="95" rx="90" ry="72"
        stroke="rgba(245,240,232,0.03)" strokeWidth="0.6" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Grid + decorative wind lines */}
        <div className="absolute inset-0 bg-grid opacity-100" />
        <BgWindLines />
        {/* Subtle background glow blobs */}
        <div className="orb w-[600px] h-[600px] top-[-150px] right-[-150px]"
          style={{ background: 'rgba(139,26,47,0.06)' }} />
        <div className="orb w-[400px] h-[400px] bottom-[-80px] left-[-100px]"
          style={{ background: 'rgba(139,26,47,0.04)' }} />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full py-20">
          <div className="flex flex-col items-center text-center">

            <div className="section-label justify-center mb-6">Прямые поставки из Китая</div>

            {/* ── Brand name + Wind logo справа от названия ── */}
            <div className="flex items-end justify-center gap-6 sm:gap-10 mb-6 flex-wrap">
              <h1
                className="font-display leading-[1.04] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}
              >
                <span style={{ color: '#F5F0E8' }}>EAST</span>
                <span style={{ color: '#8B1A2F' }}>WIND</span>
                <br />
                <span
                  className="font-bold tracking-widest"
                  style={{ color: 'rgba(245,240,232,0.55)', fontSize: '0.50em', letterSpacing: '0.30em' }}
                >
                  LOGISTIC
                </span>
              </h1>

              {/* Logo PNG — right of name */}
              <div className="relative flex-shrink-0 mb-1">
                <LogoBurst />
                <img
                  src="/logo.png"
                  alt="EASTWIND LOGISTIC"
                  width={200}
                  height={200}
                  style={{ objectFit: 'contain', position: 'relative', zIndex: 10 }}
                />
              </div>
            </div>

            <p
              className="leading-relaxed max-w-xl mb-8"
              style={{ color: 'rgba(245,240,232,0.50)', fontSize: '1.05rem' }}
            >
              Надёжная доставка товаров из Китая для бизнеса и частных лиц.
              Отслеживание в реальном времени — вы знаете, где ваш груз.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-14">
              <Link href="/order" className="btn-primary">Оформить заявку →</Link>
              <Link href="/track" className="btn-outline">Отследить посылку</Link>
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
                className="glass rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: 'rgba(139,26,47,0.13)' }}
                >
                  {s.icon}
                </div>
                <h3 className="font-semibold text-milk mb-2 text-sm tracking-wide uppercase"
                  style={{ letterSpacing: '0.06em' }}>
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
            <div
              className="hidden lg:block absolute top-[38px] left-[12.5%] right-[12.5%] h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(139,26,47,0.25), transparent)' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="relative text-center lg:text-left">
                  <div
                    className="inline-flex items-center justify-center w-[76px] h-[76px] rounded-full mb-5 lg:mx-0 mx-auto"
                    style={{ border: '1px solid rgba(139,26,47,0.3)', background: 'rgba(139,26,47,0.08)' }}
                  >
                    <span className="font-display text-lg font-bold" style={{ color: '#8B1A2F' }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-milk mb-2 tracking-wide text-sm"
                    style={{ letterSpacing: '0.05em' }}>
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
          {/* Decorative logo watermark */}
          <div className="absolute bottom-[-24px] right-[-16px] pointer-events-none opacity-[0.08]">
            <img src="/logo.png" alt="" width={180} height={180} style={{ objectFit: 'contain' }} />
          </div>
          <div className="relative z-10 px-8 py-16 text-center">
            <h2 className="font-display text-4xl sm:text-5xl text-milk mb-4">Готовы сделать заказ?</h2>
            <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.65)' }}>
              Оставьте заявку — мы свяжемся в течение 30 минут и уточним все детали.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/order" className="btn-outline" style={{ borderColor: 'rgba(245,240,232,0.35)' }}>
                Оформить заявку →
              </Link>
              <Link href="/track" className="btn-outline"
                style={{ borderColor: 'rgba(245,240,232,0.15)', color: 'rgba(245,240,232,0.60)' }}>
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
