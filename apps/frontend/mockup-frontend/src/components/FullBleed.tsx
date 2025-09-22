import type { ReactNode } from 'react'

export default function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        left: 'calc(50% - 50vw + var(--rail-w) - var(--container-pad))',
        width: 'calc(100vw - var(--rail-w) + var(--container-pad))',
        maxWidth: '100vw',
      }}
    >
      {children}
    </div>
  )
}
