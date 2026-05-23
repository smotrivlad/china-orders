'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { orderSchema, OrderFormData } from '@/lib/validations/order'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

export default function OrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { urgency: 'normal', order_type: 'personal' },
  })

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true)
    setServerError('')
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, v as string))
    files.forEach((f) => fd.append('files', f))

    const res = await fetch('/api/orders', { method: 'POST', body: fd })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setServerError(json.error?.formErrors?.[0] ?? 'Ошибка при отправке')
      return
    }
    router.push(`/order/success?code=${json.code}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Ваши данные</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Имя" required {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Фамилия" required {...register('last_name')} error={errors.last_name?.message} />
        </div>
        <Input
          label="Контакт (телефон или Telegram)"
          placeholder="+7 999 123 4567 или @username"
          required
          {...register('contact')}
          error={errors.contact?.message}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Параметры заказа</h2>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Срочность</p>
          <div className="flex gap-4">
            {([['normal', '🕐 Обычная'], ['urgent', '⚡ Срочно']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={val} {...register('urgency')} className="accent-red-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Тип заказа</p>
          <div className="flex gap-4">
            {([['personal', '👤 Личный'], ['group', '👥 Совместный']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={val} {...register('order_type')} className="accent-red-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Фото / файлы</h2>
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-3xl mb-2">📎</span>
          <p className="text-sm text-gray-600">Нажмите, чтобы выбрать фото или файлы</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF — до 10 МБ каждый</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </div>
        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span>📄</span> {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

      <Button type="submit" loading={loading} className="w-full py-3 text-base">
        Отправить заявку
      </Button>
    </form>
  )
}
