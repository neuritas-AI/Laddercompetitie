export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 overflow-hidden bg-gray-50">
      {/* Red brand band across the top */}
      <div className="absolute inset-x-0 top-0 h-72 overflow-hidden bg-gradient-to-br from-primary to-secondary">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 800 300"
          aria-hidden="true"
        >
          {/* racket, top right */}
          <g opacity="0.14" stroke="#fff" fill="none" strokeWidth="5">
            <ellipse cx="680" cy="60" rx="85" ry="105" />
            <line x1="645" y1="150" x2="590" y2="270" strokeLinecap="round" strokeWidth="13" />
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`h${i}`} x1="600" y1={-30 + i * 33} x2="760" y2={-30 + i * 33} strokeWidth="1.5" opacity="0.7" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`v${i}`} x1={605 + i * 27} y1="-42" x2={605 + i * 27} y2="162" strokeWidth="1.5" opacity="0.7" />
            ))}
          </g>
          {/* tennis balls */}
          <g>
            <circle cx="80" cy="230" r="70" fill="#fff" opacity="0.1" />
            <path d="M18 202a85 85 0 0 0 62 82" stroke="#fff" strokeWidth="2" fill="none" opacity="0.22" />
            <path d="M142 258a85 85 0 0 0 -62 -82" stroke="#fff" strokeWidth="2" fill="none" opacity="0.22" />
          </g>
          <circle cx="110" cy="40" r="18" fill="#fff" opacity="0.12" />
        </svg>
      </div>

      {/* Soft wave transition from the red band into the page background */}
      <svg
        className="absolute inset-x-0 top-56 w-full h-20 text-gray-50"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,40 C360,100 1080,100 1440,40 L1440,100 L0,100 Z" fill="currentColor" />
      </svg>

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
