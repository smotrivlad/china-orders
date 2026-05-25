'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/5 py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            ['/#services', 'Услуги'],
            ['/#process',  'Как работаем'],
            ['/about',     'О компании'],
            ['/track',     'Отследить'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-milk/60 hover:text-milk transition-colors font-medium">
              {label}
            </a>
          ))}
          <Link href="/order" className="btn-primary py-2.5 px-5 text-sm">
            Оформить заявку
          </Link>
        </nav>

        {/* Mobile burger */}
        <button
          className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-6 bg-milk transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-milk transition-all ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-milk transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-6 space-y-4">
          {[
            ['/#services', 'Услуги'],
            ['/#process',  'Как работаем'],
            ['/about',     'О компании'],
            ['/track',     'Отследить заявку'],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block text-milk/70 hover:text-milk py-2 border-b border-white/5">
              {label}
            </a>
          ))}
          <Link href="/order" className="btn-primary w-full justify-center mt-2" onClick={() => setOpen(false)}>
            Оформить заявку
          </Link>
        </div>
      )}
    </header>
  )
}
