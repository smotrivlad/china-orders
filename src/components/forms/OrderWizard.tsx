'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { orderSchema, OrderFormData } from '@/lib/validations/order'

const STEPS = ['Личные данные', 'О товаре', 'Параметры']

const STEP_FIELDS: (keyof OrderFormData)[][] = [
  ['first_name', 'last_name', 'contact'],
  ['product_name', 'description', 'link'],
  ['urgency', 'order_type'],
]

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
}

export default function OrderWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')

  const MAX_FILE_MB = 8
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { urgency: 'normal', order_type: 'personal' },
  })

  const urgency = watch('urgency')
  const orderType = watch('order_type')

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    setDir(1)
    setStep(s => s + 1)
  }

  const prev = () => {
    setDir(-1)
    setStep(s => s - 1)
  }

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true)
    setServerError('')
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, v as string))
    files.forEach(f => fd.append('files', f))

    try {
      const res = await fetch('/api/orders', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        const msg = typeof json.error === 'string'
          ? json.error
          : json.error?.formErrors?.[0] ?? `Ошибка сервера (${res.status}). Попробуйте ещё раз.`
        setServerError(msg)
        return
      }
      router.push(`/order/success?code=${json.code}`)
    } catch (e) {
      setLoading(false)
      setServerError('Не удалось отправить заявку. Проверьте интернет-соединение и попробуйте снова.')
    }
  }

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-start gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step  ? 'bg-burgundy text-milk' :
                i === step ? 'bg-burgundy text-milk ring-4 ring-burgundy/20' :
                'bg-white/5 text-milk/30 border border-white/10'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight whitespace-nowrap ${i === step ? 'text-milk' : 'text-milk/35'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-10px] bg-white/10 overflow-hidden">
                <div className={`h-full bg-burgundy transition-all duration-500 ${i < step ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ minHeight: 280 }}>
          <AnimatePresence mode="wait" custom={dir}>
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Имя" error={errors.first_name?.message}>
                    <input {...register('first_name')} placeholder="Иван"
                      className={`field-input ${errors.first_name ? 'error' : ''}`} />
                  </Field>
                  <Field label="Фамилия" error={errors.last_name?.message}>
                    <input {...register('last_name')} placeholder="Иванов"
                      className={`field-input ${errors.last_name ? 'error' : ''}`} />
                  </Field>
                </div>
                <Field label="Телефон или Telegram" error={errors.contact?.message}>
                  <input {...register('contact')} placeholder="+7 999 123 4567 или @username"
                    className={`field-input ${errors.contact ? 'error' : ''}`} />
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <Field label="Название товара" error={errors.product_name?.message}>
                  <input {...register('product_name')} placeholder="Например: кроссовки Nike Air Max"
                    className={`field-input ${errors.product_name ? 'error' : ''}`} />
                </Field>
                <Field label="Описание (цвет, размер, количество)">
                  <textarea {...register('description')}
                    placeholder="Укажите детали, важные при покупке"
                    className="field-input min-h-[96px] resize-none" />
                </Field>
                <Field label="Ссылка на товар">
                  <input {...register('link')} placeholder="https://item.taobao.com/..."
                    className="field-input" />
                </Field>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={variants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div>
                  <span className="field-label mb-3">Срочность</span>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['normal', 'Обычная', '25–40 дней', '🕐'],
                      ['urgent', 'Срочная',  '15–20 дней', '⚡'],
                    ] as const).map(([val, label, sub, icon]) => {
                      const active = urgency === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setValue('urgency', val, { shouldValidate: true })}
                          className="glass rounded-xl p-4 text-left transition-all"
                          style={{
                            border: active ? '1px solid rgba(139,26,47,0.5)' : '1px solid transparent',
                            background: active ? 'rgba(139,26,47,0.15)' : undefined,
                          }}
                        >
                          <div className="text-xl mb-1">{icon}</div>
                          <div className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{label}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{sub}</div>
                        </button>
                      )
                    })}
                  </div>
                  {/* скрытый input для react-hook-form */}
                  <input type="hidden" {...register('urgency')} />
                </div>

                <div>
                  <span className="field-label mb-3">Тип заказа</span>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['personal', 'Личный',     'Только для вас',      '👤'],
                      ['group',    'Совместный',  'Разделяем стоимость', '👥'],
                    ] as const).map(([val, label, sub, icon]) => {
                      const active = orderType === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setValue('order_type', val, { shouldValidate: true })}
                          className="glass rounded-xl p-4 text-left transition-all"
                          style={{
                            border: active ? '1px solid rgba(139,26,47,0.5)' : '1px solid transparent',
                            background: active ? 'rgba(139,26,47,0.15)' : undefined,
                          }}
                        >
                          <div className="text-xl mb-1">{icon}</div>
                          <div className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{label}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{sub}</div>
                        </button>
                      )
                    })}
                  </div>
                  {/* скрытый input для react-hook-form */}
                  <input type="hidden" {...register('order_type')} />
                </div>

                <div>
                  <label className="field-label mb-3">Фото / файлы (необязательно)</label>
                  {/* Используем label+htmlFor вместо programmatic .click() — надёжнее на iOS Safari */}
                  <label
                    htmlFor="order-files"
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-7 text-center cursor-pointer hover:border-burgundy/40 hover:bg-burgundy/5 transition-all"
                  >
                    <span className="text-3xl mb-2">📎</span>
                    <p className="text-sm text-milk/50">Нажмите, чтобы выбрать файлы</p>
                    <p className="text-xs text-milk/30 mt-1">PNG, JPG, PDF — до 8 МБ каждый</p>
                  </label>
                  <input
                    id="order-files"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const selected = Array.from(e.target.files ?? [])
                      const tooBig = selected.find(f => f.size > MAX_FILE_BYTES)
                      if (tooBig) {
                        setFileError(`Файл "${tooBig.name}" превышает ${MAX_FILE_MB} МБ. Выберите файл меньшего размера.`)
                        e.target.value = ''
                        return
                      }
                      setFileError('')
                      setFiles(selected)
                    }}
                  />
                  {fileError && (
                    <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{fileError}</p>
                  )}
                  {files.length > 0 && !fileError && (
                    <ul className="mt-3 space-y-1.5">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
                          <span style={{ color: '#8B1A2F' }}>📄</span>
                          {f.name}
                          <span className="ml-auto" style={{ color: 'rgba(245,240,232,0.3)' }}>
                            ({(f.size / 1024).toFixed(0)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {serverError && (
          <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.2)', color: '#fca5a5' }}>
            {serverError}
          </p>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button type="button" onClick={prev} className="btn-outline flex-1">
              ← Назад
            </button>
          )}
          {step < 2 ? (
            <button type="button" onClick={next} className="btn-primary flex-1 justify-center">
              Далее →
            </button>
          ) : (
            /* type="button" чтобы исключить случайный сабмит — вызываем handleSubmit явно */
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
              className="btn-primary flex-1 justify-center"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Отправляем...' : 'Отправить заявку →'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
