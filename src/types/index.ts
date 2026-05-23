export type Status = {
  id: number
  code: string
  name: string
  sort_order: number
}

export type OrderItem = {
  product_name: string
  description?: string | null
  link?: string | null
  file_urls?: string[]
}

export type Order = {
  id: string
  code: string
  first_name: string
  last_name: string
  contact: string
  product_name: string
  description: string | null
  link: string | null
  urgency: 'normal' | 'urgent'
  order_type: 'personal' | 'group'
  status_id: number
  manager_comment: string | null
  file_urls: string[]
  items?: OrderItem[] | null
  client_chat_id?: bigint | number | null
  created_at: string
  updated_at: string
  statuses?: Status
}
