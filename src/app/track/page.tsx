'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function TrackPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!clean.startsWith('CH-') || clean.length < 5) {
      setError('Введите корректный номер, например CH-1000')
      return
    }
    router.push(`/track/${clean}`)
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900">Отследить заявку</h1>
          <p className="mt-2 text-gray-500">Введите номер заявки из письма или сообщения</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <Input
            label="Номер заявки"
            placeholder="CH-1000"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError('') }}
            error={error}
          />
          <Button type="submit" className="w-full">Найти</Button>
        </form>
      </main>
    </>
  )
}
