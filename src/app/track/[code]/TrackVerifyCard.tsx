'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { verifyTrackPin } from './actions'
import type { ContactType } from '@/lib/utils/trackAccess'

export default function TrackVerifyCard({
  code,
  contactType,
}: {
  code: string
  contactType: ContactType
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isUsername = contactType === 'username'
  const label = isUsername
    ? 'Последние 4 символа вашего @username'
    : 'Последние 4 цифры номера телефона'
  const placeholder = isUsername ? 'abcd' : '1234'
  const hint = isUsername
    ? 'Например, для @johndoe введите ndoe'
    : 'Например, для +7 999 123 4567 введите 4567'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await verifyTrackPin(code, pin)
      if (result.ok) {
        router.refresh()
      } else {
        setError(result.error ?? 'Ошибка проверки')
        setPin('')
      }
    })
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid" />

      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="glass rounded-3xl p-8">
          {/* Icon */}
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
              Подтверждение
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Заявка <span className="font-mono font-semibold" style={{ color: '#F5F0E8' }}>{code}</span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                {label}
              </label>
              <input
                type="text"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder={placeholder}
                maxLength={20}
                autoFocus
                autoComplete="off"
                className="w-full rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.3em] outline-none transition-colors"
                style={{
                  background: 'rgba(245,240,232,0.05)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(245,240,232,0.12)'}`,
                  color: '#F5F0E8',
                }}
              />
              <p className="mt-1.5 text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>
                {hint}
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
              disabled={isPending || !pin.trim()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#8B1A2F' }}
            >
              {isPending ? 'Проверяем…' : 'Открыть заявку →'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/track" className="text-xs transition-colors"
              style={{ color: 'rgba(245,240,232,0.3)' }}>
              ← Ввести другой номер
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
