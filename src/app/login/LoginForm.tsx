'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({
  redirectTo,
  serverError,
}: {
  redirectTo: string
  serverError?: string
}) {
  const router  = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(serverError ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError(authErr.message === 'Invalid login credentials'
        ? 'Неверный email или пароль'
        : authErr.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  async function handleReset() {
    if (!email.trim()) { setError('Введите email для сброса пароля'); return }
    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/cabinet`,
    })
    if (resetErr) { setError(resetErr.message); return }
    setError('')
    alert(`Ссылка для сброса пароля отправлена на ${email}`)
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo / title */}
      <div className="text-center mb-8">
        <div className="text-2xl font-bold text-milk tracking-tight mb-1">
          EASTWIND <span style={{ color: '#8B1A2F' }}>LOGISTIC</span>
        </div>
        <h1 className="text-xl font-semibold text-milk mt-4">Вход в личный кабинет</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(245,240,232,0.45)' }}>
          Отслеживайте заявки и переписку с менеджером
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 space-y-5"
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
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs transition-colors"
            style={{ color: 'rgba(245,240,232,0.35)' }}
          >
            Забыли пароль?
          </button>
        </div>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: 'rgba(245,240,232,0.4)' }}>
        Нет аккаунта?{' '}
        <Link href="/register" className="text-milk hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
