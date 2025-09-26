import * as React from 'react'
import { NavLink, Link } from 'react-router-dom'

export function SettingsHeader({
  title,
  tabs,
  onOpenLeft,
}: {
  title?: string
  tabs?: { to: string; label: string }[]
  onOpenLeft?: () => void
}) {
  return (
    <header className="px-6 pt-3 pb-2 border-b bg-background sticky top-16 z-10">
      <div className="flex items-center gap-2">
        <button className="md:hidden rounded p-2 hover:bg-[var(--lpc-bg)]" onClick={onOpenLeft} aria-label="Open navigation">
          ☰
        </button>
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li><Link to="/settings" className="hover:text-foreground">Settings</Link></li>
            <li aria-hidden>/</li>
            <li className="text-foreground">{title ?? 'Settings'}</li>
          </ol>
        </nav>
      </div>
      {tabs?.length ? (
        <div className="mt-2 border-b">
          <nav className="flex gap-4 text-sm">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) => [
                  'px-3 py-2 -mb-px border-b-2',
                  isActive
                    ? 'border-[var(--lpc-primary)] text-[var(--lpc-primary)] font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                ].join(' ')}
                end
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}

export default SettingsHeader


