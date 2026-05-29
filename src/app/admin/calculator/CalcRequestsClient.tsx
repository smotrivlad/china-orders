'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Row {
  id: string; created_at: string; category: string | null; order_type: string | null
  route: string | null; weight: number | null; volume: number | null; density: number | null
  places: number | null; packaging: string | null; insurance_rate: number | null
  product_cost: number | null; buyout_percent: number | null
  total_min: number | null; total_max: number | null
  converted_to_order: boolean; session_id: string | null
}
interface Stats { weekCount: number; monthCount: number; conversionRate: number; avgTotal: number }

const ORDER_TYPE: Record<string, string> = { personal: 'Личный', group: 'Совместный' }
const ROUTE: Record<string, string> = {
  ural: 'Через Уральск', tk_energy: 'ТК Энергия', both: 'Оба маршрута',
}
const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`

export default function CalcRequestsClient({ rows, stats, currentFilter }: {
  rows: Row[]; stats: Stats; currentFilter?: string
}) {
  const [selected, setSelected] = useState<Row | null>(null)

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'За неделю',      value: stats.weekCount.toString(),     sub: 'расчётов' },
          { label: 'За месяц',       value: stats.monthCount.toString(),    sub: 'расчётов' },
          { label: 'Конверсия',      value: `${stats.conversionRate}%`,     sub: 'в заявки (месяц)' },
          { label: 'Средний чек',    value: stats.avgTotal ? rub(stats.avgTotal) : '—', sub: 'месяц' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          [undefined,       'Все'],
          ['converted',     'Конверсии'],
          ['not_converted', 'Без заявки'],
        ].map(([f, label]) => (
          <Link
            key={label}
            href={f ? `/admin/calculator?filter=${f}` : '/admin/calculator'}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              currentFilter === f
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
        <span className="text-sm text-gray-500 flex items-center">{rows.length} записей</span>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">Расчётов нет</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Тип</th>
                  <th className="px-4 py-3 font-medium">Категория</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Заявка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.id} onClick={() => setSelected(row)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ORDER_TYPE[row.order_type ?? ''] ?? row.order_type ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                      {row.category ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {row.total_min && row.total_max
                        ? row.total_min === row.total_max
                          ? rub(row.total_max)
                          : `${Math.round(row.total_min).toLocaleString('ru-RU')} – ${rub(row.total_max)}`
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      {row.converted_to_order
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Оформлена</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-bold text-lg text-gray-900">Детали расчёта</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Дата',        new Date(selected.created_at).toLocaleString('ru-RU')],
                ['Тип заказа',  ORDER_TYPE[selected.order_type ?? ''] ?? selected.order_type],
                ['Категория',   selected.category],
                ['Маршрут',     ROUTE[selected.route ?? ''] ?? selected.route],
                ['Вес',         selected.weight ? `${selected.weight} кг` : null],
                ['Объём',       selected.volume ? `${Number(selected.volume).toFixed(4)} м³` : null],
                ['Плотность',   selected.density ? `${Math.round(Number(selected.density))} кг/м³` : null],
                ['Мест',        selected.places],
                ['Упаковка',    selected.packaging],
                ['Страховка',   selected.insurance_rate ? `${selected.insurance_rate}%` : null],
                ['Ст-ть товара',selected.product_cost ? `$${selected.product_cost}` : null],
                ['% выкупа',    selected.buyout_percent ? `${selected.buyout_percent}%` : null],
                ['Итого мин',   selected.total_min ? rub(Number(selected.total_min)) : null],
                ['Итого макс',  selected.total_max ? rub(Number(selected.total_max)) : null],
                ['Заявка',      selected.converted_to_order ? '✓ Оформлена' : 'Нет'],
              ].map(([label, val]) => val != null && (
                <div key={String(label)} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
