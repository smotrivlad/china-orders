import Link from 'next/link'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <>
      <Header showTrack={false} />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-6 text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Заявка принята!</h1>
        {code && (
          <p className="mt-3 text-gray-600">
            Ваш номер заявки:{' '}
            <span className="font-mono font-bold text-red-600 text-lg">{code}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">Сохраните номер — он нужен для отслеживания статуса</p>
        <div className="mt-8 flex flex-col gap-3">
          {code && (
            <Link href={`/track/${code}`}>
              <Button className="w-full">Отследить заявку</Button>
            </Link>
          )}
          <Link href="/order">
            <Button variant="secondary" className="w-full">Оформить ещё одну</Button>
          </Link>
        </div>
      </main>
    </>
  )
}
