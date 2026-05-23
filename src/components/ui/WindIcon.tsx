interface WindIconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function WindIcon({ size = 48, className = '', style }: WindIconProps) {
  const h = Math.round(size * 0.722)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 72 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* 4 wind lines – tapered, staggered, flowing right */}
      <path d="M3 11C20 8 50 9 69 13"  stroke="currentColor" strokeWidth="3"   strokeLinecap="round"/>
      <path d="M3 22C19 19 44 20 60 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M9 33C23 30 40 31 52 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 44C27 41 38 42 45 45" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
    </svg>
  )
}
