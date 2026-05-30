'use client'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tariff       { id: string; category: string; category_label: string; density_min: number; density_max: number | null; slow_price: number; fast_price: number; sort_order: number }
interface Setting      { key: string; value: string; label: string }
interface CommTier     { id: string; amount_to: number | null; rate: number; sort_order: number }
interface PackagingRow { id: string; value: string; label: string; price_min: number; price_max: number; per_m3: boolean; sort_order: number }
interface InsurRow     { id: string; vpk_to: number | null; rate: number; sort_order: number }

const DELIVERY_KEYS = ['loaders_almaty','almaty_uralsk_min','almaty_uralsk_max','uralsk_tolyatti_min','uralsk_tolyatti_max','tk_energia_per_kg','notify_telegram']
const cls = { input: 'w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30', btn: 'px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors', btnSm: 'px-2 py-1 rounded-lg text-xs font-medium transition-colors' }
const sectionCls = 'bg-white rounded-2xl border border-gray-200 overflow-hidden'
const headCls    = 'px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between'

// ── Helpers ───────────────────────────────────────────────────────────────────
function SaveMark({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) return <span className="text-xs text-gray-400 ml-1">⏳</span>
  if (saved)  return <span className="text-xs text-green-600 ml-1">✓</span>
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TariffsClient({
  initialTariffs, initialSettings,
  initialCommissionTiers, initialPackagingTypes, initialInsuranceTiers,
  cbrRate,
}: {
  initialTariffs:         Tariff[]
  initialSettings:        Setting[]
  initialCommissionTiers: CommTier[]
  initialPackagingTypes:  PackagingRow[]
  initialInsuranceTiers:  InsurRow[]
  cbrRate:                number | null
}) {
  const [tariffs,    setTariffs]    = useState(initialTariffs)
  const [settings,   setSettings]   = useState(initialSettings)
  const [commTiers,  setCommTiers]  = useState(initialCommissionTiers)
  const [packaging,  setPackaging]  = useState(initialPackagingTypes)
  const [insurance,  setInsurance]  = useState(initialInsuranceTiers)
  const [saving,     setSaving]     = useState<Record<string, boolean>>({})
  const [saved,      setSaved]      = useState<Record<string, boolean>>({})

  // ── Save helpers ─────────────────────────────────────────────────────────
  function markSaving(k: string) { setSaving(s => ({ ...s, [k]: true })) }
  function markSaved(k: string)  { setSaving(s => ({ ...s, [k]: false })); setSaved(s => ({ ...s, [k]: true })); setTimeout(() => setSaved(s => ({ ...s, [k]: false })), 2000) }

  async function patch(body: object, key: string) {
    markSaving(key)
    const r = await fetch('/api/admin/tariffs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await r.json()
    markSaved(key)
    return data
  }

  // ── Tariff rows ──────────────────────────────────────────────────────────
  async function saveTariff(id: string, slow: number, fast: number) {
    await patch({ type: 'tariff', id, slow_price: slow, fast_price: fast }, id)
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  function getSetting(key: string) { return settings.find(s => s.key === key)?.value ?? '' }
  function setSetting(key: string, val: string) { setSettings(ss => ss.map(s => s.key === key ? { ...s, value: val } : s)) }
  async function saveSetting(key: string, value: string) {
    await patch({ type: 'setting', key, value }, key)
  }

  const useCbr = getSetting('use_cbr_rate') !== 'false'
  const manualRate = getSetting('usd_rub')
  const displayRate = useCbr && cbrRate ? cbrRate.toFixed(2) : manualRate

  // ── Commission tiers ─────────────────────────────────────────────────────
  async function saveCommTier(tier: CommTier) {
    const isNew = tier.id.startsWith('tmp_')
    const data = await patch({
      type: 'commission_upsert',
      id: isNew ? undefined : tier.id,
      amount_to: tier.amount_to,
      rate: tier.rate,
      sort_order: tier.sort_order,
    }, tier.id)
    if (isNew && data.id) setCommTiers(ts => ts.map(t => t.id === tier.id ? { ...t, id: data.id } : t))
    else markSaved(tier.id)
  }
  function addCommTier() {
    const id = 'tmp_' + Date.now()
    setCommTiers(ts => [...ts, { id, amount_to: null, rate: 0, sort_order: ts.length + 1 }])
  }
  async function delCommTier(id: string) {
    if (!id.startsWith('tmp_')) await fetch('/api/admin/tariffs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'commission_delete', id }) })
    setCommTiers(ts => ts.filter(t => t.id !== id))
  }

  // ── Insurance tiers ──────────────────────────────────────────────────────
  async function saveInsurTier(tier: InsurRow) {
    const isNew = tier.id.startsWith('tmp_')
    const data = await patch({
      type: 'insurance_upsert',
      id: isNew ? undefined : tier.id,
      vpk_to: tier.vpk_to,
      rate: tier.rate,
      sort_order: tier.sort_order,
    }, tier.id)
    if (isNew && data.id) setInsurance(ts => ts.map(t => t.id === tier.id ? { ...t, id: data.id } : t))
    else markSaved(tier.id)
  }
  function addInsurTier() {
    const id = 'tmp_' + Date.now()
    setInsurance(ts => [...ts, { id, vpk_to: null, rate: 0, sort_order: ts.length + 1 }])
  }
  async function delInsurTier(id: string) {
    if (!id.startsWith('tmp_')) await fetch('/api/admin/tariffs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'insurance_delete', id }) })
    setInsurance(ts => ts.filter(t => t.id !== id))
  }

  // ── Packaging ────────────────────────────────────────────────────────────
  async function savePackaging(row: PackagingRow) {
    const isNew = row.id.startsWith('tmp_')
    const data = await patch({
      type: 'packaging_upsert',
      id: isNew ? undefined : row.id,
      label: row.label, price_min: row.price_min, price_max: row.price_max,
      per_m3: row.per_m3, sort_order: row.sort_order,
    }, row.id)
    if (isNew && data.id) setPackaging(rs => rs.map(r => r.id === row.id ? { ...r, id: data.id, value: data.value ?? r.value } : r))
    else markSaved(row.id)
  }
  function addPackaging() {
    const id = 'tmp_' + Date.now()
    setPackaging(rs => [...rs, { id, value: id, label: '', price_min: 0, price_max: 0, per_m3: false, sort_order: rs.length + 1 }])
  }
  async function delPackaging(id: string) {
    if (!id.startsWith('tmp_')) await fetch('/api/admin/tariffs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'packaging_delete', id }) })
    setPackaging(rs => rs.filter(r => r.id !== id))
  }

  const categories = [...new Map(tariffs.map(t => [t.category, t.category_label])).entries()]
    .sort((a, b) => (initialTariffs.find(t => t.category === a[0])?.sort_order ?? 0) - (initialTariffs.find(t => t.category === b[0])?.sort_order ?? 0))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── USD/RUB rate ───────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <div className={headCls}>
          <h3 className="font-semibold text-gray-900 text-sm">Курс USD/RUB</h3>
          <span className="text-sm font-bold text-gray-900">{displayRate} ₽/$
            <span className="ml-2 text-xs font-normal text-gray-400">{useCbr && cbrRate ? 'курс ЦБ' : 'вручную'}</span>
          </span>
        </div>
        <div className="p-5 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-red-600"
              checked={useCbr}
              onChange={e => {
                const v = e.target.checked ? 'true' : 'false'
                setSetting('use_cbr_rate', v)
                saveSetting('use_cbr_rate', v)
              }} />
            <span className="text-sm text-gray-700">Использовать курс ЦБ автоматически</span>
            {useCbr && cbrRate && <span className="text-xs text-gray-400">сейчас: {cbrRate.toFixed(2)} ₽/$</span>}
            <SaveMark saving={saving['use_cbr_rate']} saved={saved['use_cbr_rate']} />
          </label>
          {!useCbr && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Курс вручную:</span>
              <input type="number" step="0.01" min="0" value={manualRate}
                onChange={e => setSetting('usd_rub', e.target.value)}
                className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
              <button onClick={() => saveSetting('usd_rub', manualRate)} disabled={saving['usd_rub']}
                className={cls.btn}>
                {saving['usd_rub'] ? '⏳' : saved['usd_rub'] ? '✓' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Commission tiers ───────────────────────────────────────────── */}
      <div className={sectionCls}>
        <div className={headCls}>
          <h3 className="font-semibold text-gray-900 text-sm">Комиссия за выкуп</h3>
          <button onClick={addCommTier} className={`${cls.btnSm} bg-red-50 text-red-700 hover:bg-red-100`}>+ Добавить порог</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-5 py-2.5 font-medium">До суммы (₽) — пусто = «и выше»</th>
              <th className="px-5 py-2.5 font-medium">Комиссия (%)</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commTiers.map(tier => (
              <tr key={tier.id}>
                <td className="px-5 py-2">
                  <input type="number" min="0" step="1000"
                    value={tier.amount_to ?? ''}
                    placeholder="∞ (без ограничения)"
                    onChange={e => setCommTiers(ts => ts.map(t => t.id === tier.id ? { ...t, amount_to: e.target.value ? Number(e.target.value) : null } : t))}
                    onBlur={() => saveCommTier(tier)}
                    className={`${cls.input} w-52`} />
                </td>
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="0.5"
                      value={tier.rate}
                      onChange={e => setCommTiers(ts => ts.map(t => t.id === tier.id ? { ...t, rate: Number(e.target.value) } : t))}
                      onBlur={() => saveCommTier(tier)}
                      className={`${cls.input} w-24`} />
                    <span className="text-gray-500 text-xs">%</span>
                    <SaveMark saving={saving[tier.id]} saved={saved[tier.id]} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => delCommTier(tier.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Insurance tiers ────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <div className={headCls}>
          <h3 className="font-semibold text-gray-900 text-sm">Тарифы страховки</h3>
          <button onClick={addInsurTier} className={`${cls.btnSm} bg-red-50 text-red-700 hover:bg-red-100`}>+ Добавить порог</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-5 py-2.5 font-medium">Ст-ть/кг до ($/кг) — пусто = «и выше»</th>
              <th className="px-5 py-2.5 font-medium">Страховка (%)</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {insurance.map(tier => (
              <tr key={tier.id}>
                <td className="px-5 py-2">
                  <input type="number" min="0" step="1"
                    value={tier.vpk_to ?? ''}
                    placeholder="∞ (без ограничения)"
                    onChange={e => setInsurance(ts => ts.map(t => t.id === tier.id ? { ...t, vpk_to: e.target.value ? Number(e.target.value) : null } : t))}
                    onBlur={() => saveInsurTier(tier)}
                    className={`${cls.input} w-52`} />
                </td>
                <td className="px-5 py-2">
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="100" step="0.5"
                      value={tier.rate}
                      onChange={e => setInsurance(ts => ts.map(t => t.id === tier.id ? { ...t, rate: Number(e.target.value) } : t))}
                      onBlur={() => saveInsurTier(tier)}
                      className={`${cls.input} w-24`} />
                    <span className="text-gray-500 text-xs">%</span>
                    <SaveMark saving={saving[tier.id]} saved={saved[tier.id]} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => delInsurTier(tier.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Packaging types ────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <div className={headCls}>
          <h3 className="font-semibold text-gray-900 text-sm">Типы упаковки</h3>
          <button onClick={addPackaging} className={`${cls.btnSm} bg-red-50 text-red-700 hover:bg-red-100`}>+ Добавить</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-5 py-2.5 font-medium">Название</th>
                <th className="px-4 py-2.5 font-medium">Цена мин ($)</th>
                <th className="px-4 py-2.5 font-medium">Цена макс ($)</th>
                <th className="px-4 py-2.5 font-medium">За м³</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packaging.map(row => (
                <tr key={row.id}>
                  <td className="px-5 py-2">
                    <input type="text" value={row.label}
                      onChange={e => setPackaging(rs => rs.map(r => r.id === row.id ? { ...r, label: e.target.value } : r))}
                      onBlur={() => savePackaging(row)}
                      className={`${cls.input} w-36`} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="1" value={row.price_min}
                      onChange={e => setPackaging(rs => rs.map(r => r.id === row.id ? { ...r, price_min: Number(e.target.value) } : r))}
                      onBlur={() => savePackaging(row)}
                      className={`${cls.input} w-20`} />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="1" value={row.price_max}
                      onChange={e => setPackaging(rs => rs.map(r => r.id === row.id ? { ...r, price_max: Number(e.target.value) } : r))}
                      onBlur={() => savePackaging(row)}
                      className={`${cls.input} w-20`} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input type="checkbox" checked={row.per_m3}
                      onChange={e => {
                        const updated = { ...row, per_m3: e.target.checked }
                        setPackaging(rs => rs.map(r => r.id === row.id ? updated : r))
                        savePackaging(updated)
                      }}
                      className="w-4 h-4 accent-red-600" />
                    <SaveMark saving={saving[row.id]} saved={saved[row.id]} />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => delPackaging(row.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delivery settings ──────────────────────────────────────────── */}
      <div className={sectionCls}>
        <div className={headCls}>
          <h3 className="font-semibold text-gray-900 text-sm">Параметры маршрутов и доставки</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          {DELIVERY_KEYS.map(key => {
            const s = settings.find(s => s.key === key)
            if (!s) return null
            return (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{s.label}</label>
                {key === 'notify_telegram' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600"
                      checked={s.value === 'true'}
                      onChange={e => {
                        const v = e.target.checked ? 'true' : 'false'
                        setSetting(key, v); saveSetting(key, v)
                      }} />
                    <span className="text-sm text-gray-700">Включено</span>
                    <SaveMark saving={saving[key]} saved={saved[key]} />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input type="number" step="1" min="0" value={s.value}
                      onChange={e => setSetting(key, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                    <button onClick={() => saveSetting(key, s.value)} disabled={saving[key]} className={cls.btn}>
                      {saving[key] ? '⏳' : saved[key] ? '✓' : 'Сохранить'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Cargo tariff tables ────────────────────────────────────────── */}
      {categories.map(([cat, label]) => {
        const rows = tariffs.filter(t => t.category === cat).sort((a, b) => a.density_min - b.density_min)
        return (
          <div key={cat} className={sectionCls}>
            <div className={headCls}>
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
                    <td className="px-5 py-3 text-gray-700 font-mono text-xs">{t.density_min} – {t.density_max ?? '∞'}</td>
                    <td className="px-5 py-2">
                      <input type="number" step="0.1" min="0" value={t.slow_price}
                        onChange={e => setTariffs(ts => ts.map(r => r.id === t.id ? { ...r, slow_price: parseFloat(e.target.value) || 0 } : r))}
                        onBlur={() => saveTariff(t.id, t.slow_price, t.fast_price)}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                    </td>
                    <td className="px-5 py-2">
                      <input type="number" step="0.1" min="0" value={t.fast_price}
                        onChange={e => setTariffs(ts => ts.map(r => r.id === t.id ? { ...r, fast_price: parseFloat(e.target.value) || 0 } : r))}
                        onBlur={() => saveTariff(t.id, t.slow_price, t.fast_price)}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <SaveMark saving={saving[t.id]} saved={saved[t.id]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

    </div>
  )
}
