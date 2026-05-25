'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

type ChatState = 'loading' | 'new_user' | 'chat' | 'pending_close' | 'closed'

interface Message {
  id: string
  text: string
  sender: 'client' | 'manager'
  created_at: string
}

const STORAGE_KEY  = 'ew_chat_sid'
const NAME_KEY     = 'ew_chat_name'
const POLL_MS      = 4000

export default function SupportChat() {
  const pathname = usePathname()

  const [open, setOpen]           = useState(false)
  const [chatState, setChatState] = useState<ChatState>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [messages, setMessages]   = useState<Message[]>([])

  // New-user form
  const [nameInput, setNameInput] = useState('')
  const [firstMsg,  setFirstMsg]  = useState('')

  // Chat input
  const [inputText, setInputText] = useState('')

  const [sending, setSending]     = useState(false)
  const [error,   setError]       = useState('')
  const [hasNewMsg, setHasNewMsg] = useState(false)

  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const firstMsgRef    = useRef<HTMLTextAreaElement>(null)
  const prevCountRef   = useRef(0)

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus input when popup opens ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setTimeout(() => {
      if (chatState === 'chat')     inputRef.current?.focus()
      if (chatState === 'new_user') firstMsgRef.current?.focus()
    }, 120)
  }, [open, chatState])

  // ── Detect new manager messages for the FAB dot ───────────────────────────
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      const hasManager = messages.slice(prevCountRef.current).some(m => m.sender === 'manager')
      if (hasManager) setHasNewMsg(true)
    }
    if (open) {
      setHasNewMsg(false)
      prevCountRef.current = messages.length
    }
  }, [messages, open])

  // ── Fetch messages + session state ────────────────────────────────────────
  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/support/messages?sid=${encodeURIComponent(sid)}`)
      if (!res.ok) return
      const { session, messages: msgs } = await res.json() as {
        session: { name: string; status: string } | null
        messages: Message[]
      }
      if (!session) {
        localStorage.removeItem(STORAGE_KEY)
        setChatState('new_user')
        return
      }
      setClientName(session.name)
      setMessages(msgs ?? [])
      if      (session.status === 'closed')        setChatState('closed')
      else if (session.status === 'pending_close') setChatState('pending_close')
      else                                         setChatState('chat')
    } catch { /* ignore */ }
  }, [])

  // ── Bootstrap: check localStorage ────────────────────────────────────────
  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY)
    if (savedName) setNameInput(savedName)

    const sid = localStorage.getItem(STORAGE_KEY)
    if (sid) {
      setSessionId(sid)
      fetchMessages(sid)
    } else {
      setChatState('new_user')
    }
  }, [fetchMessages])

  // ── Polling while chat is open ────────────────────────────────────────────
  useEffect(() => {
    if (open && sessionId && (chatState === 'chat' || chatState === 'pending_close')) {
      pollRef.current = setInterval(() => fetchMessages(sessionId), POLL_MS)
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [open, sessionId, chatState, fetchMessages])

  // Don't show on admin pages (hooks must be above this)
  if (pathname?.startsWith('/admin')) return null

  // ── Send first message (creates session) ──────────────────────────────────
  async function handleFirstMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim() || !firstMsg.trim()) return
    setSending(true)
    setError('')

    const sid = crypto.randomUUID()
    try {
      localStorage.setItem(NAME_KEY, nameInput.trim())
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       nameInput.trim(),
          text:       firstMsg.trim(),
          session_id: sid,
          page:       window.location.pathname,
        }),
      })
      if (!res.ok) throw new Error()

      localStorage.setItem(STORAGE_KEY, sid)
      setSessionId(sid)
      setClientName(nameInput.trim())
      setMessages([{
        id: `tmp-${Date.now()}`,
        text: firstMsg.trim(),
        sender: 'client',
        created_at: new Date().toISOString(),
      }])
      setFirstMsg('')
      setChatState('chat')
    } catch {
      setError('Не удалось отправить. Попробуйте ещё раз.')
    } finally {
      setSending(false)
    }
  }

  // ── Send message in existing session ──────────────────────────────────────
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = inputText.trim()
    if (!text || !sessionId || sending) return
    setSending(true)
    setInputText('')

    // Optimistic
    const tempMsg: Message = {
      id: `tmp-${Date.now()}`,
      text,
      sender: 'client',
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          text,
          page: window.location.pathname,
        }),
      })
    } catch { /* next poll will reconcile */ }
    finally { setSending(false) }
  }

  // ── Client responds to close request ─────────────────────────────────────
  async function handleResolve(resolved: boolean) {
    if (!sessionId) return
    try {
      await fetch('/api/support/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, resolved }),
      })
      if (resolved) {
        setChatState('closed')
      } else {
        setChatState('chat')
        fetchMessages(sessionId)
      }
    } catch { /* ignore */ }
  }

  function handleNewChat() {
    localStorage.removeItem(STORAGE_KEY)
    setSessionId(null)
    setMessages([])
    setFirstMsg('')
    setInputText('')
    setError('')
    setChatState('new_user')
  }

  const showDot = hasNewMsg || (chatState === 'pending_close' && !open)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: '#8B1A2F', boxShadow: '0 8px 24px rgba(139,26,47,0.45)' }}
        aria-label={open ? 'Закрыть чат' : 'Открыть чат поддержки'}
      >
        {showDot && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2"
            style={{ borderColor: '#8B1A2F' }} />
        )}
        {open
          ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        }
      </button>

      {/* ── Chat popup ── */}
      <div
        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
        style={{
          background:    '#120508',
          border:        '1px solid rgba(139,26,47,0.35)',
          opacity:       open ? 1 : 0,
          transform:     open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          pointerEvents: open ? 'auto' : 'none',
          height:        chatState === 'new_user' ? 'auto' : '480px',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0"
          style={{ background: 'rgba(139,26,47,0.9)' }}>
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {clientName ? `Чат — ${clientName}` : 'Поддержка EASTWIND'}
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {chatState === 'chat'          && 'Ответим в ближайшее время'}
              {chatState === 'pending_close' && '⏳ Менеджер закрывает диалог'}
              {chatState === 'closed'        && 'Диалог завершён'}
              {chatState === 'new_user'      && 'Ответим в ближайшее время'}
              {chatState === 'loading'       && ''}
            </p>
          </div>
        </div>

        {/* ── loading ── */}
        {chatState === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full"
                  style={{ background: 'rgba(139,26,47,0.6)', animation: `ewpulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── new_user: start chat form ── */}
        {chatState === 'new_user' && (
          <form onSubmit={handleFirstMessage} className="p-4 space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(245,240,232,0.4)' }}>Ваше имя</label>
              <input
                type="text" value={nameInput} onChange={e => setNameInput(e.target.value)}
                placeholder="Как вас зовут?" required maxLength={100}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.1)', color: '#F5F0E8' }}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(245,240,232,0.4)' }}>Сообщение</label>
              <textarea
                ref={firstMsgRef} value={firstMsg} onChange={e => setFirstMsg(e.target.value)}
                placeholder="Ваш вопрос или обращение..." required rows={3} maxLength={2000}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.1)', color: '#F5F0E8' }}
              />
            </div>
            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
            <button type="submit"
              disabled={sending || !nameInput.trim() || !firstMsg.trim()}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: '#8B1A2F' }}>
              {sending ? 'Отправляем…' : 'Начать чат →'}
            </button>
          </form>
        )}

        {/* ── chat: messages + input ── */}
        {chatState === 'chat' && (
          <>
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.length === 0
                ? <p className="text-center text-xs py-8" style={{ color: 'rgba(245,240,232,0.25)' }}>
                    Начните переписку
                  </p>
                : messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%] text-sm leading-relaxed px-3.5 py-2.5"
                      style={{
                        background:   msg.sender === 'client' ? 'rgba(139,26,47,0.55)' : 'rgba(245,240,232,0.1)',
                        color:        '#F5F0E8',
                        borderRadius: msg.sender === 'client' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.sender === 'manager' && (
                        <p className="text-[9px] font-bold mb-1 uppercase tracking-widest"
                          style={{ color: 'rgba(245,240,232,0.5)' }}>Менеджер</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <p className="text-[9px] mt-1 text-right" style={{ color: 'rgba(245,240,232,0.35)' }}>
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="flex gap-2 p-3 shrink-0"
              style={{ borderTop: '1px solid rgba(245,240,232,0.07)' }}>
              <textarea
                ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)}
                placeholder="Написать…" rows={1} maxLength={2000}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none resize-none"
                style={{
                  background: 'rgba(245,240,232,0.06)',
                  border:     '1px solid rgba(245,240,232,0.1)',
                  color:      '#F5F0E8',
                  maxHeight:  '80px',
                }}
              />
              <button type="submit" disabled={sending || !inputText.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 self-end transition-opacity disabled:opacity-40"
                style={{ background: '#8B1A2F' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </>
        )}

        {/* ── pending_close: "Вопрос решён?" ── */}
        {chatState === 'pending_close' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="text-4xl">🤝</div>
            <div>
              <p className="font-semibold text-sm mb-1.5" style={{ color: '#F5F0E8' }}>
                Менеджер завершил диалог
              </p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)' }}>
                Ваш вопрос решён?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => handleResolve(true)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.45)' }}>
                ✓ Да, спасибо
              </button>
              <button onClick={() => handleResolve(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: 'rgba(245,240,232,0.07)', border: '1px solid rgba(245,240,232,0.15)', color: '#F5F0E8' }}>
                Нет, ещё нет
              </button>
            </div>
          </div>
        )}

        {/* ── closed ── */}
        {chatState === 'closed' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="text-4xl">✅</div>
            <div>
              <p className="font-semibold text-sm mb-1.5" style={{ color: '#F5F0E8' }}>Диалог завершён</p>
              <p className="text-xs" style={{ color: 'rgba(245,240,232,0.5)' }}>Спасибо за обращение!</p>
            </div>
            <button onClick={handleNewChat}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: '#8B1A2F' }}>
              Новый диалог
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ewpulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </>
  )
}
