export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-[#26000a] via-[#5c000f] to-primary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_15%,rgba(216,0,22,0.45),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(0,0,0,0.35),transparent_50%)]" />

      {/* Decorative tennis/padel motifs — purely visual, sits behind the card */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
        aria-hidden="true"
      >
        {/* racket, top right */}
        <g opacity="0.12" stroke="#fff" fill="none" strokeWidth="5">
          <ellipse cx="660" cy="130" rx="95" ry="118" />
          <line x1="620" y1="228" x2="560" y2="360" strokeLinecap="round" strokeWidth="14" />
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1="575" y1={30 + i * 33} x2="745" y2={30 + i * 33} strokeWidth="1.5" opacity="0.7" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`v${i}`} x1={585 + i * 27} y1="18" x2={585 + i * 27} y2="242" strokeWidth="1.5" opacity="0.7" />
          ))}
        </g>

        {/* tennis balls */}
        <g>
          <circle cx="90" cy="500" r="80" fill="#FFE600" opacity="0.14" />
          <path d="M20 470a95 95 0 0 0 70 92" stroke="#fff" strokeWidth="2" fill="none" opacity="0.25" />
          <path d="M160 530a95 95 0 0 0 -70 -92" stroke="#fff" strokeWidth="2" fill="none" opacity="0.25" />
        </g>
        <circle cx="730" cy="470" r="34" fill="#FFE600" opacity="0.1" />
        <circle cx="130" cy="70" r="20" fill="#FFE600" opacity="0.12" />

        {/* faint court lines */}
        <g stroke="#fff" strokeWidth="2" opacity="0.08">
          <line x1="-50" y1="560" x2="500" y2="150" />
          <line x1="50" y1="620" x2="600" y2="180" />
        </g>
      </svg>

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
