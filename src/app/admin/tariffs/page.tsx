import { adminClient } from '@/lib/supabase/admin'
import TariffsClient from './TariffsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Тарифы — Админ' }

export default async function AdminTariffsPage() {
  const [tariffsRes, settingsRes] = await Promise.all([
    adminClient.from('tariffs').select('*').order('sort_order').order('density_min'),
    adminClient.from('tariff_settings').select('*').order('key'),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифы</h1>
          <p className="text-sm text-gray-500 mt-1">Ставки карго по плотности товара ($/кг) и настройки маршрутов</p>
        </div>
      </div>
      <TariffsClient
        initialTariffs={tariffsRes.data ?? []}
        initialSettings={settingsRes.data ?? []}
      />
    </div>
  )
}
