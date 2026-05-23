'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { orderSchema, OrderFormData } from '@/lib/validations/order'

const STEPS = ['Личные данные', 'О товарах', 'Параметры']

const STEP_FIELDS: (keyof OrderFormData)[][] = [
  ['first_name', 'last_name', 'contact'],
  [], // товары управляются отдельным state
  ['urgency', 'order_type'],
]

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -48 : 48, opacity: 0 }),
}

/* ── Типы для черновика товаров ─────────────────────────────────────── */
type ItemDraft = {
  product_name: string
  description:  string
  link:         string
  files:        File[]
  fileError:    string
}

const emptyItem = (): ItemDraft => ({
  product_name: '',
  description:  '',
  link:         '',
  files:        [],
  fileError:    '',
})

const MAX_ITEMS     = 10
const MAX_FILE_MB   = 8
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

export default function OrderWizard() {
  const router = useRouter()
  const [step, setStep]         = useState(0)
  const [dir,  setDir]          = useState(1)
  const [loading, setLoading]   = useState(false)
  const [serverError, setServerError] = useState('')

  /* ── Товары ──────────────────────────────────────────────────────── */
  const [items, setItems]           = useState<ItemDraft[]>([emptyItem()])
  const [itemErrors, setItemErrors] = useState<string[]>([''])

  /* ── React-hook-form (шаг 0 + шаг 2) ────────────────────────────── */
  const {
    register, handleSubmit, trigger, watch, setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { urgency: 'normal', order_type: 'personal' },
  })

  const urgency   = watch('urgency')
  const orderType = watch('order_type')

  /* ── Навигация ───────────────────────────────────────────────────── */
  const next = async () => {
    if (step === 1) {
      // Валидируем товары вручную
      const errs = items.map(item =>
        item.product_name.trim() ? '' : 'Введите название товара',
      )
      setItemErrors(errs)
      if (errs.some(Boolean)) return
      setDir(1)
      setStep(s => s + 1)
      return
    }
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    setDir(1)
    setStep(s => s + 1)
  }

  const prev = () => { setDir(-1); setStep(s => s - 1) }

  /* ── Helpers для items ───────────────────────────────────────────── */
  const updateItem = (idx: number, field: keyof Pick<ItemDraft, 'product_name' | 'description' | 'link'>, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
    if (field === 'product_name' && value.trim()) {
      setItemErrors(prev => prev.map((e, i) => i === idx ? '' : e))
    }
  }

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return
    setItems(prev => [...prev, emptyItem()])
    setItemErrors(prev => [...prev, ''])
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
    setItemErrors(prev => prev.filter((_, i) => i !== idx))
  }

  const handleFilesChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    const tooBig   = selected.find(f => f.size > MAX_FILE_BYTES)
    if (tooBig) {
      setItems(prev => prev.map((it, i) =>
        i === idx
          ? { ...it, fileError: `Файл "${tooBig.name}" превышает ${MAX_FILE_MB} МБ` }
          : it,
      ))
      e.target.value = ''
      return
    }
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, files: selected, fileError: '' } : it,
    ))
  }

  /* ── Submit ──────────────────────────────────────────────────────── */
  const onSubmit = async (data: OrderFormData) => {
    // Финальная валидация товаров
    const errs = items.map(it => it.product_name.trim() ? '' : 'Введите название товара')
    setItemErrors(errs)
    if (errs.some(Boolean)) {
      setDir(-1); setStep(1); return
    }

    setLoading(true)
    setServerError('')

    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, v as string))

    // Товары как JSON (текстовые поля)
    fd.append('items', JSON.stringify(
      items.map(({ product_name, description, link }) => ({
        product_name,
        description: description || undefined,
        link:        link        || undefined,
      })),
    ))

    // Файлы каждого товара отдельно: files_0, files_1, …
    items.forEach((item, i) => {
      item.files.forEach(f => fd.append(`files_${i}`, f))
    })

    try {
      const res  = await fetch('/api/orders', { method: 'POST', body: fd })
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
    } catch {
      setLoading(false)
      setServerError('Не удалось отправить заявку. Проверьте интернет-соединение и попробуйте снова.')
    }
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex items-start gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step   ? 'bg-burgundy text-milk' :
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
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── Шаг 0: Личные данные ─────────────────────────────────────── */}
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

          {/* ── Шаг 1: Товары ────────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {items.map((item, idx) => (
                <div key={idx}
                  className="rounded-xl p-4 space-y-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,240,232,0.08)',
                  }}
                >
                  {/* Заголовок товара */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(245,240,232,0.4)' }}>
                      Товар {idx + 1}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-xs transition-colors hover:opacity-100"
                        style={{ color: 'rgba(245,240,232,0.3)' }}
                      >
                        Удалить ×
                      </button>
                    )}
                  </div>

                  {/* Название */}
                  <Field label="Название товара" error={itemErrors[idx]}>
                    <input
                      value={item.product_name}
                      onChange={e => updateItem(idx, 'product_name', e.target.value)}
                      placeholder="Например: кроссовки Nike Air Max"
                      className={`field-input ${itemErrors[idx] ? 'error' : ''}`}
                    />
                  </Field>

                  {/* Описание */}
                  <Field label="Описание (цвет, размер, количество)">
                    <textarea
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Укажите детали"
                      className="field-input min-h-[80px] resize-none"
                    />
                  </Field>

                  {/* Ссылка */}
                  <Field label="Ссылка на товар">
                    <input
                      value={item.link}
                      onChange={e => updateItem(idx, 'link', e.target.value)}
                      placeholder="https://item.taobao.com/..."
                      className="field-input"
                    />
                  </Field>

                  {/* Файлы */}
                  <div>
                    <label className="field-label mb-2">Фото / файлы</label>
                    <label
                      htmlFor={`files-${idx}`}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 cursor-pointer hover:border-burgundy/35 hover:bg-burgundy/[0.04] transition-all"
                    >
                      <span className="text-lg">📎</span>
                      <span className="text-sm" style={{ color: 'rgba(245,240,232,0.38)' }}>
                        {item.files.length > 0
                          ? `${item.files.length} файл(ов) выбрано`
                          : 'Прикрепить фото или файлы'}
                      </span>
                    </label>
                    <input
                      id={`files-${idx}`}
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => handleFilesChange(idx, e)}
                    />
                    {item.fileError && (
                      <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>{item.fileError}</p>
                    )}
                    {item.files.length > 0 && !item.fileError && (
                      <ul className="mt-2 space-y-1">
                        {item.files.map((f, fi) => (
                          <li key={fi} className="flex items-center gap-2 text-xs"
                            style={{ color: 'rgba(245,240,232,0.45)' }}>
                            <span style={{ color: '#8B1A2F' }}>📄</span>
                            {f.name}
                            <span className="ml-auto" style={{ color: 'rgba(245,240,232,0.25)' }}>
                              ({(f.size / 1024).toFixed(0)} KB)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}

              {/* Кнопка добавить */}
              {items.length < MAX_ITEMS && (
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full rounded-xl border border-dashed border-white/15 py-3 text-sm transition-all"
                  style={{ color: 'rgba(245,240,232,0.35)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,26,47,0.4)'
                    e.currentTarget.style.color = 'rgba(245,240,232,0.7)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.color = 'rgba(245,240,232,0.35)'
                  }}
                >
                  + Добавить ещё товар
                </button>
              )}
            </motion.div>
          )}

          {/* ── Шаг 2: Параметры ─────────────────────────────────────────── */}
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
                    ['urgent', 'Срочная', '15–20 дней', '⚡'],
                  ] as const).map(([val, label, sub, icon]) => {
                    const active = urgency === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setValue('urgency', val, { shouldValidate: true })}
                        className="glass rounded-xl p-4 text-left transition-all"
                        style={{
                          border:     active ? '1px solid rgba(139,26,47,0.5)' : '1px solid transparent',
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
                <input type="hidden" {...register('urgency')} />
              </div>

              <div>
                <span className="field-label mb-3">Тип заказа</span>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['personal', 'Личный',    'Только для вас',     '👤'],
                    ['group',   'Совместный', 'Разделяем стоимость', '👥'],
                  ] as const).map(([val, label, sub, icon]) => {
                    const active = orderType === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setValue('order_type', val, { shouldValidate: true })}
                        className="glass rounded-xl p-4 text-left transition-all"
                        style={{
                          border:     active ? '1px solid rgba(139,26,47,0.5)' : '1px solid transparent',
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
                <input type="hidden" {...register('order_type')} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {serverError && (
          <p className="mt-4 rounded-xl p-3 text-sm"
            style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.2)', color: '#fca5a5' }}>
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
