'use client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }
  return (
    <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800">
      Выйти
    </button>
  )
}
