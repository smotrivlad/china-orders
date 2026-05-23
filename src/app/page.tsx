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

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="orb w-[600px] h-[600px] bg-burgundy/10 top-[-200px] right-[-200px]" />
        <div className="orb w-[400px] h-[400px] bg-burgundy/8 bottom-[-100px] left-[-100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <div className="section-label mb-6">Прямые поставки из Китая</div>
              <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="text-milk">EAST</span>
                <span className="text-gradient-burgundy">WIND</span>
                <br />
                <span className="text-milk/80 text-4xl sm:text-5xl xl:text-6xl">LOGISTIC</span>
              </h1>
              <p className="mt-6 text-milk/55 text-lg leading-relaxed max-w-lg">
                Надёжная доставка товаров из Китая для бизнеса и частных лиц.
                Отслеживание в реальном времени — вы знаете, где ваш груз.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/order" className="btn-primary">
                  Оформить заявку →
                </Link>
                <Link href="/track" className="btn-outline">
                  Отследить посылку
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-2xl font-bold text-milk">{s.val}</div>
                    <div className="text-xs text-milk/40 mt-0.5 leading-snug">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right – logo visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Rotating outer ring */}
                <div className="absolute inset-0 rounded-full animate-spin-slow"
                  style={{ border: '1px solid rgba(139,26,47,0.2)' }} />
                <div className="absolute inset-8 rounded-full"
                  style={{ border: '1px solid rgba(245,240,232,0.05)' }} />
                {/* Glow */}
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(139,26,47,0.12) 0%, transparent 70%)' }} />
                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-float">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt="EASTWIND LOGISTIC"
                      width={200}
                      height={200}
                      className="rounded-3xl"
                      style={{ boxShadow: '0 0 60px rgba(139,26,47,0.35)' }}
                    />
                  </div>
                </div>
                {/* Orbiting dots */}
                {[0, 120, 240].map((deg, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full animate-float-slow"
                    style={{
                      background: '#8B1A2F',
                      top: `${50 - 48 * Math.cos((deg * Math.PI) / 180)}%`,
                      left: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                      animationDelay: `${i * 0.8}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Что мы делаем</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-milk">Наши услуги</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 group hover:-translate-y-1 hover:border-burgundy/30 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-burgundy/15 flex items-center justify-center text-2xl mb-4 group-hover:bg-burgundy/25 transition-colors">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-milk mb-2">{s.title}</h3>
                <p className="text-sm text-milk/45 leading-relaxed">{s.desc}</p>
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
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-milk">Как мы работаем</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-burgundy/30 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="relative text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-burgundy/30 bg-burgundy/10 mb-5 lg:mx-0 mx-auto">
                    <span className="font-display text-xl font-bold text-burgundy">{step.num}</span>
                  </div>
                  <h3 className="font-semibold text-milk mb-2">{step.title}</h3>
                  <p className="text-sm text-milk/45 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 mx-4 sm:mx-6">
        <div className="mx-auto max-w-4xl rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-burgundy via-burgundy/90 to-navy" />
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative z-10 px-8 py-16 text-center">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-milk mb-4">
              Готовы сделать заказ?
            </h2>
            <p className="text-milk/70 text-lg mb-8 max-w-lg mx-auto">
              Оставьте заявку — мы свяжемся в течение 30 минут и уточним все детали.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/order" className="btn-outline border-milk/40 hover:bg-milk/10 text-milk">
                Оформить заявку →
              </Link>
              <Link href="/track" className="btn-outline border-milk/20 hover:bg-milk/5 text-milk/70">
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
