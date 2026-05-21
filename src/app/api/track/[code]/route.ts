import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const { data, error } = await adminClient
    .from('orders')
    .select('*, statuses(*)')
    .eq('code', code.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
  return NextResponse.json(data)
}
