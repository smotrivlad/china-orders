import Link from 'next/link'
import WindIcon from './WindIcon'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      {/* Wind icon — transparent, engraved glow */}
      <WindIcon
        size={32}
        style={{
          color: '#8B1A2F',
          filter: 'drop-shadow(0 0 4px rgba(139,26,47,0.9)) drop-shadow(0 0 10px rgba(139,26,47,0.4))',
          flexShrink: 0,
        }}
      />
      <div className="flex flex-col leading-none">
        <span
          className="font-bold tracking-widest text-base"
          style={{ color: '#F5F0E8', letterSpacing: '0.18em', fontFamily: 'inherit' }}
        >
          EASTWIND
        </span>
        <span
          className="text-[9px] font-semibold"
          style={{ color: 'rgba(245,240,232,0.38)', letterSpacing: '0.35em' }}
        >
          LOGISTIC
        </span>
      </div>
    </Link>
  )
}
