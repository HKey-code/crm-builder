import React, { useEffect, useRef } from 'react'

type RightDrawerProps = {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export const RightDrawer: React.FC<RightDrawerProps> = ({ title, open, onClose, children }) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
        if (e.key === 'Tab' && panelRef.current) {
          const focusables = Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          )
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (!first || !last) return
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus()
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute inset-y-0 right-0 flex max-w-full pl-10`}>
        <div
          ref={panelRef}
          className={`w-screen max-w-md transform bg-white shadow-xl transition-transform focus:outline-none ${open ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold text-lpc-text">{title}</h2>
            <button className="rounded px-2 py-1 text-lpc-text hover:bg-lpc-bg focus:ring-2 focus:ring-lpc-secondary" onClick={onClose} aria-label="Close notifications">
              ✕
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-full">{children}</div>
        </div>
      </div>
    </div>
  )
}


