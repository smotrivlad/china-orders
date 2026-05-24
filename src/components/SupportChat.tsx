'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function SupportChat() {
  const pathname = usePathname()
  const [open, setOpen]       = useState(false)
  const [name, setName]       = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const msgRef = useRef<HTMLTextAreaElement>(null)

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const saved = localStorage.getItem('support_name')
    if (saved) setName(saved)
  }, [])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (open) setTimeout(() => msgRef.current?.focus(), 80)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    setLoading(true)
    setError('')

    try {
      localStorage.setItem('support_name', name.trim())

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          page: window.location.pathname,
        }),
      })

      if (!res.ok) throw new Error('server error')

      setSent(true)
      setMessage('')
      setTimeout(() => { setSent(false); setOpen(false) }, 2800)
    } catch {
      setError('Ошибка отправки. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => { setOpen(v => !v); setError('') }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: '#8B1A2F', boxShadow: '0 8px 24px rgba(139,26,47,0.45)' }}
        aria-label={open ? 'Закрыть чат' : 'Написать в поддержку'}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Popup */}
      <div
        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
        style={{
          background: '#120508',
          border: '1px solid rgba(139,26,47,0.35)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(139,26,47,0.9)' }}>
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Поддержка EASTWIND</p>
            <p className="text-[11px] text-white/60">Ответим в ближайшее время</p>
          </div>
        </div>

        {/* Body */}
        {sent ? (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>
              Сообщение отправлено!
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(245,240,232,0.45)' }}>
              Мы свяжемся с вами в ближайшее время
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            {/* Name */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                Ваше имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Как вас зовут?"
                required
                maxLength={100}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                style={{
                  background: 'rgba(245,240,232,0.06)',
                  border: '1px solid rgba(245,240,232,0.1)',
                  color: '#F5F0E8',
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(245,240,232,0.4)' }}>
                Сообщение
              </label>
              <textarea
                ref={msgRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ваш вопрос или обращение..."
                required
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{
                  background: 'rgba(245,240,232,0.06)',
                  border: '1px solid rgba(245,240,232,0.1)',
                  color: '#F5F0E8',
                }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !message.trim()}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#8B1A2F' }}
            >
              {loading ? 'Отправляем…' : 'Отправить →'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
