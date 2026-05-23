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

      {/* ── CONTACTS ──────────────────────────────────────── */}
      <section id="contacts" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-label justify-center mb-4">Связаться с нами</div>
            <h2 className="font-display text-4xl sm:text-5xl text-milk">Контакты</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">

            {/* Telegram */}
            <a
              href="https://t.me/ewmanager"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl p-6 flex flex-col items-center gap-4 hover:-translate-y-1 transition-all duration-300 group"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(39,174,239,0.12)', border: '1px solid rgba(39,174,239,0.2)' }}
              >
                ✈️
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(245,240,232,0.4)' }}>Telegram</p>
                <p className="font-semibold text-milk group-hover:text-milk/80 transition-colors">@ewmanager</p>
              </div>
            </a>

            {/* ВКонтакте */}
            <a
              href="https://vk.com/eastwind63"
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl p-6 flex flex-col items-center gap-4 hover:-translate-y-1 transition-all duration-300 group"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,119,255,0.12)', border: '1px solid rgba(0,119,255,0.2)' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.003 2C8.268 2 2 8.268 2 16.003 2 23.738 8.268 30 16.003 30 23.738 30 30 23.738 30 16.003 30 8.268 23.738 2 16.003 2zm7.42 18.978h-2.04c-.772 0-1.01-.616-2.396-2.018-1.21-1.178-1.744-1.337-2.042-1.337-.414 0-.533.12-.533.69v1.842c0 .495-.158.79-1.464.79-2.156 0-4.55-1.307-6.232-3.74C6.88 14.44 6.4 11.92 6.4 11.405c0-.296.12-.573.69-.573h2.04c.514 0 .71.237.908.79.99 2.87 2.654 5.38 3.34 5.38.257 0 .375-.12.375-.772v-3.005c-.08-1.385-.81-1.504-.81-1.998 0-.237.198-.474.514-.474h3.207c.435 0 .59.237.59.75v4.055c0 .435.197.592.317.592.257 0 .474-.157 .948-.632 1.465-1.662 2.514-4.213 2.514-4.213.138-.296.375-.573.888-.573h2.04c.613 0 .75.316.613.75-.257 1.068-2.752 4.708-2.752 4.708-.217.355-.296.514 0 .91.217.296.928.91 1.405 1.464.87.988 1.543 1.82 1.72 2.395.198.573-.099.868-.692.868z" fill="#5181B8"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(245,240,232,0.4)' }}>ВКонтакте</p>
                <p className="font-semibold text-milk group-hover:text-milk/80 transition-colors">eastwind63</p>
              </div>
            </a>

            {/* WeChat */}
            <div
              className="glass rounded-2xl p-6 flex flex-col items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(9,187,7,0.12)', border: '1px solid rgba(9,187,7,0.2)' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6 5C7.298 5 3 8.848 3 13.6c0 2.66 1.37 5.03 3.52 6.64l-.88 2.64 3.08-1.54c.9.25 1.86.38 2.88.38.28 0 .56-.01.83-.03-.17-.54-.27-1.1-.27-1.69 0-4.3 3.87-7.78 8.64-7.78.3 0 .6.02.9.05C20.82 8.45 17.07 5 12.6 5zM9.8 10.6a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2zm5.6 0a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z" fill="#09BB07"/>
                  <path d="M21.4 12.8c-4.2 0-7.6 3-7.6 6.6 0 3.65 3.4 6.6 7.6 6.6.9 0 1.77-.14 2.58-.38l2.62 1.31-.75-2.24C27.73 23.24 29 21.15 29 19.4c0-3.6-3.4-6.6-7.6-6.6zm-2.6 5.1a.9.9 0 110 1.8.9.9 0 010-1.8zm5.2 0a.9.9 0 110 1.8.9.9 0 010-1.8z" fill="#09BB07"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(245,240,232,0.4)' }}>WeChat</p>
                <p className="font-semibold text-milk font-mono tracking-wide">VLADCHINA63</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
