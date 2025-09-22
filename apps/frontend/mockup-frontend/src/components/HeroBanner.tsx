import { useState } from 'react'

type HeroBannerProps = { slim?: boolean }

export default function HeroBanner({ slim = true }: HeroBannerProps) {
  const imageCandidates = ['/Hero.png', '/HERO.PNG', '/hero.png', '/hero.jpg']
  const [imageIndex, setImageIndex] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const src = imageCandidates[imageIndex]

  return (
    <div className="relative z-0 overflow-hidden rounded-r-md bg-[var(--lpc-surface)] shadow-sm border-b border-[var(--lpc-stroke)] mt-0">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`${slim ? 'h-48' : 'h-52'} w-full object-cover object-[center_16%]`}
        style={{ display: showFallback ? 'none' : undefined }}
        onError={() => {
          if (imageIndex < imageCandidates.length - 1) {
            setImageIndex((i) => i + 1)
          } else {
            setShowFallback(true)
          }
        }}
      />
      <svg style={{ display: showFallback ? 'block' : 'none' }} className={`${slim ? 'h-48' : 'h-52'} w-full`} viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bfe3ff" />
            <stop offset="100%" stopColor="#e6f3ff" />
          </linearGradient>
        </defs>
        <rect width="800" height="200" fill="url(#grad)" />
        <path d="M0 160 L120 120 L200 160 L300 100 L380 160 L500 120 L600 160 L800 120 L800 200 L0 200 Z" fill="#d0e7ff" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/0" />
      <div className="absolute inset-0 flex items-start justify-center pt-2">
        <h1 className="text-[var(--lpc-text)] text-2xl sm:text-3xl font-bold drop-shadow">Welcome to La Plata County</h1>
      </div>
    </div>
  )
}
