'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm transition-colors px-4 py-2 rounded-xl"
      style={{
        color: 'rgba(245,240,232,0.45)',
        border: '1px solid rgba(245,240,232,0.1)',
      }}
    >
      Выйти
    </button>
  )
}
