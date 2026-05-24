'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { verifyTrackPin } from './[code]/actions'

export default function TrackPage() {
  const [code, setCode]         = useState('')
  const [pin, setPin]           = useState('')
  const [error, setError]       = useState('')
  const [isPending, startTr]    = useTransition()
  const router                  = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode.startsWith('CH-') || cleanCode.length < 5) {
      setError('Введите корректный номер, например CH-1000')
      return
    }
    if (pin.length !== 6) {
      setError('PIN должен состоять из 6 цифр')
      return
    }

    startTr(async () => {
      const result = await verifyTrackPin(cleanCode, pin)
      if (result.ok) {
        router.push(`/track/${cleanCode}`)
      } else {
        setError(result.error ?? 'Ошибка проверки')
        if (!result.blocked) setPin('')
      }
    })
  }

  const blocked = error.includes('час')

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="orb w-[400px] h-[400px] top-[-50px] right-[-100px]"
          style={{ background: 'rgba(139,26,47,0.08)' }} />
        <div className="orb w-[300px] h-[300px] bottom-[-50px] left-[-50px]"
          style={{ background: 'rgba(139,26,47,0.06)' }} />

        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="text-center mb-10">
            <div className="section-label justify-center mb-5">Отслеживание</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold" style={{ color: '#F5F0E8' }}>
              Где ваш{' '}
              <span className="text-gradient-burgundy">груз?</span>
            </h1>
            <p className="mt-4 text-lg" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Введите номер заявки и PIN — покажем актуальный статус
            </p>
          </div>

          <div className="glass rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Order code */}
              <div>
                <label className="field-label">Номер заявки</label>
                <input
                  value={code}
                  onChange={e => { setCode(e.target.value); setError('') }}
                  placeholder="CH-1000"
                  className={`field-input text-lg tracking-wider font-mono ${error && !error.includes('PIN') ? 'error' : ''}`}
                  autoFocus
                  autoComplete="off"
                  disabled={blocked}
                />
              </div>

              {/* PIN */}
              <div>
                <label className="field-label">6-значный PIN</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="off"
                  disabled={blocked}
                  className={`field-input text-lg tracking-[0.4em] font-mono text-center ${error && error.includes('PIN') ? 'error' : ''}`}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending || blocked}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {isPending ? 'Проверяем…' : 'Открыть заявку →'}
              </button>
            </form>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.3)' }}>
                Код CH-XXXX и PIN отправляются в Telegram<br />сразу после оформления заявки
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
