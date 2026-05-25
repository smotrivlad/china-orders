'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewsSlider from '@/components/ReviewsSlider'

interface Review {
  id: string
  client_name: string
  text: string
  photo_url: string | null
  created_at: string
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/* ── Animation variants ───────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.75, ease: EASE } },
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -56 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.8,  ease: EASE } },
}
const fadeRight: Variants = {
  hidden: { opacity: 0, x: 56 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.8,  ease: EASE } },
}
const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13 } },
}

/* ── Services data ────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Поиск и закупка',
    desc:  'Находим товары и фабрики, выкупаем с Taobao, Weidian, Poizon и других площадок Китая.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Контроль качества',
    desc:  'Проверяем поставщиков и фабрики лично до отправки. Фото и видеоотчёт по каждой партии.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <rect x="1" y="3" width="15" height="13" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 8h4l3 3v5h-7V8z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    title: 'Логистика',
    desc:  'Доставка в Россию, СНГ и другие страны. Разные маршруты под бюджет и сроки.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Финансы и переговоры',
    desc:  'Обмен валюты, Alipay, переговоры с партнёрами на китайском. Полная прозрачность.',
  },
]

/* ── Section wrapper with InView ─────────────────────────────────────────── */
function InViewSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(({ reviews: data }) => setReviews(data ?? []))
      .catch(() => {})
  }, [])
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,26,47,0.13) 0%, transparent 70%)' }} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="section-label justify-center mb-6">Кто мы</div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display leading-[1.06] tracking-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
          >
            <span style={{ color: '#F5F0E8' }}>О&nbsp;</span>
            <span style={{ color: '#8B1A2F' }}>компании</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: 'rgba(245,240,232,0.52)' }}
          >
            EASTWIND LOGISTIC — ваш надёжный партнёр по работе с Китаем
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-16 h-0.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #8B1A2F, transparent)' }}
          />
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: 'rgba(245,240,232,0.25)' }}
        >
          <span className="text-xs tracking-widest uppercase">Листать</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOUNDER STORY ─────────────────────────────────────────────────── */}
      <section className="py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Photo */}
            <InViewSection>
              <motion.div variants={fadeLeft} className="relative mx-auto lg:mx-0 max-w-sm">
                {/* Founder photo */}
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5]"
                  style={{ border: '1px solid rgba(139,26,47,0.2)' }}>
                  <img
                    src="/founder.jpg"
                    alt="Влад — основатель EASTWIND LOGISTIC"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-36"
                    style={{ background: 'linear-gradient(to top, rgba(15,23,41,0.92), transparent)' }} />
                  {/* Bottom label */}
                  <div className="absolute bottom-6 left-6">
                    <p className="font-semibold text-milk text-sm">Влад</p>
                    <p className="text-xs" style={{ color: 'rgba(245,240,232,0.45)' }}>Основатель EASTWIND</p>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-4 top-10 glass rounded-2xl px-4 py-3 shadow-xl"
                  style={{ border: '1px solid rgba(139,26,47,0.3)' }}
                >
                  <p className="text-xs font-bold text-milk">2023</p>
                  <p className="text-[10px]" style={{ color: 'rgba(245,240,232,0.45)' }}>Основан</p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -left-4 bottom-20 glass rounded-2xl px-4 py-3 shadow-xl"
                  style={{ border: '1px solid rgba(139,26,47,0.3)' }}
                >
                  <p className="text-xs font-bold text-milk">500+</p>
                  <p className="text-[10px]" style={{ color: 'rgba(245,240,232,0.45)' }}>Заказов</p>
                </motion.div>
              </motion.div>
            </InViewSection>

            {/* Text */}
            <InViewSection>
              <motion.div variants={fadeRight} className="space-y-6">
                <div className="section-label">История основателя</div>

                <h2 className="font-display leading-tight"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#F5F0E8' }}>
                  В&nbsp;21&nbsp;год. <span style={{ color: '#8B1A2F' }}>Без готовых схем.</span><br />
                  Только желание разобраться —<br />
                  и сделать это правильно.
                </h2>

                <div className="space-y-4">
                  {[
                    'Меня зовут Влад, я родом из Тольятти и являюсь основателем компании по работе с Китаем EASTWIND. Начал в 2023 году в 21 год: без связей, без готовых схем, с переводчиком и желанием разобраться в том, как на самом деле устроен китайский рынок.',
                    'Сегодня это опыт, прямые контакты с карго-партнёрами и база поставщиков, которая собиралась годами проб и ошибок.',
                  ].map((text, i) => (
                    <p key={i} className="text-base leading-[1.85]"
                      style={{ color: 'rgba(245,240,232,0.55)' }}>
                      {text}
                    </p>
                  ))}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-5 pt-6"
                  style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}>
                  {[
                    { val: '2023',  label: 'Год основания' },
                    { val: '500+',  label: 'Заказов выполнено' },
                    { val: '100%',  label: 'Прозрачность' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="font-display text-2xl text-milk">{s.val}</div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.35)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/order" className="btn-primary py-2.5 px-5 text-sm">Оформить заявку →</Link>
                  <Link href="/track" className="btn-outline py-2.5 px-5 text-sm">Отследить посылку</Link>
                </div>
              </motion.div>
            </InViewSection>
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(139,26,47,0.06) 0%, transparent 70%)' }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          {/* Heading */}
          <InViewSection className="text-center mb-16">
            <motion.div variants={fadeUp}>
              <div className="section-label justify-center mb-4">Что мы делаем</div>
              <h2 className="font-display text-4xl sm:text-5xl text-milk">Наши услуги</h2>
            </motion.div>
          </InViewSection>

          {/* Cards */}
          <InViewSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="glass rounded-2xl p-6 flex flex-col gap-4 cursor-default"
                style={{ border: '1px solid rgba(245,240,232,0.05)' }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,26,47,0.15)', border: '1px solid rgba(139,26,47,0.25)', color: '#8B1A2F' }}>
                  {s.icon}
                </div>

                {/* Number */}
                <div className="font-display text-5xl font-bold leading-none select-none"
                  style={{ color: 'rgba(139,26,47,0.12)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                <div>
                  <h3 className="font-semibold text-milk text-sm uppercase mb-2" style={{ letterSpacing: '0.06em' }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.42)' }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </InViewSection>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="py-28 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <InViewSection className="text-center mb-14">
              <motion.div variants={fadeUp}>
                <div className="section-label justify-center mb-4">Отзывы</div>
                <h2 className="font-display text-4xl sm:text-5xl text-milk">
                  Что говорят клиенты
                </h2>
              </motion.div>
            </InViewSection>
            <ReviewsSlider reviews={reviews} />
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <InViewSection>
          <motion.div variants={fadeUp}
            className="mx-auto max-w-4xl rounded-3xl overflow-hidden relative text-center px-8 py-16">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #8B1A2F 0%, #6B1424 60%, #0f1729 100%)' }} />
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl text-milk mb-4">
                Готовы работать вместе?
              </h2>
              <p className="text-lg mb-8 max-w-lg mx-auto" style={{ color: 'rgba(245,240,232,0.65)' }}>
                Оставьте заявку — свяжемся в течение 30 минут.
              </p>
              <Link href="/order"
                className="inline-flex items-center gap-2 btn-outline font-semibold"
                style={{ borderColor: 'rgba(245,240,232,0.35)' }}>
                Оформить заявку →
              </Link>
            </div>
          </motion.div>
        </InViewSection>
      </section>

      <Footer />
    </>
  )
}
