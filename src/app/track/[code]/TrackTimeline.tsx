'use client'
import { motion } from 'framer-motion'
import type { Order, Status } from '@/types'

const ALL_STATUSES = [
  { code: 'new',               name: 'Новая',               desc: 'Заявка получена и ожидает обработки' },
  { code: 'in_progress',       name: 'Принята в работу',    desc: 'Менеджер приступил к вашему заказу' },
  { code: 'searching_supplier',name: 'Ищем поставщика',     desc: 'Подбираем лучшего поставщика' },
  { code: 'supplier_found',    name: 'Найден поставщик',    desc: 'Поставщик найден, согласовываем условия' },
  { code: 'purchase',          name: 'Выкуп',               desc: 'Товар оплачен и ожидает отправки' },
  { code: 'shipping',          name: 'Едет в Россию',       desc: 'Товар на пути к вам' },
  { code: 'ready_for_pickup',  name: 'Готово к выдаче',     desc: 'Товар прибыл и ожидает вас' },
  { code: 'completed',         name: 'Завершена',           desc: 'Заказ успешно выдан' },
]

const statusIndex: Record<string, number> = Object.fromEntries(ALL_STATUSES.map((s, i) => [s.code, i]))

export default function TrackTimeline({ order }: { order: Order & { statuses: Status } }) {
  const currentIdx = statusIndex[order.statuses.code] ?? 0

  return (
    <div>
      {ALL_STATUSES.map((s, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx

        return (
          <motion.div
            key={s.code}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="flex gap-4"
          >
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                style={{
                  background: active ? '#8B1A2F' : done ? 'rgba(139,26,47,0.25)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#F5F0E8' : done ? '#8B1A2F' : 'rgba(245,240,232,0.25)',
                  boxShadow: active ? '0 0 0 4px rgba(139,26,47,0.2)' : 'none',
                  border: active || done ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {done ? '✓' : active ? '●' : i + 1}
              </div>
              {i < ALL_STATUSES.length - 1 && (
                <div className="w-px my-1 flex-1" style={{ minHeight: 20 }}>
                  <div className="w-full h-full" style={{ background: done ? 'rgba(139,26,47,0.35)' : 'rgba(255,255,255,0.07)' }} />
                </div>
              )}
            </div>

            {/* Text */}
            <div className={`pb-5 flex-1 ${i === ALL_STATUSES.length - 1 ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-semibold"
                  style={{ color: active ? '#F5F0E8' : done ? 'rgba(245,240,232,0.55)' : 'rgba(245,240,232,0.22)' }}
                >
                  {s.name}
                </span>
                {active && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,26,47,0.15)', color: 'rgba(139,26,47,0.9)' }}>
                    текущий
                  </span>
                )}
              </div>
              {(active || done) && (
                <p className="text-xs mt-0.5"
                  style={{ color: active ? 'rgba(245,240,232,0.45)' : 'rgba(245,240,232,0.28)' }}>
                  {s.desc}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
