import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'China Orders — Заказы из Китая',
  description: 'Оформите заявку на товар из Китая',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>{children}</body>
    </html>
  )
}
