import Link from 'next/link'
import WindIcon from './WindIcon'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`}>
      {/* White wind-curl SVG — no background, no border */}
      <WindIcon
        size={34}
        style={{
          color: '#ffffff',
          filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.55)) drop-shadow(0 0 7px rgba(255,255,255,0.2))',
          flexShrink: 0,
        }}
      />
      <div className="flex flex-col leading-none">
        <span
          className="font-bold text-base"
          style={{ color: '#F5F0E8', letterSpacing: '0.18em' }}
        >
          EASTWIND
        </span>
        <span
          className="text-[9px] font-semibold"
          style={{ color: 'rgba(245,240,232,0.38)', letterSpacing: '0.32em' }}
        >
          LOGISTIC
        </span>
      </div>
    </Link>
  )
}
