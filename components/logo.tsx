import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  inverted?: boolean
}

export default function Logo({ size = 'md', inverted = false }: LogoProps) {
  const sizes = {
    sm: { img: 24, text: 'text-lg', sub: 'text-[9px]' },
    md: { img: 32, text: 'text-2xl', sub: 'text-[10px]' },
    lg: { img: 40, text: 'text-4xl', sub: 'text-xs' },
  }

  const { img, text, sub } = sizes[size]
  const textColor = inverted ? 'text-white' : 'text-foreground'
  const accentColor = inverted ? 'text-white' : 'text-primary'

  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 flex items-center justify-center bg-white rounded-md p-1 shadow-sm">
        <Image 
          src="/logo-16.png" 
          alt="TPA Logo" 
          width={img} 
          height={img}
          className="object-contain"
          priority
        />
      </div>
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
