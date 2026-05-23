import Link from 'next/link'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt=""
        width={40}
        height={40}
        style={{ objectFit: 'contain', flexShrink: 0 }}
      />
      <div className="flex flex-col leading-none">
        <span className="font-bold text-base" style={{ color: '#F5F0E8', letterSpacing: '0.18em' }}>
          EASTWIND
        </span>
        <span className="text-[9px] font-semibold" style={{ color: 'rgba(245,240,232,0.38)', letterSpacing: '0.32em' }}>
          LOGISTIC
        </span>
      </div>
    </Link>
  )
}
