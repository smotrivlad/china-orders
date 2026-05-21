'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Step = 'password' | 'otp'

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      setStep('otp')
    } else {
      const { error: msg } = await res.json()
      setError(msg)
    }
  }

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: otp }),
    })
    setLoading(false)
    if (res.ok) {
      window.location.href = '/admin/orders'
    } else {
      const { error: msg } = await res.json()
      setError(msg)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">{step === 'password' ? '🔐' : '📱'}</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {step === 'password' ? 'Вход в админ-панель' : 'Проверка кода'}
          </h1>
          {step === 'otp' && (
            <p className="mt-2 text-sm text-gray-500">
              Код отправлен в Telegram. Действителен 5 минут.
            </p>
          )}
        </div>

        {step === 'password' ? (
          <form onSubmit={handlePassword} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              error={error}
              required
              autoFocus
            />
            <Button type="submit" loading={loading} className="w-full">
              Получить код в Telegram
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <Input
              label="Код из Telegram"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
              error={error}
              required
              autoFocus
              className="text-center text-2xl tracking-widest font-mono"
            />
            <Button type="submit" loading={loading} className="w-full">
              Войти
            </Button>
            <button
              type="button"
              onClick={() => { setStep('password'); setOtp(''); setError('') }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Назад
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
