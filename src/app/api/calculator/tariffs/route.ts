import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function fetchCbrRate(): Promise<number | null> {
  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.Valute?.USD?.Value ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const [tariffsRes, settingsRes] = await Promise.all([
    adminClient.from('tariffs').select('*').order('sort_order').order('density_min'),
    adminClient.from('tariff_settings').select('*'),
  ])

  const settings: Record<string, string> = {}
  for (const row of settingsRes.data ?? []) {
    settings[row.key] = row.value
  }

  const cbrRate = await fetchCbrRate()
  const usdRate = cbrRate ?? Number(settings.usd_rub ?? 90)

  return NextResponse.json({
    tariffs:  tariffsRes.data  ?? [],
    settings,
    usd_rate: usdRate,
    usd_rate_source: cbrRate ? 'cbr' : 'manual',
  })
}
