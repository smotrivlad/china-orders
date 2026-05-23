import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'EASTWIND LOGISTIC — Доставка товаров из Китая',
  description: 'Надёжная доставка товаров из Китая для бизнеса и частных лиц. Отслеживание на каждом этапе.',
  openGraph: {
    title: 'EASTWIND LOGISTIC',
    description: 'Прямые поставки из Китая. Надёжно, быстро, под ключ.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="bg-navy text-milk antialiased">{children}</body>
    </html>
  )
}
