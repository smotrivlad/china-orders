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
  { num: '01', title: 'Оставьте заявку',  desc: 'Заполните форму — опишите товар, прикрепите ссылку или фото.' },
  { num: '02', title: 'Ищем поставщика',  desc: 'Находим надёжного поставщика и согласовываем условия.' },
  { num: '03', title: 'Выкуп и отправка', desc: 'Оплачиваем товар и отправляем с нашего склада в России.' },
  { num: '04', title: 'Получаете товар',  desc: 'Забираете заказ. Вы отслеживаете каждый шаг в реальном времени.' },
]

const STATS = [
  { val: '500+',   label: 'Выполненных заказов' },
  { val: '25–40',  label: 'Дней доставки' },
  { val: '100%',   label: 'Прозрачность' },
  { val: '3 года', label: 'На рынке' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-grid" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <div>
              <div className="section-label mb-6">Прямые поставки из Китая</div>
              <h1
                className="font-display leading-[1.04] tracking-tight mb-6"
                style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}
              >
                <span style={{ color: '#F5F0E8' }}>EAST</span>
                <span style={{ color: '#8B1A2F' }}>WIND</span>
                <br />
                <span
                  className="font-bold"
                  style={{ color: 'rgba(245,240,232,0.55)', fontSize: '0.52em', letterSpacing: '0.28em' }}
                >
                  LOGISTIC
                </span>
              </h1>
              <p
                className="leading-relaxed max-w-lg mb-8"
                style={{ color: 'rgba(245,240,232,0.50)', fontSize: '1.05rem' }}
              >
                Надёжная доставка товаров из Китая для бизнеса и частных лиц.
                Отслеживание в реальном времени — вы знаете, где ваш груз.
              </p>
              <div className="flex flex-wrap gap-4 mb-14">
                <Link href="/order" className="btn-primary">Оформить заявку →</Link>
                <Link href="/track" className="btn-outline">Отследить посылку</Link>
              </div>
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10"
                style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}
              >
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-2xl text-milk">{s.val}</div>
                    <div className="text-xs mt-1 leading-snug" style={{ color: 'rgba(245,240,232,0.38)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — logo */}
            <div className="hidden lg:flex items-center justify-center">
              <img
                src="/logo.png?v=2"
                alt="EASTWIND LOGISTIC"
                width={320}
                height={320}
                style={{
                  objectFit: 'contain',
                  animation: 'sway 4s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 18px rgba(139,26,47,0.7)) drop-shadow(0 0 40px rgba(139,26,47,0.3))',
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Что мы делаем</div>
            <h2 className="font-display text-4xl sm:text-5xl text-milk">Наши услуги</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: 'rgba(139,26,47,0.13)' }}
                >
                  {s.icon}
                </div>
                <h3 className="font-semibold text-milk mb-2 text-sm uppercase" style={{ letterSpacing: '0.06em' }}>
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
                <div key={i} className="text-center lg:text-left">
                  <div
                    className="inline-flex items-center justify-center w-[76px] h-[76px] rounded-full mb-5 lg:mx-0 mx-auto"
                    style={{ border: '1px solid rgba(139,26,47,0.3)', background: 'rgba(139,26,47,0.08)' }}
                  >
                    <span className="font-display text-lg font-bold" style={{ color: '#8B1A2F' }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-milk mb-2 text-sm" style={{ letterSpacing: '0.05em' }}>
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
            style={{ background: 'linear-gradient(135deg, #8B1A2F 0%, #6B1424 60%, #0f1729 100%)' }}
          />
          <div className="absolute inset-0 bg-grid opacity-10" />
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
