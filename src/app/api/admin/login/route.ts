import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomInt } from 'crypto'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  const otp = String(randomInt(100000, 999999))
  const hash = createHmac('sha256', process.env.ADMIN_SECRET!).update(otp).digest('hex')

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔐 Код входа в админ-панель:\n\n<b>${otp}</b>\n\nДействителен 5 минут.`,
        parse_mode: 'HTML',
      }),
    })
  }

  const res = NextResponse.json({ step: 'verify' })
  res.cookies.set('otp_hash', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 5,
    path: '/',
  })
  return res
}
