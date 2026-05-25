'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Session {
  id: string
  session_id: string
  name: string
  status: 'open' | 'pending_close' | 'closed'
  page: string
  created_at: string
}

interface Message {
  id: string
  text: string
  sender: 'client' | 'manager'
  created_at: string
}

const STATUS_MAP = {
  open:          { label: 'Открыт',          bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'    },
  pending_close: { label: 'Ожидает ответа',  bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  closed:        { label: 'Закрыт',          bg: 'bg-gray-100',  text: 'text-gray-500',   border: 'border-gray-200'   },
}

export default function SupportSessionCard({ session: s }: { session: Session }) {
  const [expanded, setExpanded]       = useState(false)
  const [messages, setMessages]       = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [replyText, setReplyText]     = useState('')
  const [sending, setSending]         = useState(false)
  const [closing, setClosing]         = useState(false)
  const [status, setStatus]           = useState(s.status)

  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const msgsEndRef    = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/messages?sid=${encodeURIComponent(s.session_id)}`)
      if (!res.ok) return
      const { messages: msgs, session } = await res.json() as { messages: Message[]; session: { status: string } | null }
      setMessages(msgs ?? [])
      if (session) setStatus(session.status as Session['status'])
    } catch { /* ignore */ }
  }, [s.session_id])

  useEffect(() => {
    if (!expanded) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    setLoadingMsgs(true)
    fetchMessages().finally(() => setLoadingMsgs(false))

    if (status === 'open' || status === 'pending_close') {
      pollRef.current = setInterval(fetchMessages, 5000)
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    const text = replyText.trim()
    if (!text) return
    setSending(true)
    try {
      await fetch(`/api/admin/support/${s.session_id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      setReplyText('')
      fetchMessages()
    } finally {
      setSending(false)
    }
  }

  async function closeDialog() {
    setClosing(true)
    try {
      await fetch(`/api/admin/support/${s.session_id}/close`, { method: 'POST' })
      setStatus('pending_close')
    } finally {
      setClosing(false)
    }
  }

  const st = STATUS_MAP[status]
  const time = new Date(s.created_at).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-opacity ${status === 'closed' ? 'opacity-60' : ''}`}
      style={{ borderColor: status === 'open' ? '#fca5a5' : '#e5e7eb' }}>

      {/* ── Collapsed header ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors rounded-2xl"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{s.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.bg} ${st.text} ${st.border}`}>
              {st.label}
            </span>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{s.page}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`}>
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Expanded: messages + reply ── */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          {/* Messages */}
          <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '280px', background: '#fafafa' }}>
            {loadingMsgs ? (
              <p className="text-center text-xs text-gray-400 py-6">Загрузка…</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">Нет сообщений</p>
            ) : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[80%] text-sm px-3.5 py-2 leading-relaxed"
                  style={{
                    background:   msg.sender === 'client' ? '#fff' : '#2563eb',
                    color:        msg.sender === 'client' ? '#1f2937' : '#fff',
                    border:       msg.sender === 'client' ? '1px solid #e5e7eb' : 'none',
                    borderRadius: msg.sender === 'client' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  }}>
                  {msg.sender === 'manager' && (
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-70">Менеджер</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${msg.sender === 'client' ? 'text-gray-400' : 'text-blue-200'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={msgsEndRef} />
          </div>

          {/* Reply area */}
          {status !== 'closed' && (
            <div className="p-3 space-y-2" style={{ borderTop: '1px solid #f3f4f6' }}>
              <div className="flex gap-2">
                <textarea
                  ref={replyInputRef}
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Написать ответ…" rows={2} maxLength={2000}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none resize-none focus:border-blue-400 transition-colors"
                />
                <button onClick={sendReply} disabled={sending || !replyText.trim()}
                  className="w-10 self-end rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center pb-0.5 h-9 transition-colors disabled:opacity-40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                {status === 'open' && (
                  <button onClick={closeDialog} disabled={closing}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
                    🔒 {closing ? 'Закрываем…' : 'Закрыть диалог'}
                  </button>
                )}
                {status === 'pending_close' && (
                  <p className="text-xs text-yellow-600 font-medium">
                    ⏳ Ожидаем подтверждения от клиента
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
