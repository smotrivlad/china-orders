import { z } from 'zod'

/** Поля формы шаг 0 + шаг 2 (без товаров — они управляются отдельным state) */
export const orderSchema = z.object({
  first_name:  z.string().min(1, 'Введите имя'),
  last_name:   z.string().min(1, 'Введите фамилию'),
  contact:     z.string().min(1, 'Введите контакт (телефон или Telegram)'),
  urgency:     z.enum(['normal', 'urgent']),
  order_type:  z.enum(['personal', 'group']),
})

export type OrderFormData = z.infer<typeof orderSchema>
