export function Logo({ className = 'h-8 w-auto', src }: { className?: string; src?: string }) {
  if (src) {
    return (
      <img src={src} alt="La Plata County" className={className} onError={(e) => {
        const target = e.currentTarget
        target.onerror = null
        target.replaceWith(document.createElement('span'))
      }} />
    )
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true">
        <defs>
          <linearGradient id="mtn" x1="0" x2="1">
            <stop offset="0%" stopColor="#4A79A6"/><stop offset="100%" stopColor="#1C5E91"/>
          </linearGradient>
        </defs>
        <path d="M2 20 L10 6 L18 20 Z" fill="url(#mtn)"/>
        <path d="M10 20 L16 10 L24 20 Z" fill="#7FA5C3"/>
        <circle cx="22" cy="6" r="3" fill="#F0EAC6"/>
      </svg>
      <div className="leading-tight">
        <div className="text-white font-semibold tracking-wide">La Plata County</div>
        <div className="text-[11px] text-lpc-accent/90 -mt-0.5">Colorado</div>
      </div>
    </div>
  )
}

export default Logo


