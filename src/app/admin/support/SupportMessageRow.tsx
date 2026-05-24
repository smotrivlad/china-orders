'use client'

import { useTransition } from 'react'
import { markAnswered } from './actions'

interface SupportMessage {
  id: string
  name: string
  message: string
  page: string
  created_at: string
  answered: boolean
}

export default function SupportMessageRow({ message: msg }: { message: SupportMessage }) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(() => markAnswered(msg.id, !msg.answered))
  }

  const time = new Date(msg.created_at).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-opacity ${
      isPending ? 'opacity-60' : ''
    } ${msg.answered ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{msg.name}</span>
            <span className="text-xs text-gray-400">{time}</span>
            <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5 font-mono truncate max-w-[180px]">
              {msg.page}
            </span>
            {msg.answered && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                ✓ Отвечено
              </span>
            )}
            {!msg.answered && (
              <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                Новое
              </span>
            )}
          </div>

          {/* Message text */}
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {msg.message}
          </p>
        </div>

        {/* Right: action */}
        <button
          onClick={toggle}
          disabled={isPending}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 ${
            msg.answered
              ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
              : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {isPending ? '…' : msg.answered ? 'Снять отметку' : '✓ Отвечено'}
        </button>
      </div>
    </div>
  )
}
