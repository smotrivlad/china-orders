'use client'
import { useState } from 'react'
import type { Order, Status } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'

export default function OrderEditor({ order, statuses }: { order: Order & { statuses: Status }; statuses: Status[] }) {
  const [statusId, setStatusId] = useState(order.status_id)
  const [comment, setComment] = useState(order.manager_comment ?? '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const currentStatus = statuses.find((s) => s.id === statusId) ?? order.statuses

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    setError('')
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_id: statusId, manager_comment: comment || null }),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Ошибка сохранения')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="font-semibold text-gray-900">Управление заявкой</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Статус</label>
        <div className="flex items-center gap-3">
          <select
            value={statusId}
            onChange={(e) => setStatusId(Number(e.target.value))}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Badge code={currentStatus.code} name={currentStatus.name} />
        </div>
      </div>

      <Textarea
        label="Комментарий для клиента"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Напишите комментарий — он будет виден клиенту при отслеживании заявки"
        rows={3}
      />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={loading}>Сохранить</Button>
        {saved && <span className="text-sm text-green-600">✓ Сохранено</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
