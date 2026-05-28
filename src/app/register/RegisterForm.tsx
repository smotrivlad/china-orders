'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    if (password !== confirm) { setError('Пароли не совпадают'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-6">✉️</div>
        <h2 className="text-xl font-semibold text-milk mb-3">Проверьте почту</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
          Мы отправили письмо с подтверждением на{' '}
          <span className="text-milk font-medium">{email}</span>.
          <br />
          Перейдите по ссылке в письме, чтобы активировать аккаунт.
        </p>
        <Link href="/login" className="inline-block mt-8 text-sm text-milk/60 hover:text-milk transition-colors">
          ← Вернуться к входу
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-2xl font-bold text-milk tracking-tight mb-1">
          EASTWIND <span style={{ color: '#8B1A2F' }}>LOGISTIC</span>
        </div>
        <h1 className="text-xl font-semibold text-milk mt-4">Создать аккаунт</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(245,240,232,0.45)' }}>
          Получите личный кабинет для отслеживания заявок
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 space-y-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(245,240,232,0.08)',
        }}
      >
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(139,26,47,0.15)', border: '1px solid rgba(139,26,47,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Пароль
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full rounded-xl px-4 py-3 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Повторите пароль
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-[11px] text-center leading-relaxed" style={{ color: 'rgba(245,240,232,0.25)' }}>
          После регистрации придёт письмо с подтверждением email
        </p>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: 'rgba(245,240,232,0.4)' }}>
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-milk hover:underline font-medium">
          Войти
        </Link>
      </p>
    </div>
  )
}
