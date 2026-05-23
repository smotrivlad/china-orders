import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import OrderWizard from '@/components/forms/OrderWizard'

export const metadata: Metadata = {
  title: 'Оформить заявку — EASTWIND LOGISTIC',
}

export default function OrderPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="orb w-[500px] h-[500px] top-[-100px] right-[-200px]"
          style={{ background: 'rgba(139,26,47,0.08)' }} />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

            {/* Left — info panel */}
            <div className="lg:sticky lg:top-32 pt-2">
              <div className="section-label mb-5">Оформление заявки</div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight"
                style={{ color: '#F5F0E8' }}>
                Опишите ваш{' '}
                <span className="text-gradient-burgundy">товар</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed max-w-md" style={{ color: 'rgba(245,240,232,0.5)' }}>
                Заполните форму — мы найдём лучшего поставщика и согласуем условия доставки.
              </p>

              <div className="mt-10 space-y-5">
                {([
                  ['🔍', 'Найдём товар',        'По описанию или ссылке с любой китайской площадки'],
                  ['💰', 'Лучшая цена',          'Проверяем несколько поставщиков, берём выгодное'],
                  ['📦', 'Доставка под ключ',    'Выкуп, упаковка, таможня, доставка до вас'],
                ] as const).map(([icon, title, desc]) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: 'rgba(139,26,47,0.15)' }}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{title}</div>
                      <div className="text-sm mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 glass rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: 'rgba(139,26,47,0.2)' }}>⏱</div>
                  <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
                    Ответим в течение <strong style={{ color: '#F5F0E8' }}>30 минут</strong> в рабочее время
                  </p>
                </div>
              </div>
            </div>

            {/* Right — wizard */}
            <div className="glass rounded-3xl p-8 sm:p-10">
              <OrderWizard />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
