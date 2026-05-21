import Link from 'next/link'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'

const BOT_USERNAME = 'chinaorders_notify_bot'

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <>
      <Header showTrack={false} />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-6 text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Заявка принята!</h1>
        {code && (
          <p className="mt-3 text-gray-600">
            Ваш номер заявки:{' '}
            <span className="font-mono font-bold text-red-600 text-lg">{code}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">Сохраните номер — он нужен для отслеживания статуса</p>

        {/* Telegram уведомления */}
        {code && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left">
            <p className="font-semibold text-blue-900 text-sm">📱 Уведомления в Telegram</p>
            <p className="mt-1 text-sm text-blue-700">
              Нажмите кнопку ниже — бот автоматически подпишет вас на обновления по заявке.
              Как только статус изменится, вы сразу узнаете.
            </p>
            <a
              href={`https://t.me/${BOT_USERNAME}?start=${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.048 13.84l-2.948-.924c-.64-.203-.653-.64.136-.953l11.57-4.461c.532-.194 1.00.13.756.746z"/>
              </svg>
              Подписаться на уведомления
            </a>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
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
