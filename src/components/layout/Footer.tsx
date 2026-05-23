import Logo from '@/components/ui/Logo'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-deep">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-milk/40 leading-relaxed max-w-xs">
              Прямые поставки товаров из Китая. Полное сопровождение сделки от поиска до доставки.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-milk/30 mb-4">Навигация</p>
            <ul className="space-y-3">
              {[
                ['/', 'Главная'],
                ['/order', 'Оформить заявку'],
                ['/track', 'Отследить заявку'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-milk/50 hover:text-milk transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-milk/30 mb-4">Контакты</p>
            <ul className="space-y-3">
              <li className="text-sm text-milk/50">Режим работы: 9:00 – 21:00 МСК</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-milk/25">© {new Date().getFullYear()} EASTWIND LOGISTIC. Все права защищены.</p>
          <p className="text-xs text-milk/25">Доставка из Китая по всей России</p>
        </div>
      </div>
    </footer>
  )
}
