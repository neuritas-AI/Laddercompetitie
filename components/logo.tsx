'use client'

import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  inverted?: boolean
}

export default function Logo({ size = 'md', inverted = false }: LogoProps) {
  const uid = useId()
  const stringsId = `strings-${uid}`
  const holesId = `holes-${uid}`

  const sizes = {
    sm: { mark: 'w-9 h-6', text: 'text-lg', sub: 'text-[9px]' },
    md: { mark: 'w-12 h-8', text: 'text-2xl', sub: 'text-[10px]' },
    lg: { mark: 'w-16 h-10', text: 'text-4xl', sub: 'text-xs' },
  }

  const { mark, text, sub } = sizes[size]
  const textColor = inverted ? 'text-white' : 'text-foreground'
  const accentColor = inverted ? 'text-white' : 'text-primary'

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 60" className={`shrink-0 ${mark}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={stringsId} width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="#D80016" />
            <path d="M0 0L5 5M5 0L0 5" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
          </pattern>
          <pattern id={holesId} width="9" height="9" patternUnits="userSpaceOnUse">
            <rect width="9" height="9" fill="#D80016" />
            <circle cx="4.5" cy="4.5" r="1" fill="#fff" opacity="0.4" />
          </pattern>
          <clipPath id={`clipT-${uid}`}>
            <text x="0" y="46" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="52">T</text>
          </clipPath>
          <clipPath id={`clipP-${uid}`}>
            <text x="31" y="46" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="52">P</text>
          </clipPath>
          <clipPath id={`clipA-${uid}`}>
            <text x="60" y="46" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="52">A</text>
          </clipPath>
        </defs>
        <rect clipPath={`url(#clipT-${uid})`} x="0" y="0" width="34" height="60" fill={`url(#${stringsId})`} />
        <rect clipPath={`url(#clipP-${uid})`} x="28" y="0" width="34" height="60" fill={`url(#${holesId})`} />
        <rect clipPath={`url(#clipA-${uid})`} x="58" y="0" width="42" height="60" fill="#D80016" />
        <circle cx="88" cy="15" r="9" fill="#FFE600" />
        <path d="M81 15a9 9 0 0 0 7 8" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.7" />
      </svg>
      <div className="flex flex-col items-start leading-none">
        <span className={`font-black tracking-tighter ${text} ${textColor}`}>
          TPA <span className={accentColor}>Ladder</span>
        </span>
        <span className={`font-semibold tracking-widest uppercase ${sub} ${inverted ? 'text-white/80' : 'text-muted-foreground'}`}>
          Tennis Padel Academie
        </span>
      </div>
    </div>
  )
}
