import { adminClient } from '@/lib/supabase/admin'
import TariffsClient from './TariffsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Тарифы — Админ' }

async function fetchCbrRate(): Promise<number | null> {
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    return data?.Valute?.USD?.Value ?? null
  } catch { return null }
}

export default async function AdminTariffsPage() {
  const [tariffsRes, settingsRes, commissionRes, packagingRes, insuranceRes, cbrRate] = await Promise.all([
    adminClient.from('tariffs').select('*').order('sort_order').order('density_min'),
    adminClient.from('tariff_settings').select('*').order('key'),
    adminClient.from('commission_tiers').select('*').order('sort_order'),
    adminClient.from('packaging_types').select('*').order('sort_order'),
    adminClient.from('insurance_tiers').select('*').order('sort_order'),
    fetchCbrRate(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Тарифы и настройки калькулятора</h1>
        <p className="text-sm text-gray-500 mt-1">Курс, комиссии, упаковка, страховка, маршруты, карго</p>
      </div>
      <TariffsClient
        initialTariffs={tariffsRes.data ?? []}
        initialSettings={settingsRes.data ?? []}
        initialCommissionTiers={commissionRes.data ?? []}
        initialPackagingTypes={packagingRes.data ?? []}
        initialInsuranceTiers={insuranceRes.data ?? []}
        cbrRate={cbrRate}
      />
    </div>
  )
}
