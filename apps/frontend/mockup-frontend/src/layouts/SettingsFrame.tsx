import * as React from 'react'
import { Portal } from '../components/Portal'

export function SettingsFrame({
  left,
  right,
  children,
}: {
  left: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full w-full">
      {/* Left sub-rail column (desktop sticky) */}
      <div className="hidden md:block w-[var(--settings-left,240px)] border-r bg-white sticky top-16 self-start h[calc(100vh-64px)] h-[calc(100vh-64px)] overflow-y-auto">
        {left}
      </div>

      {/* Main content + optional right rail */}
      <div className="flex-1 min-w-0 flex">
        {/* Center content */}
        <section className="flex-1 min-w-0 overflow-hidden">
          {children}
        </section>

        {/* Right rail column (optional, page-controlled) */}
        {right ? (
          <aside className="shrink-0 border-l bg-white">
            {right}
          </aside>
        ) : null}
      </div>
    </div>
  )
}

export function SettingsLeftDrawer({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Portal>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      )}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={[
          'md:hidden fixed inset-y-0 left-14 z-50 w-[var(--settings-left,240px)] bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-[260px]',
        ].join(' ')}
      >
        {children}
      </aside>
    </Portal>
  )
}

export default SettingsFrame


