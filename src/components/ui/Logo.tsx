import Link from 'next/link'
import Image from 'next/image'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="EASTWIND LOGISTIC"
        width={40}
        height={40}
        className="rounded-lg"
        priority
      />
      <div className="flex flex-col leading-none">
        <span className="font-display font-bold text-lg tracking-wider" style={{ color: '#F5F0E8' }}>EASTWIND</span>
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: 'rgba(245,240,232,0.5)' }}>Logistic</span>
      </div>
    </Link>
  )
}
