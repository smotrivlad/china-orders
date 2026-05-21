import Link from 'next/link'

export default function Header({ showTrack = true }: { showTrack?: boolean }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/order" className="flex items-center gap-2">
          <span className="text-2xl">🇨🇳</span>
          <span className="font-bold text-gray-900">China Orders</span>
        </Link>
        {showTrack && (
          <Link href="/track" className="text-sm text-red-600 hover:text-red-700 font-medium">
            Отследить заявку →
          </Link>
        )}
      </div>
    </header>
  )
}
