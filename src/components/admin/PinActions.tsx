'use client'

import { useState } from 'react'

interface Props {
  orderId: string
  initialPin: string
  /** True if this pin came from HMAC fallback (DB column not yet set) */
  isHmacFallback: boolean
}

export default function PinActions({ orderId, initialPin, isHmacFallback }: Props) {
  const [pin, setPin]           = useState(initialPin)
  const [visible, setVisible]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fromHmac, setFromHmac] = useState(isHmacFallback)
  const [confirm, setConfirm]   = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text (no clipboard API in some contexts)
      setError('Скопируйте вручную: ' + pin)
    }
  }

  async function handleRegenerate() {
    setLoading(true)
    setError('')
    setConfirm(false)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/pin`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.error === 'migration_required') {
          setError('Миграция БД не применена. Откройте Supabase Dashboard → SQL Editor и выполните 009_add_pin_column.sql')
        } else {
          setError(json.error ?? 'Ошибка сервера')
        }
      } else {
        setPin(json.pin)
        setFromHmac(false)
        setVisible(true) // show new PIN automatically
      }
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* PIN row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* PIN value */}
        <span className={`font-mono font-bold text-base tracking-[0.2em] transition-all select-all ${
          visible ? 'text-red-700' : 'text-gray-300'
        }`}>
          {visible ? pin : '••••••'}
        </span>

        {fromHmac && visible && (
          <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">HMAC</span>
        )}

        {/* Show/Hide */}
        <button
          onClick={() => setVisible(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
        >
          {visible ? 'Скрыть' : 'Показать PIN'}
        </button>

        {/* Copy — only when visible */}
        {visible && (
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              copied
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <>
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
                </svg>
                Скопировано
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                  <rect x="5" y="5" width="8" height="9" rx="1" />
                  <path d="M3 11V3a1 1 0 0 1 1-1h8" />
                </svg>
                Скопировать
              </>
            )}
          </button>
        )}

        {/* Regenerate — confirm step */}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
              <path d="M13.5 2.5A6.5 6.5 0 1 1 8 1.5" strokeLinecap="round"/>
              <path d="M13.5 2.5V6h-3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Новый PIN
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="text-gray-600">Старый PIN перестанет работать.</span>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="font-medium text-red-600 hover:text-red-800 underline underline-offset-2 disabled:opacity-50"
            >
              {loading ? 'Генерирую…' : 'Да, сгенерировать'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Отмена
            </button>
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 max-w-sm">{error}</p>
      )}
    </div>
  )
}
