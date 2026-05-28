'use client'

import { useState } from 'react'

export default function ClaimOrderForm() {
  const [open, setOpen]       = useState(false)
  const [code, setCode]       = useState('')
  const [pin, setPin]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/auth/claim-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), pin: pin.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Ошибка привязки заявки')
      return
    }

    setSuccess(`Заявка ${code.toUpperCase()} привязана к вашему аккаунту`)
    setCode('')
    setPin('')
    // Reload to show the newly linked order
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(245,240,232,0.06)',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <div>
          <p className="text-sm font-medium text-milk/70">Привязать заявку</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.3)' }}>
            Если заявка создавалась до регистрации
          </p>
        </div>
        <span className="text-milk/30 text-lg transition-transform duration-200" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>
          +
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
                Код заявки
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="CH-001234"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all font-mono"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
                PIN-код (6 цифр)
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="······"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all tracking-widest"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
          )}
          {success && (
            <p className="text-sm" style={{ color: '#4ade80' }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-2.5 px-5 text-sm disabled:opacity-50"
          >
            {loading ? 'Проверяем...' : 'Привязать'}
          </button>

          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.25)' }}>
            PIN-код отображается на странице с подтверждением заявки (CH-XXXXXX + 6 цифр)
          </p>
        </form>
      )}
    </div>
  )
}
