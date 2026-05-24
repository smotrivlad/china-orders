'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyTrackPin } from './actions'

export default function TrackVerifyCard({ code }: { code: string }) {
  const [pin, setPin]       = useState('')
  const [error, setError]   = useState('')
  const [isPending, start]  = useTransition()
  const router              = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const result = await verifyTrackPin(code, pin)
      if (result.ok) {
        router.refresh()
      } else {
        setError(result.error ?? 'Ошибка проверки')
        if (!result.blocked) setPin('')
      }
    })
  }

  const blocked = error.includes('час')

  return (
    <main className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="glass rounded-3xl p-8">
          {/* Lock icon */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{ background: 'rgba(139,26,47,0.12)', border: '1px solid rgba(139,26,47,0.25)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"
                stroke="#8B1A2F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#F5F0E8' }}>
              Введите PIN
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Заявка <span className="font-mono font-semibold" style={{ color: '#F5F0E8' }}>{code}</span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                6-значный PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                autoComplete="off"
                disabled={blocked}
                className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none transition-colors disabled:opacity-40"
                style={{
                  background: 'rgba(245,240,232,0.05)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(245,240,232,0.12)'}`,
                  color: '#F5F0E8',
                }}
              />
              <p className="mt-1.5 text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>
                PIN был показан на странице после оформления заявки
              </p>
            </div>

            {error && (
              <p className="rounded-xl px-4 py-2.5 text-sm text-center"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || pin.length < 6 || blocked}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#8B1A2F' }}
            >
              {isPending ? 'Проверяем…' : 'Открыть заявку →'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/track" className="text-xs transition-colors"
              style={{ color: 'rgba(245,240,232,0.3)' }}>
              ← Ввести другой код заявки
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
