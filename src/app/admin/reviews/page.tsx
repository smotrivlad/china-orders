'use client'

import { useEffect, useRef, useState } from 'react'

interface ReviewPhoto {
  id: string
  url: string
  sort_order: number
}

interface Review {
  id: string
  client_name: string
  text: string
  is_published: boolean
  created_at: string
  photos: ReviewPhoto[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const emptyForm = { client_name: '', text: '', is_published: true, created_at: todayStr() }

export default function AdminReviewsPage() {
  const [reviews, setReviews]     = useState<Review[]>([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [error, setError]         = useState('')

  // Per-review photo upload state (keyed by review_id)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadErr, setUploadErr] = useState<Record<string, string>>({})
  const fileInputRefs             = useRef<Record<string, HTMLInputElement | null>>({})

  // ── Data loading ────────────────────────────────────────────────────────────

  async function loadReviews() {
    setLoading(true)
    const res  = await fetch('/api/admin/reviews')
    const data = await res.json()

    // For each review load its photos
    const withPhotos: Review[] = await Promise.all(
      (data.reviews ?? []).map(async (r: Omit<Review, 'photos'>) => {
        const pr   = await fetch(`/api/admin/reviews/${r.id}/photos`)
        const pd   = await pr.json()
        return { ...r, photos: pd.photos ?? [] }
      }),
    )
    setReviews(withPhotos)
    setLoading(false)
  }

  useEffect(() => { loadReviews() }, [])

  // ── Text form ────────────────────────────────────────────────────────────────

  function startEdit(r: Review) {
    setEditId(r.id)
    setForm({
      client_name: r.client_name,
      text: r.text,
      is_published: r.is_published,
      created_at: r.created_at.split('T')[0],   // YYYY-MM-DD for date input
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(emptyForm)
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
      const url    = editId ? `/api/admin/reviews/${editId}` : '/api/admin/reviews'
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Ошибка сохранения')
        return
      }
      setEditId(null)
      setForm(emptyForm)
      await loadReviews()
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
    await loadReviews()
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Удалить отзыв и все его фото?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await loadReviews()
  }

  // ── Photo upload ─────────────────────────────────────────────────────────────

  async function handlePhotoUpload(reviewId: string, files: FileList | null) {
    if (!files || files.length === 0) return

    const review = reviews.find(r => r.id === reviewId)
    const freeSlots = 4 - (review?.photos.length ?? 0)
    const toUpload = Array.from(files).slice(0, freeSlots)

    if (toUpload.length === 0) {
      setUploadErr(prev => ({ ...prev, [reviewId]: 'Уже 4 фото — максимум' }))
      return
    }

    setUploading(prev => ({ ...prev, [reviewId]: true }))
    setUploadErr(prev => ({ ...prev, [reviewId]: '' }))

    for (const file of toUpload) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/reviews/${reviewId}/photos`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const d = await res.json()
        setUploadErr(prev => ({ ...prev, [reviewId]: d.error ?? 'Ошибка загрузки' }))
      }
    }

    setUploading(prev => ({ ...prev, [reviewId]: false }))
    await loadReviews()
  }

  async function handleDeletePhoto(reviewId: string, photoId: string) {
    if (!confirm('Удалить фото?')) return
    const res = await fetch(`/api/admin/reviews/${reviewId}/photos/${photoId}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? 'Ошибка удаления')
      return
    }
    await loadReviews()
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Отзывы</h1>

      {/* ── Add / Edit form ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {editId ? 'Редактировать отзыв' : 'Добавить отзыв'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Текст отзыва *</label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              rows={4}
              placeholder="Текст отзыва..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30 resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата отзыва</label>
              <input
                type="date"
                value={form.created_at}
                onChange={e => setForm(f => ({ ...f, created_at: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800/30"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="is_published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Опубликован</span>
              </label>
            </div>
          </div>

          {editId && (
            <p className="text-xs text-gray-400">
              💡 Фотографии загружаются отдельно — в карточке отзыва ниже после сохранения.
            </p>
          )}

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

      {/* ── Reviews list ── */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Загрузка...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">Отзывов пока нет.</p>
        ) : (
          reviews.map(r => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border shadow-sm transition-opacity ${!r.is_published ? 'opacity-60' : ''}`}
              style={{ borderColor: r.is_published ? '#e5e7eb' : '#fcd34d' }}
            >
              {/* ── Review header ── */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
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
                      {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-3 whitespace-pre-line">
                    {r.text}
                  </p>
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
                    title="Редактировать текст"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    title="Удалить отзыв"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-sm hover:bg-red-50 transition-colors"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* ── Photos section ── */}
              <div
                className="px-5 pb-5 pt-0 border-t border-gray-100"
              >
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500">
                      Фотографии ({r.photos.length}/4)
                    </span>
                    {r.photos.length < 4 && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[r.id]?.click()}
                          disabled={uploading[r.id]}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {uploading[r.id] ? (
                            <>
                              <span className="animate-spin inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                              Загрузка...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Загрузить фото
                            </>
                          )}
                        </button>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          ref={el => { fileInputRefs.current[r.id] = el }}
                          onChange={e => handlePhotoUpload(r.id, e.target.files)}
                        />
                      </>
                    )}
                  </div>

                  {uploadErr[r.id] && (
                    <p className="text-xs text-red-500 mb-2">{uploadErr[r.id]}</p>
                  )}

                  {/* Photo grid */}
                  {r.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {r.photos.map((p, i) => (
                        <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={p.url}
                            alt={`Фото ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Delete overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                            <button
                              onClick={() => handleDeletePhoto(r.id, p.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700"
                              title="Удалить фото"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          {/* Order badge */}
                          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center font-bold">
                            {i + 1}
                          </div>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {r.photos.length < 4 && Array.from({ length: 4 - r.photos.length }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                          onClick={() => fileInputRefs.current[r.id]?.click()}
                        >
                          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 transition-colors"
                      onClick={() => fileInputRefs.current[r.id]?.click()}
                    >
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-400">Нажмите чтобы добавить фото</p>
                      <p className="text-[10px] text-gray-300 mt-1">JPEG, PNG, WebP · до 5 МБ · макс. 4 шт.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
