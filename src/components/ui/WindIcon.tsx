interface WindIconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

/*
 * Three wind-curl spirals (CW, traced from tail → outer loop → inner loop)
 * + horizontal speed-lines on the left side.
 * Traced from the logo.png reference image.
 * Uses currentColor so the parent controls white / other color via CSS/style.
 */
export default function WindIcon({ size = 48, className = '', style }: WindIconProps) {
  const h = Math.round(size * 0.74)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* ── LEFT SPEED-LINES ── */}
      <path d="M2 25 C10 24 20 24 30 26"   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M2 32 C11 31 22 31 34 33"   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M2 39 C11 38 22 38 34 40"   stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M2 46 C10 45 19 45 29 47"   stroke="currentColor" strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── TOP WIND CURL – largest spiral (CW, center ≈77,20) ── */}
      {/*  tail → approach curve → outer 1-turn loop → inner half-loop          */}
      <path
        d="M3 38
           C18 36 35 34 50 37
           C57 38 61 31 65 24
           C67 18 71 11 78 10
           C85  9 90 15 90 22
           C90 29 85 35 78 35
           C71 35 66 28 68 22
           C70 16 75 13 80 15
           C85 17 86 23 82 27
           C79 31 75 29 77 25"
        stroke="currentColor" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      {/* ── MIDDLE WIND CURL – medium spiral (CW, center ≈82,44) ── */}
      <path
        d="M3 47
           C17 45 34 44 49 48
           C57 50 62 44 67 37
           C72 30 79 31 82 37
           C85 43 81 51 75 51
           C69 51 66 44 70 40
           C74 36 79 38 78 43"
        stroke="currentColor" strokeWidth="2.8"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />

      {/* ── BOTTOM WIND CURL – smallest spiral (CW, center ≈73,59) ── */}
      <path
        d="M8 57
           C19 55 33 54 47 57
           C55 60 62 56 66 50
           C70 44 75 46 75 52
           C75 58 71 62 67 60
           C63 58 63 54 67 53"
        stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  )
}
