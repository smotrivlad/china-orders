'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tariff {
  id: string; category: string; category_label: string
  density_min: number; density_max: number | null
  slow_price: number; fast_price: number; sort_order: number
}
interface CommissionTier { id: string; amount_to: number | null; rate: number; sort_order: number }
interface PackagingType  { id: string; value: string; label: string; price_min: number; price_max: number; per_m3: boolean; sort_order: number }
interface InsuranceTier  { id: string; vpk_to: number | null; rate: number; sort_order: number }
interface ApiData {
  tariffs: Tariff[]
  settings: Record<string, string>
  usd_rate: number
  usd_rate_source: 'cbr' | 'manual'
  commission_tiers: CommissionTier[]
  packaging_types:  PackagingType[]
  insurance_tiers:  InsuranceTier[]
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
  buyout_rub: string
}
type RouteKey = 'ural' | 'tk_energy' | 'moscow'
interface RouteResult {
  key: RouteKey
  label: string
  description: string
  tariff_category: string
  price_per_kg: number
  cargo_rub: number
  loaders_rub: number
  almaty_ural_min: number; almaty_ural_max: number
  ural_tol_min: number;    ural_tol_max: number
  tk_energia: number
  total_min: number; total_max: number
}
interface CalcResult {
  volume: number; density: number
  routes: RouteResult[]
  pkg_min: number; pkg_max: number
  insurance_cost: number; insurance_rate: number
  buyout_cost: number; buyout_rate: number
}

// ── UI categories ─────────────────────────────────────────────────────────────
const GROUP_CATS = [
  { value: 'sbornyi', label: 'Сборный груз' },
]
const PERSONAL_CATS = [
  { value: 'one_category', label: 'Одна категория' },
  { value: 'shoes',        label: 'Обувь' },
  { value: 'clothes',      label: 'Одежда / постельное' },
  { value: 'food',         label: 'Еда' },
  { value: 'cosmetics',    label: 'Косметика' },
  { value: 'perfume',      label: 'Парфюм' },
  { value: 'electro',      label: 'Электро / мопед' },
  { value: 'underwear',    label: 'Нижнее бельё' },
  { value: 'socks',        label: 'Носки' },
]
const SPECIFIC_TO_MOSCOW: Record<string, string> = {
  shoes: 'shoes_moscow', clothes: 'clothes_moscow', food: 'food_moscow',
  cosmetics: 'cosmetics_moscow', perfume: 'perfume_moscow',
  electro: 'electro_moscow', underwear: 'underwear_moscow', socks: 'socks_moscow',
}
function getCategoryLabel(cat: string, orderType: string): string {
  if (orderType === 'group') return 'Сборный груз'
  return PERSONAL_CATS.find(c => c.value === cat)?.label ?? cat
}

// ── Core calculation function ─────────────────────────────────────────────────
function compute(f: FormState, d: ApiData): CalcResult | null {
  const L = parseFloat(f.length), W = parseFloat(f.width)
  const H = parseFloat(f.height), wt = parseFloat(f.weight)
  const pl = Math.max(1, parseInt(f.places) || 1)
  if (!L || !W || !H || !wt || !f.category) return null

  const volume  = (L / 100) * (W / 100) * (H / 100) * pl
  const density = wt / volume
  const usd     = d.usd_rate
  const s       = d.settings

  const loaders   = Number(s.loaders_almaty      ?? 1750)
  const aur_min   = Number(s.almaty_uralsk_min    ?? 600)
  const aur_max   = Number(s.almaty_uralsk_max    ?? 1000)
  const urt_min   = Number(s.uralsk_tolyatti_min  ?? 2000)
  const urt_max   = Number(s.uralsk_tolyatti_max  ?? 3000)
  const tk_per_kg = Number(s.tk_energia_per_kg    ?? 50)
  const lots      = Math.ceil(wt / 5)

  function findTariff(catKey: string): Tariff | null {
    return d.tariffs.find(t =>
      t.category === catKey &&
      density >= Number(t.density_min) &&
      (t.density_max === null || density < Number(t.density_max))
    ) ?? null
  }

  function makeUral(tariffCat: string, ppk: number, cargo: number): RouteResult {
    const amin = aur_min * lots, amax = aur_max * lots
    return {
      key: 'ural', label: 'Через Уральск',
      description: 'Китай → Алматы → Уральск → Тольятти',
      tariff_category: tariffCat, price_per_kg: ppk, cargo_rub: cargo,
      loaders_rub: loaders,
      almaty_ural_min: amin, almaty_ural_max: amax,
      ural_tol_min: urt_min, ural_tol_max: urt_max,
      tk_energia: 0,
      total_min: cargo + loaders + amin + urt_min,
      total_max: cargo + loaders + amax + urt_max,
    }
  }

  function makeTK(tariffCat: string, ppk: number, cargo: number): RouteResult {
    const tk = wt * tk_per_kg
    return {
      key: 'tk_energy', label: 'ТК Энергия',
      description: 'Китай → Алматы → ТК Энергия → любой город РФ',
      tariff_category: tariffCat, price_per_kg: ppk, cargo_rub: cargo,
      loaders_rub: loaders,
      almaty_ural_min: 0, almaty_ural_max: 0,
      ural_tol_min: 0,    ural_tol_max: 0,
      tk_energia: tk,
      total_min: cargo + loaders + tk,
      total_max: cargo + loaders + tk,
    }
  }

  function makeMoscow(tariffCat: string, ppk: number, cargo: number): RouteResult {
    return {
      key: 'moscow', label: 'Китай → Москва',
      description: 'Прямой маршрут Китай → Москва',
      tariff_category: tariffCat, price_per_kg: ppk, cargo_rub: cargo,
      loaders_rub: 0,
      almaty_ural_min: 0, almaty_ural_max: 0,
      ural_tol_min: 0,    ural_tol_max: 0,
      tk_energia: 0,
      total_min: cargo, total_max: cargo,
    }
  }

  const routes: RouteResult[] = []

  // ── A) Совместный → только Уральск, тариф cargo_mixed ────────────────────
  if (f.order_type === 'group') {
    const t = findTariff('cargo_mixed')
    if (!t) return null
    const ppk = f.speed === 'slow' ? Number(t.slow_price) : Number(t.fast_price)
    routes.push(makeUral('cargo_mixed', ppk, wt * ppk * usd))

  // ── B) Личный, Одна категория → Уральск (<10кг) или ТК Энергия (10кг+) ──
  } else if (f.category === 'one_category') {
    const t = findTariff('one_category_almaty')
    if (!t) return null
    const ppk = f.speed === 'slow' ? Number(t.slow_price) : Number(t.fast_price)
    const cargo = wt * ppk * usd
    routes.push(wt < 10 ? makeUral('one_category_almaty', ppk, cargo) : makeTK('one_category_almaty', ppk, cargo))

  // ── C) Личный, конкретная категория ──────────────────────────────────────
  } else {
    const moscowKey = SPECIFIC_TO_MOSCOW[f.category]
    if (wt >= 10 && moscowKey) {
      // Оба варианта: Москва + ТК Энергия
      const mt = findTariff(moscowKey)
      if (mt) {
        const ppk = Number(mt.slow_price)
        routes.push(makeMoscow(moscowKey, ppk, wt * ppk * usd))
      }
      const at = findTariff('one_category_almaty')
      if (at) {
        const ppk = f.speed === 'slow' ? Number(at.slow_price) : Number(at.fast_price)
        routes.push(makeTK('one_category_almaty', ppk, wt * ppk * usd))
      }
    } else {
      // <10кг или неизвестная категория → Уральск с one_category_almaty
      const t = findTariff('one_category_almaty')
      if (!t) return null
      const ppk = f.speed === 'slow' ? Number(t.slow_price) : Number(t.fast_price)
      routes.push(makeUral('one_category_almaty', ppk, wt * ppk * usd))
    }
  }

  if (routes.length === 0) return null

  // ── Packaging ─────────────────────────────────────────────────────────────
  const pkg = d.packaging_types.find(p => p.value === f.packaging)
  let pkg_min = 0, pkg_max = 0
  if (pkg && pkg.price_min > 0) {
    pkg_min = pkg.per_m3 ? pkg.price_min * volume * usd : pkg.price_min * usd
    pkg_max = pkg.per_m3 ? pkg.price_max * volume * usd : pkg.price_max * usd
  }

  // ── Insurance ─────────────────────────────────────────────────────────────
  let insurance_cost = 0, insurance_rate = 0
  if (f.insurance && parseFloat(f.product_cost) > 0) {
    const pc = parseFloat(f.product_cost), vpk = pc / wt
    const tier = [...d.insurance_tiers]
      .sort((a, b) => (a.vpk_to ?? Infinity) - (b.vpk_to ?? Infinity))
      .find(t => t.vpk_to === null || vpk <= Number(t.vpk_to))
    insurance_rate = tier ? Number(tier.rate) : 0
    insurance_cost = pc * (insurance_rate / 100) * usd
  }

  // ── Buyout ────────────────────────────────────────────────────────────────
  let buyout_cost = 0, buyout_rate = 0
  const buyoutRub = parseFloat(f.buyout_rub)
  if (buyoutRub > 0) {
    const tier = [...d.commission_tiers]
      .sort((a, b) => (a.amount_to ?? Infinity) - (b.amount_to ?? Infinity))
      .find(t => t.amount_to === null || buyoutRub <= t.amount_to)
    buyout_rate = tier ? Number(tier.rate) : 0
    buyout_cost = buyoutRub * (buyout_rate / 100)
  }

  return { volume, density, routes, pkg_min, pkg_max, insurance_cost, insurance_rate, buyout_cost, buyout_rate }
}

// ── Save to DB ────────────────────────────────────────────────────────────────
async function saveRequest(
  result: CalcResult, chosenRoute: RouteResult, f: FormState, sessionId: string,
): Promise<string | null> {
  const extras = result.pkg_min + result.insurance_cost + result.buyout_cost
  try {
    const res = await fetch('/api/calculator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: f.category,
        category_label: getCategoryLabel(f.category, f.order_type),
        order_type: f.order_type,
        route: chosenRoute.key,
        weight: parseFloat(f.weight), volume: result.volume, density: result.density,
        places: parseInt(f.places) || 1, packaging: f.packaging,
        insurance_rate: result.insurance_rate,
        product_cost: parseFloat(f.product_cost) || null,
        buyout_percent: result.buyout_rate || null,
        total_min: Math.round(chosenRoute.total_min + extras),
        total_max: Math.round(chosenRoute.total_max + extras),
        session_id: sessionId,
      }),
    })
    const data = await res.json()
    return data.id ?? null
  } catch { return null }
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`
const rubRange = (a: number, b: number) =>
  Math.abs(a - b) < 50 ? rub(a) : `${Math.round(a).toLocaleString('ru-RU')} – ${Math.round(b).toLocaleString('ru-RU')} ₽`
function inputCls() { return 'w-full rounded-xl px-4 py-2.5 text-sm text-milk placeholder:opacity-30 outline-none focus:ring-2 focus:ring-[#8B1A2F]/40 transition-all' }
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,240,232,0.1)' }
const cardStyle  = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,240,232,0.07)' }
const labelCls   = 'block text-xs font-medium mb-1.5 text-milk/50'
const btnActive  = { background: '#8B1A2F', color: '#F5F0E8' }
const btnInactive = { background: 'rgba(255,255,255,0.04)', color: 'rgba(245,240,232,0.5)', border: '1px solid rgba(245,240,232,0.1)' }

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalculatorForm() {
  const router = useRouter()
  const [api, setApi]           = useState<ApiData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [chosenRoute, setChosenRoute] = useState<RouteKey>('ural')
  const [extrasOpen, setExtrasOpen]   = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [savedId, setSavedId]   = useState<string | null>(null)
  const sessionRef  = useRef('')
  const saveTimer   = useRef<ReturnType<typeof setTimeout>>(null)
  const lastSaveRef = useRef('')

  const [f, setF] = useState<FormState>({
    order_type: 'personal', category: 'one_category', speed: 'slow',
    length: '', width: '', height: '', weight: '', places: '1',
    packaging: 'none', insurance: false, product_cost: '', buyout_rub: '',
  })

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(p => ({ ...p, [k]: v }))

  function handleOrderType(type: 'personal' | 'group') {
    setF(p => ({
      ...p,
      order_type: type,
      category: type === 'group' ? 'sbornyi' : (p.category === 'sbornyi' ? 'one_category' : p.category),
    }))
  }

  useEffect(() => {
    let sid = sessionStorage.getItem('calc_sid')
    if (!sid) { sid = Math.random().toString(36).slice(2); sessionStorage.setItem('calc_sid', sid) }
    sessionRef.current = sid
    fetch('/api/calculator/tariffs').then(r => r.json()).then(setApi).finally(() => setLoading(false))
  }, [])

  const result = useMemo(() => api ? compute(f, api) : null, [f, api])

  // Auto-select first valid route when routes change
  useEffect(() => {
    if (!result) return
    const keys = result.routes.map(r => r.key)
    if (!keys.includes(chosenRoute)) setChosenRoute(keys[0])
  }, [result?.routes.map(r => r.key).join(',')])

  const selectedRoute = result ? (result.routes.find(r => r.key === chosenRoute) ?? result.routes[0]) : null

  // Debounced auto-save
  useEffect(() => {
    if (!result || !api || !selectedRoute) return
    const key = JSON.stringify({ ...f, _r: Math.round(selectedRoute.total_min), _route: chosenRoute })
    if (key === lastSaveRef.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      lastSaveRef.current = key
      const id = await saveRequest(result, selectedRoute, f, sessionRef.current)
      if (id) setSavedId(id)
    }, 1500)
  }, [result, chosenRoute])

  async function handlePlaceOrder() {
    if (!result || !selectedRoute) return
    const extras    = result.pkg_min + result.insurance_cost + result.buyout_cost
    const extrasMax = result.pkg_max + result.insurance_cost + result.buyout_cost
    const total = rubRange(selectedRoute.total_min + extras, selectedRoute.total_max + extrasMax)

    const summary = [
      `Категория: ${getCategoryLabel(f.category, f.order_type)}`,
      `Тип: ${f.order_type === 'personal' ? 'Личный' : 'Совместный'}`,
      `Маршрут: ${selectedRoute.description}`,
      `Вес: ${f.weight} кг, ${parseInt(f.places) || 1} мест`,
      `Размеры: ${f.length}×${f.width}×${f.height} см`,
      `Плотность: ${result.density.toFixed(0)} кг/м³`,
      `Тариф: ${selectedRoute.price_per_kg} $/кг`,
      `Итого ~${total}`,
      result.pkg_min > 0 ? `Упаковка: ${api?.packaging_types.find(p => p.value === f.packaging)?.label}` : '',
      result.insurance_cost > 0 ? `Страховка (${result.insurance_rate}%): ${rub(result.insurance_cost)}` : '',
      result.buyout_cost > 0 ? `Выкуп (${result.buyout_rate}%): ${rub(result.buyout_cost)}` : '',
    ].filter(Boolean).join('\n')

    sessionStorage.setItem('calc_prefill', JSON.stringify({ order_type: f.order_type, summary, calc_id: savedId }))

    if (savedId) {
      await fetch('/api/calculator/save', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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

  const extras    = result ? result.pkg_min    + result.insurance_cost + result.buyout_cost : 0
  const extrasMax = result ? result.pkg_max    + result.insurance_cost + result.buyout_cost : 0
  const cats = f.order_type === 'group' ? GROUP_CATS : PERSONAL_CATS

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

      {/* ── LEFT: Input form ─────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Тип заказа */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(245,240,232,0.3)' }}>Тип заказа</p>
          <div className="grid grid-cols-2 gap-2">
            {(['personal', 'group'] as const).map(t => (
              <button key={t} onClick={() => handleOrderType(t)}
                className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                style={f.order_type === t ? btnActive : btnInactive}>
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
              {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {f.order_type === 'personal' && f.category !== 'one_category' && parseFloat(f.weight) > 0 && parseFloat(f.weight) < 10 && (
              <p className="text-xs mt-1.5" style={{ color: 'rgba(245,240,232,0.35)' }}>
                Маршрут Китай → Москва доступен от 10 кг
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Скорость доставки</label>
            <div className="grid grid-cols-2 gap-2">
              {(['slow', 'fast'] as const).map(s => (
                <button key={s} onClick={() => set('speed', s)}
                  className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                  style={f.speed === s ? btnActive : btnInactive}>
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
                  {(api?.packaging_types ?? []).map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}{p.price_min > 0 ? ` — ${p.price_min === p.price_max ? `$${p.price_min}` : `$${p.price_min}–${p.price_max}`}${p.per_m3 ? '/м³' : ''}` : ''}
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
              <div>
                <label className={labelCls}>Сумма заказа в рублях (выкуп)</label>
                <input type="number" min="0" step="1000" value={f.buyout_rub}
                  onChange={e => set('buyout_rub', e.target.value)}
                  placeholder="0" className={inputCls()} style={inputStyle} />
                {result && result.buyout_cost > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: 'rgba(245,240,232,0.4)' }}>
                    {rub(parseFloat(f.buyout_rub))} → {result.buyout_rate}% → комиссия {rub(result.buyout_cost)}
                  </p>
                )}
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
            {selectedRoute && (
              <div className="rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={cardStyle}>
                <div>
                  <p className="text-xs text-milk/40 mb-0.5">Тариф: {getCategoryLabel(f.category, f.order_type)}</p>
                  <p className="text-xs text-milk/30">{selectedRoute.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: '#8B1A2F' }}>
                    {selectedRoute.price_per_kg} $/кг
                  </span>
                  {selectedRoute.key !== 'moscow' && (
                    <p className="text-xs text-milk/30">{f.speed === 'slow' ? 'авто медленное' : 'авто быстрое'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Route cards — 1 or 2 */}
            {result.routes.length === 1 && selectedRoute && (
              <RouteCard route={selectedRoute} extras={extras} extrasMax={extrasMax} selected={false} />
            )}

            {result.routes.length > 1 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {result.routes.map(r => (
                    <RouteCard
                      key={r.key} route={r}
                      extras={extras} extrasMax={extrasMax}
                      selected={chosenRoute === r.key}
                      onClick={() => setChosenRoute(r.key)}
                    />
                  ))}
                </div>
                {/* Comparison strip */}
                <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,240,232,0.06)' }}>
                  {result.routes.map(r => (
                    <div key={r.key} className="flex justify-between items-center mt-1 first:mt-0">
                      <span className="text-milk/40">{r.label}:</span>
                      <span className="text-milk/70">{rubRange(r.total_min + extras, r.total_max + extrasMax)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Breakdown */}
            {selectedRoute && (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <button onClick={() => setBreakdownOpen(o => !o)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                  <span className="text-xs font-medium text-milk/60">Детализация расчёта</span>
                  <span className="text-milk/30 text-sm" style={{ transform: breakdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                </button>
                {breakdownOpen && (
                  <div className="px-5 pb-4 space-y-1.5 text-xs border-t" style={{ borderColor: 'rgba(245,240,232,0.06)' }}>
                    <Row label="Карго" val={rub(selectedRoute.cargo_rub)} />
                    {selectedRoute.loaders_rub > 0 && <Row label="Грузчики Алматы" val={rub(selectedRoute.loaders_rub)} />}
                    {selectedRoute.almaty_ural_min > 0 && <Row label="Алматы → Уральск" val={rubRange(selectedRoute.almaty_ural_min, selectedRoute.almaty_ural_max)} />}
                    {selectedRoute.ural_tol_min > 0 && <Row label="Уральск → Тольятти" val={rubRange(selectedRoute.ural_tol_min, selectedRoute.ural_tol_max)} />}
                    {selectedRoute.tk_energia > 0 && <Row label="ТК Энергия (Алматы → РФ)" val={rub(selectedRoute.tk_energia)} />}
                    {result.pkg_min > 0 && <Row label={`Упаковка (${api?.packaging_types.find(p => p.value === f.packaging)?.label})`} val={rubRange(result.pkg_min, result.pkg_max)} />}
                    {result.insurance_cost > 0 && <Row label={`Страховка (${result.insurance_rate}%)`} val={rub(result.insurance_cost)} />}
                    {result.buyout_cost > 0 && <Row label={`Выкуп (${result.buyout_rate}%)`} val={rub(result.buyout_cost)} />}
                  </div>
                )}
              </div>
            )}

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

// ── Sub-components ────────────────────────────────────────────────────────────
function RouteCard({ route, extras, extrasMax, selected, onClick }: {
  route: RouteResult; extras: number; extrasMax: number; selected: boolean; onClick?: () => void
}) {
  const total_min = route.total_min + extras
  const total_max = route.total_max + extrasMax
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-4 transition-all ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: selected ? 'rgba(139,26,47,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${selected ? 'rgba(139,26,47,0.4)' : 'rgba(245,240,232,0.07)'}`,
      }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(245,240,232,0.35)' }}>
        {route.label}
      </p>
      <p className="text-[11px] text-milk/30 mb-3 leading-tight">{route.description}</p>
      <div className="text-xl font-bold text-milk">
        {rubRange(total_min, total_max)}
      </div>
      <p className="text-[11px] text-milk/25 mt-0.5">карго + доставка</p>
      {selected && onClick && <p className="text-[11px] mt-2 font-semibold" style={{ color: '#f87171' }}>✓ Выбрано</p>}
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
