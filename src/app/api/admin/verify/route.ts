import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  const storedHash = req.cookies.get('otp_hash')?.value

  if (!storedHash) {
    return NextResponse.json({ error: 'Код устарел. Начните заново.' }, { status: 401 })
  }

  const expectedHash = createHmac('sha256', process.env.ADMIN_SECRET!)
    .update(String(code).trim())
    .digest('hex')

  if (expectedHash !== storedHash) {
    return NextResponse.json({ error: 'Неверный код' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.delete('otp_hash')
  res.cookies.set('admin_session', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
