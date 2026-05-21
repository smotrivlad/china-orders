import { z } from 'zod'

export const orderSchema = z.object({
  first_name: z.string().min(1, 'Введите имя'),
  last_name: z.string().min(1, 'Введите фамилию'),
  contact: z.string().min(1, 'Введите контакт (телефон или Telegram)'),
  product_name: z.string().min(1, 'Введите название товара'),
  description: z.string().optional(),
  link: z.string().optional(),
  urgency: z.enum(['normal', 'urgent']),
  order_type: z.enum(['personal', 'group']),
})

export type OrderFormData = z.infer<typeof orderSchema>
