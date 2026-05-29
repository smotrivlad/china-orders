'use client'
import { useState } from 'react'

interface Tariff {
  id: string; category: string; category_label: string
  density_min: number; density_max: number | null
  slow_price: number; fast_price: number; sort_order: number
}
interface Setting { key: string; value: string; label: string }

const SETTING_ORDER = [
  'usd_rub','loaders_almaty','almaty_uralsk_min','almaty_uralsk_max',
  'uralsk_tolyatti_min','uralsk_tolyatti_max','tk_energia_per_kg','notify_telegram',
]

export default function TariffsClient({ initialTariffs, initialSettings }: {
  initialTariffs: Tariff[]
  initialSettings: Setting[]
}) {
  const [tariffs,  setTariffs]  = useState<Tariff[]>(initialTariffs)
  const [settings, setSettings] = useState<Setting[]>(initialSettings)
  const [saving,   setSaving]   = useState<Record<string, boolean>>({})
  const [saved,    setSaved]    = useState<Record<string, boolean>>({})

  const categories = [...new Map(tariffs.map(t => [t.category, t.category_label])).entries()]
    .sort((a, b) => {
      const sA = initialTariffs.find(t => t.category === a[0])?.sort_order ?? 0
      const sB = initialTariffs.find(t => t.category === b[0])?.sort_order ?? 0
      return sA - sB
    })

  async function saveTariff(id: string, slow_price: number, fast_price: number) {
    setSaving(s => ({ ...s, [id]: true }))
    await fetch('/api/admin/tariffs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'tariff', id, slow_price, fast_price }),
    })
    setSaving(s => ({ ...s, [id]: false }))
    setSaved(s => ({ ...s, [id]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000)
  }

  async function saveSetting(key: string, value: string) {
    setSaving(s => ({ ...s, [key]: true }))
    await fetch('/api/admin/tariffs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'setting', key, value }),
    })
    setSaving(s => ({ ...s, [key]: false }))
    setSaved(s => ({ ...s, [key]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000)
  }

  const updateTariff = (id: string, field: 'slow_price' | 'fast_price', val: string) => {
    setTariffs(ts => ts.map(t => t.id === id ? { ...t, [field]: parseFloat(val) || 0 } : t))
  }

  const updateSetting = (key: string, val: string) => {
    setSettings(ss => ss.map(s => s.key === key ? { ...s, value: val } : s))
  }

  const sortedSettings = SETTING_ORDER
    .map(k => settings.find(s => s.key === k))
    .filter(Boolean) as Setting[]

  return (
    <div className="space-y-8">

      {/* ── Tariff tables by category ──────────────────────────────── */}
      {categories.map(([cat, label]) => {
        const rows = tariffs.filter(t => t.category === cat).sort((a, b) => a.density_min - b.density_min)
        return (
          <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-2.5 font-medium">Плотность (кг/м³)</th>
                  <th className="px-5 py-2.5 font-medium">Авто медленное ($/кг)</th>
                  <th className="px-5 py-2.5 font-medium">Авто быстрое ($/кг)</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(t => (
                  <tr key={t.id}>
                    <td className="px-5 py-3 text-gray-700 font-mono text-xs">
                      {t.density_min} – {t.density_max ?? '∞'}
                    </td>
                    <td className="px-5 py-2">
                      <input
                        type="number" step="0.1" min="0"
                        value={t.slow_price}
                        onChange={e => updateTariff(t.id, 'slow_price', e.target.value)}
                        onBlur={() => saveTariff(t.id, t.slow_price, t.fast_price)}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        type="number" step="0.1" min="0"
                        value={t.fast_price}
                        onChange={e => updateTariff(t.id, 'fast_price', e.target.value)}
                        onBlur={() => saveTariff(t.id, t.slow_price, t.fast_price)}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {saving[t.id] && <span className="text-xs text-gray-400">⏳</span>}
                      {saved[t.id]  && <span className="text-xs text-green-600">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* ── Settings ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Настройки маршрутов и курс</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          {sortedSettings.map(s => (
            <div key={s.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{s.label}</label>
              {s.key === 'notify_telegram' ? (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.value === 'true'}
                      onChange={e => {
                        const v = e.target.checked ? 'true' : 'false'
                        updateSetting(s.key, v)
                        saveSetting(s.key, v)
                      }}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-sm text-gray-700">Включено</span>
                  </label>
                  {saved[s.key] && <span className="text-xs text-green-600">✓</span>}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number" step="0.01" min="0"
                    value={s.value}
                    onChange={e => updateSetting(s.key, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                  <button
                    onClick={() => saveSetting(s.key, s.value)}
                    disabled={saving[s.key]}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {saving[s.key] ? '⏳' : saved[s.key] ? '✓' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
