'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────
interface Tariff {
  id: string; category: string; category_label: string
  density_min: number; density_max: number | null
  slow_price: number; fast_price: number; sort_order: number
}
interface ApiData {
  tariffs: Tariff[]
  settings: Record<string, string>
  usd_rate: number
  usd_rate_source: 'cbr' | 'manual'
}
interface FormState {
  order_type: 'personal' | 'group'
  category: string
  speed: 'slow' | 'fast'
  length: string; width: string; height: string
  weight: string; places: string
  packaging: string
  insurance: boolean
  product_cost: string
  buyout_percent: string
  chosen_route: 'ural' | 'tk_energy'
}
interface Route1 {
  loaders: number; almaty_ural_min: number; almaty_ural_max: number
  ural_tol_min: number; ural_tol_max: number
  tk_transfer: number; small_weight: number
  total_min: number; total_max: number
}
interface Route2 {
  loaders: number; tk_energia: number; small_weight: number; total: number
}
interface CalcResult {
  volume: number; density: number; tariff: Tariff
  price_per_kg: number; cargo_rub: number
  route1: Route1; route2?: Route2
  pkg_min: number; pkg_max: number
  insurance_cost: number; insurance_rate: number
  buyout_cost: number
  show_both_routes: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────
const PACKAGING = [
  { value: 'none',     label: 'Без упаковки',  min: 0,  max: 0,  per_m3: false },
  { value: 'bag_tape', label: 'Мешок + скотч', min: 3,  max: 3,  per_m3: false },
  { value: 'box',      label: 'Коробка',        min: 5,  max: 5,  per_m3: false },
  { value: 'corners',  label: 'Уголки',         min: 7,  max: 7,  per_m3: false },
  { value: 'foam',     label: 'Пенопласт',      min: 9,  max: 9,  per_m3: false },
  { value: 'crate',    label: 'Обрешётка',      min: 12, max: 12, per_m3: false },
  { value: 'pallet',   label: 'Паллет',         min: 25, max: 45, per_m3: false },
  { value: 'plywood',  label: 'Фанера',         min: 40, max: 40, per_m3: true  },
]

// ── Core calculation function ─────────────────────────────────────────────────
function compute(f: FormState, d: ApiData): CalcResult | null {
  const L = parseFloat(f.length), W = parseFloat(f.width)
  const H = parseFloat(f.height), wt = parseFloat(f.weight)
  const pl = Math.max(1, parseInt(f.places) || 1)
  if (!L || !W || !H || !wt || !f.category) return null

  const volume  = (L / 100) * (W / 100) * (H / 100) * pl
  const density = wt / volume
  const usd     = d.usd_rate

  const tariff = d.tariffs.find(t =>
    t.category === f.category &&
    density >= t.density_min &&
    (t.density_max === null || density < t.density_max),
  )
  if (!tariff) return null

  const price_per_kg = f.speed === 'slow' ? tariff.slow_price : tariff.fast_price
  const cargo_rub    = wt * price_per_kg * usd

  const s         = d.settings
  const loaders   = Number(s.loaders_almaty   ?? 1750)
  const aur_min   = Number(s.almaty_uralsk_min ?? 600)
  const aur_max   = Number(s.almaty_uralsk_max ?? 1000)
  const urt_min   = Number(s.uralsk_tolyatti_min ?? 2000)
  const urt_max   = Number(s.uralsk_tolyatti_max ?? 3000)
  const tk_per_kg = Number(s.tk_energia_per_kg ?? 50)

  const lots           = Math.ceil(wt / 5)
  const almaty_ural_min = aur_min * lots
  const almaty_ural_max = aur_max * lots
  const tk_transfer     = f.order_type === 'group' ? 1000 : 0
  const small_weight    = wt < 10 ? 500 : 0

  const route1: Route1 = {
    loaders, almaty_ural_min, almaty_ural_max,
    ural_tol_min: urt_min, ural_tol_max: urt_max,
    tk_transfer, small_weight,
    total_min: cargo_rub + loaders + almaty_ural_min + urt_min + tk_transfer + small_weight,
    total_max: cargo_rub + loaders + almaty_ural_max + urt_max + tk_transfer + small_weight,
  }

  const show_both_routes = f.order_type === 'personal' && wt >= 10
  const route2: Route2 | undefined = show_both_routes
    ? {
        loaders, tk_energia: wt * tk_per_kg, small_weight,
        total: cargo_rub + loaders + wt * tk_per_kg + small_weight,
      }
    : undefined

  // Packaging
  const pkg = PACKAGING.find(p => p.value === f.packaging)
  let pkg_min = 0, pkg_max = 0
  if (pkg && pkg.min > 0) {
    pkg_min = pkg.per_m3 ? pkg.min * volume * usd : pkg.min * usd
    pkg_max = pkg.per_m3 ? pkg.max * volume * usd : pkg.max * usd
  }

  // Insurance
  let insurance_cost = 0, insurance_rate = 0
  if (f.insurance && parseFloat(f.product_cost) > 0) {
    const pc = parseFloat(f.product_cost)
    const vpk = pc / wt
    insurance_rate = vpk <= 20 ? 1 : vpk <= 30 ? 2 : vpk <= 50 ? 3 : 4
    insurance_cost = pc * (insurance_rate / 100) * usd
  }

  // Buyout
  let buyout_cost = 0
  const bp = parseFloat(f.buyout_percent)
  const pc = parseFloat(f.product_cost)
  if (bp > 0 && pc > 0) buyout_cost = pc * (bp / 100) * usd

  return {
    volume, density, tariff, price_per_kg, cargo_rub,
    route1, route2, pkg_min, pkg_max,
    insurance_cost, insurance_rate, buyout_cost,
    show_both_routes,
  }
}

async function saveRequest(
  r: CalcResult, f: FormState, d: ApiData, sessionId: string,
): Promise<string | null> {
  const extras = r.pkg_min + r.insurance_cost + r.buyout_cost
  const route   = r.show_both_routes ? 'both' : (f.order_type === 'group' ? 'ural' : 'ural')
  try {
    const res = await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: f.category, category_label: r.tariff.category_label,
        order_type: f.order_type, route,
        weight: parseFloat(f.weight), volume: r.volume, density: r.density,
        places: parseInt(f.places) || 1, packaging: f.packaging,
        insurance_rate: r.insurance_rate,
        product_cost: parseFloat(f.product_cost) || null,
        buyout_percent: parseFloat(f.buyout_percent) || null,
        total_min: Math.round(r.route1.total_min + extras),
        total_max: Math.round(r.route1.total_max + extras),
        session_id: sessionId,
      }),
    })
    const data = await res.json()
    return data.id ?? null
  } catch { return null }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`
const rubRange = (a: number, b: number) =>
  Math.abs(a - b) < 50 ? rub(a) : `${Math.round(a).toLocaleString('ru-RU')} – ${Math.round(b).toLocaleString('ru-RU')} ₽`

function inputCls() {
  return 'w-full rounded-xl px-4 py-2.5 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all'
}
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }
const cardStyle  = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }
const labelCls   = 'block text-xs font-medium mb-1.5 text-milk/50'

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalculatorForm() {
  const router = useRouter()
  const [api, setApi] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)

  const [f, setF] = useState<FormState>({
    order_type: 'personal', category: '', speed: 'slow',
    length: '', width: '', height: '', weight: '', places: '1',
    packaging: 'none', insurance: false, product_cost: '', buyout_percent: '',
    chosen_route: 'ural',
  })
  const [extrasOpen, setExtrasOpen]       = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [savedId, setSavedId]             = useState<string | null>(null)
  const sessionRef = useRef('')
  const saveTimer  = useRef<ReturnType<typeof setTimeout>>(null)
  const lastSaveRef = useRef('')

  useEffect(() => {
    let sid = sessionStorage.getItem('calc_sid')
    if (!sid) { sid = Math.random().toString(36).slice(2); sessionStorage.setItem('calc_sid', sid) }
    sessionRef.current = sid
    fetch('/api/calculator/tariffs').then(r => r.json()).then(setApi).finally(() => setLoading(false))
  }, [])

  const result = useMemo(() => api ? compute(f, api) : null, [f, api])

  // Debounced auto-save
  useEffect(() => {
    if (!result || !api) return
    const key = JSON.stringify({ ...f, _r: Math.round(result.route1.total_min) })
    if (key === lastSaveRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      lastSaveRef.current = key
      const id = await saveRequest(result, f, api, sessionRef.current)
      if (id) setSavedId(id)
    }, 1500)
  }, [result])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(p => ({ ...p, [k]: v }))

  // Unique categories in order
  const categories = useMemo(() => {
    if (!api) return []
    const seen = new Map<string, string>()
    for (const t of api.tariffs) if (!seen.has(t.category)) seen.set(t.category, t.category_label)
    return [...seen.entries()].map(([value, label]) => ({ value, label }))
  }, [api])

  async function handlePlaceOrder() {
    const extras = result ? (result.pkg_min + result.insurance_cost + result.buyout_cost) : 0
    const chosenRoute = (result?.show_both_routes ? f.chosen_route : 'ural') as 'ural' | 'tk_energy'
    const route1 = result?.route1
    const route2 = result?.route2

    let total = ''
    if (chosenRoute === 'ural' && route1) {
      total = rubRange(route1.total_min + extras, route1.total_max + extras)
    } else if (chosenRoute === 'tk_energy' && route2) {
      total = rub(route2.total + extras)
    }

    const summary = [
      `Категория: ${result?.tariff.category_label}`,
      `Тип: ${f.order_type === 'personal' ? 'Личный' : 'Совместный'}`,
      `Маршрут: ${chosenRoute === 'ural' ? 'Через Уральск' : 'ТК Энергия'}`,
      `Вес: ${f.weight} кг, ${parseInt(f.places) || 1} мест`,
      `Размеры: ${f.length}×${f.width}×${f.height} см`,
      `Плотность: ${result?.density.toFixed(0)} кг/м³`,
      `Тариф: ${result?.price_per_kg} $/кг`,
      `Итого ~${total}`,
      result?.pkg_min ? `Упаковка: ${PACKAGING.find(p => p.value === f.packaging)?.label}` : '',
      result?.insurance_cost ? `Страховка (${result.insurance_rate}%): ${rub(result.insurance_cost)}` : '',
      result?.buyout_cost ? `Выкуп (${f.buyout_percent}%): ${rub(result.buyout_cost)}` : '',
    ].filter(Boolean).join('\n')

    sessionStorage.setItem('calc_prefill', JSON.stringify({
      order_type: f.order_type,
      summary,
      calc_id: savedId,
    }))

    if (savedId) {
      await fetch('/api/calculator/save', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedId }),
      }).catch(() => {})
    }

    router.push('/order')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#8B1A2F]/30 border-t-[#8B1A2F] animate-spin" />
      </div>
    )
  }

  const extras = result ? result.pkg_min + result.insurance_cost + result.buyout_cost : 0
  const extrasMax = result ? result.pkg_max + result.insurance_cost + result.buyout_cost : 0

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

      {/* ── LEFT: Input form ─────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Тип заказа */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(245,240,232,0.3)' }}>Тип заказа</p>
          <div className="grid grid-cols-2 gap-2">
            {(['personal', 'group'] as const).map(t => (
              <button key={t} onClick={() => set('order_type', t)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                style={f.order_type === t
                  ? { background: '#8B1A2F', color: '#F5F0E8' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(245,240,232,0.1)' }
                }>
                {t === 'personal' ? 'Личный' : 'Совместный'}
              </button>
            ))}
          </div>
        </div>

        {/* Категория + скорость */}
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <div>
            <label className={labelCls}>Категория товара</label>
            <select value={f.category} onChange={e => set('category', e.target.value)}
              className={inputCls()} style={inputStyle}>
              <option value="">— Выберите категорию —</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Скорость доставки</label>
            <div className="grid grid-cols-2 gap-2">
              {(['slow', 'fast'] as const).map(s => (
                <button key={s} onClick={() => set('speed', s)}
                  className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                  style={f.speed === s
                    ? { background: '#8B1A2F', color: '#F5F0E8' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(245,240,232,0.1)' }
                  }>
                  {s === 'slow' ? '🚗 Авто медленное' : '🚀 Авто быстрое'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Размеры и вес */}
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.3)' }}>Параметры груза</p>
          <div className="grid grid-cols-3 gap-2">
            {(['length', 'width', 'height'] as const).map((k, i) => (
              <div key={k}>
                <label className={labelCls}>{['Длина', 'Ширина', 'Высота'][i]} (см)</label>
                <input type="number" min="1" value={f[k]} onChange={e => set(k, e.target.value)}
                  placeholder="0" className={inputCls()} style={inputStyle} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Вес (кг)</label>
              <input type="number" min="0.1" step="0.1" value={f.weight} onChange={e => set('weight', e.target.value)}
                placeholder="0" className={inputCls()} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls}>Кол-во мест</label>
              <input type="number" min="1" value={f.places} onChange={e => set('places', e.target.value)}
                placeholder="1" className={inputCls()} style={inputStyle} />
            </div>
          </div>
          {result && (
            <div className="flex gap-3 pt-1">
              <div className="text-xs rounded-lg px-3 py-1.5" style={{ background: 'rgba(139,26,47,0.12)', color: '#f87171' }}>
                Объём: {result.volume.toFixed(3)} м³
              </div>
              <div className="text-xs rounded-lg px-3 py-1.5" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                Плотность: {result.density.toFixed(0)} кг/м³
              </div>
            </div>
          )}
        </div>

        {/* Дополнительно */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <button onClick={() => setExtrasOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left">
            <span className="text-sm font-medium text-milk/70">Дополнительно</span>
            <span className="text-milk/40 transition-transform duration-200 text-lg"
              style={{ transform: extrasOpen ? 'rotate(45deg)' : 'none' }}>+</span>
          </button>
          {extrasOpen && (
            <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: 'rgba(245,240,232,0.06)' }}>
              <div className="pt-4">
                <label className={labelCls}>Упаковка</label>
                <select value={f.packaging} onChange={e => set('packaging', e.target.value)}
                  className={inputCls()} style={inputStyle}>
                  {PACKAGING.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}{p.min > 0 ? ` — ${p.min === p.max ? `$${p.min}` : `$${p.min}–${p.max}`}${p.per_m3 ? '/м³' : ''}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={f.insurance} onChange={e => set('insurance', e.target.checked)}
                    className="w-4 h-4 accent-[#8B1A2F]" />
                  <span className="text-sm text-milk/70">Страховка груза</span>
                </label>
                {f.insurance && (
                  <div className="mt-3">
                    <label className={labelCls}>Стоимость товара ($)</label>
                    <input type="number" min="0" value={f.product_cost} onChange={e => set('product_cost', e.target.value)}
                      placeholder="0" className={inputCls()} style={inputStyle} />
                    {result && result.insurance_rate > 0 && (
                      <p className="text-xs mt-1.5 text-milk/40">Ставка страховки: {result.insurance_rate}%</p>
                    )}
                  </div>
                )}
              </div>
              {!f.insurance && (
                <div>
                  <label className={labelCls}>Стоимость товара ($) — для расчёта выкупа</label>
                  <input type="number" min="0" value={f.product_cost} onChange={e => set('product_cost', e.target.value)}
                    placeholder="0" className={inputCls()} style={inputStyle} />
                </div>
              )}
              <div>
                <label className={labelCls}>Процент выкупа (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={f.buyout_percent}
                  onChange={e => set('buyout_percent', e.target.value)}
                  placeholder="0" className={inputCls()} style={inputStyle} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Results panel ─────────────────────────────────────── */}
      <div className="xl:sticky xl:top-28 space-y-4">
        {!result ? (
          <div className="rounded-2xl p-10 text-center" style={cardStyle}>
            <div className="text-3xl mb-3">📦</div>
            <p className="text-sm text-milk/40">Заполните параметры груза — увидите расчёт</p>
          </div>
        ) : (
          <>
            {/* Тариф badge */}
            <div className="rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={cardStyle}>
              <div>
                <p className="text-xs text-milk/40 mb-0.5">Найден тариф</p>
                <p className="text-sm font-semibold text-milk">{result.tariff.category_label}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold" style={{ color: '#8B1A2F' }}>{result.price_per_kg} $/кг</span>
                <p className="text-xs text-milk/30">{f.speed === 'slow' ? 'авто медленное' : 'авто быстрое'}</p>
              </div>
            </div>

            {/* Route selection for personal + 10kg+ */}
            {result.show_both_routes && (
              <div className="grid grid-cols-2 gap-2">
                {(['ural', 'tk_energy'] as const).map(r => (
                  <button key={r} onClick={() => set('chosen_route', r)}
                    className="rounded-xl py-2 text-xs font-medium transition-all"
                    style={f.chosen_route === r
                      ? { background: 'rgba(139,26,47,0.3)', color: '#F5F0E8', border: '1px solid rgba(139,26,47,0.5)' }
                      : { background: 'rgba(255,255,255,0.03)', color: 'rgba(245,240,232,0.4)', border: '1px solid rgba(245,240,232,0.08)' }
                    }>
                    {r === 'ural' ? '🚚 Через Уральск' : '🏭 ТК Энергия'}
                  </button>
                ))}
              </div>
            )}

            {/* Route 1 card */}
            {(!result.show_both_routes || f.chosen_route === 'ural') && (
              <div className="rounded-2xl p-5" style={{ ...cardStyle, borderColor: 'rgba(139,26,47,0.2)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
                      {result.show_both_routes ? 'Маршрут 1' : 'Через Казахстан'}
                    </p>
                    <p className="text-xs text-milk/40">Китай → Алматы → Уральск → Тольятти</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,26,47,0.15)', color: '#f87171' }}>
                    {f.order_type === 'group' ? 'Совместный' : `от ${parseFloat(f.weight)} кг`}
                  </span>
                </div>
                <div className="text-2xl font-bold text-milk">
                  {rubRange(result.route1.total_min + extras, result.route1.total_max + extrasMax)}
                </div>
                <p className="text-xs text-milk/30 mt-1">включая карго + доставка</p>
              </div>
            )}

            {/* Route 2 card */}
            {result.route2 && result.show_both_routes && f.chosen_route === 'tk_energy' && (
              <div className="rounded-2xl p-5" style={{ ...cardStyle, borderColor: 'rgba(59,130,246,0.2)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(245,240,232,0.35)' }}>
                      Маршрут 2
                    </p>
                    <p className="text-xs text-milk/40">Китай → Алматы → ТК Энергия → Тольятти</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
                    Личный заказ
                  </span>
                </div>
                <div className="text-2xl font-bold text-milk">
                  {rub(result.route2.total + extras)}
                </div>
                <p className="text-xs text-milk/30 mt-1">включая карго + доставка</p>
              </div>
            )}

            {/* Both routes comparison strip */}
            {result.show_both_routes && result.route2 && (
              <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,240,232,0.06)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-milk/40">Через Уральск:</span>
                  <span className="text-milk/70">{rubRange(result.route1.total_min + extras, result.route1.total_max + extrasMax)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-milk/40">ТК Энергия:</span>
                  <span className="text-milk/70">{rub(result.route2.total + extras)}</span>
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              <button onClick={() => setBreakdownOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                <span className="text-xs font-medium text-milk/60">Детализация расчёта</span>
                <span className="text-milk/30 text-sm" style={{ transform: breakdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
              </button>
              {breakdownOpen && (
                <div className="px-5 pb-4 space-y-1.5 text-xs border-t" style={{ borderColor: 'rgba(245,240,232,0.06)' }}>
                  <Row label="Карго Китай → Алматы" val={rub(result.cargo_rub)} />
                  <Row label="Грузчики Алматы" val={rub(result.route1.loaders)} />
                  {(!result.show_both_routes || f.chosen_route === 'ural') && <>
                    <Row label="Алматы → Уральск" val={rubRange(result.route1.almaty_ural_min, result.route1.almaty_ural_max)} />
                    <Row label="Уральск → Тольятти" val={rubRange(result.route1.ural_tol_min, result.route1.ural_tol_max)} />
                    {result.route1.tk_transfer > 0 && <Row label="Передача в ТК" val={rub(result.route1.tk_transfer)} />}
                  </>}
                  {result.show_both_routes && f.chosen_route === 'tk_energy' && result.route2 && (
                    <Row label="ТК Энергия Алматы → Тольятти" val={rub(result.route2.tk_energia)} />
                  )}
                  {result.route1.small_weight > 0 && <Row label="Доплата (вес < 10 кг)" val={rub(result.route1.small_weight)} />}
                  {result.pkg_min > 0 && <Row label={`Упаковка (${PACKAGING.find(p => p.value === f.packaging)?.label})`}
                    val={rubRange(result.pkg_min, result.pkg_max)} />}
                  {result.insurance_cost > 0 && <Row label={`Страховка (${result.insurance_rate}%)`} val={rub(result.insurance_cost)} />}
                  {result.buyout_cost > 0 && <Row label={`Выкуп (${f.buyout_percent}%)`} val={rub(result.buyout_cost)} />}
                </div>
              )}
            </div>

            {/* Currency note */}
            <p className="text-xs text-center" style={{ color: 'rgba(245,240,232,0.25)' }}>
              {api?.usd_rate_source === 'cbr'
                ? `Курс ЦБ РФ на сегодня: ${api.usd_rate.toFixed(2)} ₽/$ — точный называет менеджер в день оплаты`
                : `Примерный курс: ${api?.usd_rate} ₽/$ — точный называет менеджер в день оплаты`
              }
            </p>

            {/* CTA */}
            <button onClick={handlePlaceOrder}
              className="w-full btn-primary py-3.5 text-sm font-semibold">
              Оформить заявку с этим расчётом →
            </button>

            <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(245,240,232,0.3)' }}>
              Хотите отправить один товар? <Link href="/order" className="underline hover:text-milk/60 transition-colors">Напишите менеджеру</Link> — расскажем условия для мелких отправок
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'rgba(245,240,232,0.04)' }}>
      <span style={{ color: 'rgba(245,240,232,0.4)' }}>{label}</span>
      <span className="text-milk/70 font-medium">{val}</span>
    </div>
  )
}
