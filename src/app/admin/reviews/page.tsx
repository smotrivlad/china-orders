'use client'

import { useEffect, useState } from 'react'

interface Review {
  id: string
  client_name: string
  text: string
  photo_url: string | null
  is_published: boolean
  created_at: string
}

const empty = { client_name: '', text: '', photo_url: '', is_published: true }

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/reviews')
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(r: Review) {
    setEditId(r.id)
    setForm({ client_name: r.client_name, text: r.text, photo_url: r.photo_url ?? '', is_published: r.is_published })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(empty)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.client_name.trim() || !form.text.trim()) {
      setError('Имя и текст обязательны')
      return
    }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/reviews/${editId}` : '/api/admin/reviews'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photo_url: form.photo_url || null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Ошибка сохранения')
        return
      }
      setEditId(null)
      setForm(empty)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(r: Review) {
    await fetch(`/api/admin/reviews/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !r.is_published }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить отзыв?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Отзывы</h1>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {editId ? 'Редактировать отзыв' : 'Добавить отзыв'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Имя клиента *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder="Артём К."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Фото (URL, необязательно)</label>
              <input
                type="text"
                value={form.photo_url}
                onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Текст отзыва *</label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              rows={4}
              placeholder="Текст отзыва..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_published"
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="rounded border-gray-300 text-red-800 focus:ring-red-800/30"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700">Опубликован</label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение...' : editId ? 'Сохранить' : 'Добавить'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Загрузка...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Отзывов пока нет.</p>
        ) : (
          reviews.map(r => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 transition-opacity ${!r.is_published ? 'opacity-60' : ''}`}
              style={{ borderColor: r.is_published ? '#e5e7eb' : '#fcd34d' }}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-red-50 border border-red-200 text-red-800">
                {r.client_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900">{r.client_name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${r.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.is_published ? 'Опубликован' : 'Скрыт'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-3">{r.text}</p>
                {r.photo_url && (
                  <a href={r.photo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    📷 Фото
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(r)}
                  title={r.is_published ? 'Скрыть' : 'Опубликовать'}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                >
                  {r.is_published ? '🙈' : '👁'}
                </button>
                <button
                  onClick={() => startEdit(r)}
                  title="Редактировать"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  title="Удалить"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-sm hover:bg-red-50 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
