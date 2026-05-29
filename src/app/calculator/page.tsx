import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CalculatorForm from './CalculatorForm'

export const metadata: Metadata = {
  title: 'Калькулятор стоимости — EASTWIND LOGISTIC',
  description: 'Рассчитайте примерную стоимость доставки товаров из Китая',
}

export default function CalculatorPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20" style={{ background: '#0f1729' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 pt-4">
            <div className="section-label mb-3">Стоимость доставки</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-milk">
              Калькулятор <span className="text-gradient-burgundy">доставки</span>
            </h1>
            <p className="mt-3 text-sm max-w-lg" style={{ color: 'rgba(245,240,232,0.45)' }}>
              Введите параметры груза — рассчитаем примерную стоимость по маршруту Китай → Тольятти
            </p>
          </div>
          <CalculatorForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
