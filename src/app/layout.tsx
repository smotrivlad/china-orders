import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
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
    <html lang="ru" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-navy text-milk antialiased">{children}</body>
    </html>
  )
}
