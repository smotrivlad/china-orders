'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  // undefined = ещё не загружено, null = не залогинен, User = залогинен
  const [user, setUser]         = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    ['/#services', 'Услуги'],
    ['/#process',  'Как работаем'],
    ['/about',     'О компании'],
    ['/track',     'Отследить'],
  ] as const

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
          {navLinks.map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-milk/60 hover:text-milk transition-colors font-medium">
              {label}
            </a>
          ))}

          {/* Auth buttons — показываем только после загрузки состояния */}
          {user === undefined ? (
            <div className="w-36 h-9" /> /* placeholder чтобы не прыгал layout */
          ) : user ? (
            /* Залогинен */
            <div className="flex items-center gap-3">
              <Link
                href="/cabinet"
                className="text-sm font-medium text-milk hover:text-milk/80 transition-colors px-4 py-2 rounded-xl"
                style={{ border: '1px solid rgba(245,240,232,0.15)' }}
              >
                Личный кабинет
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-milk/60 hover:text-milk transition-colors"
              >
                Выйти
              </button>
            </div>
          ) : (
            /* Не залогинен */
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-milk hover:text-milk/80 transition-colors px-4 py-2 rounded-xl"
                style={{ border: '1px solid rgba(245,240,232,0.15)' }}
              >
                Войти
              </Link>
              <Link href="/register" className="btn-primary py-2.5 px-5 text-sm">
                Регистрация
              </Link>
            </div>
          )}
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
          {navLinks.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block text-milk/70 hover:text-milk py-2 border-b border-white/5">
              {label}
            </a>
          ))}

          {user ? (
            <>
              <Link href="/cabinet" onClick={() => setOpen(false)}
                className="block text-milk/80 hover:text-milk py-2 border-b border-white/5 font-medium">
                Личный кабинет
              </Link>
              <button onClick={handleLogout}
                className="block w-full text-left text-milk/60 hover:text-milk py-2 text-sm font-medium">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}
                className="block text-milk/80 hover:text-milk py-2 border-b border-white/5 font-medium">
                Войти
              </Link>
              <Link href="/register" className="btn-primary w-full justify-center mt-2" onClick={() => setOpen(false)}>
                Регистрация
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
