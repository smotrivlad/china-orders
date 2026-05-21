import { cn } from '@/lib/utils/cn'

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  searching_supplier: 'bg-yellow-100 text-yellow-700',
  supplier_found: 'bg-green-100 text-green-700',
  purchase: 'bg-purple-100 text-purple-700',
  shipping: 'bg-orange-100 text-orange-700',
  ready_for_pickup: 'bg-teal-100 text-teal-700',
  completed: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ code, name }: { code: string; name: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[code] ?? 'bg-gray-100 text-gray-700')}>
      {name}
    </span>
  )
}
