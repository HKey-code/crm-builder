import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import { RightDrawer } from './RightDrawer'
import { useComm } from '../comm/CommContext'
import { useAuth } from '../comm/AuthContext'

export const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstMenuItemRef = useRef<HTMLElement | null>(null)
  const { notifications, unreadCount } = useComm()
  const storedFirstName = typeof window !== 'undefined' ? window.localStorage.getItem('firstName') : null
  const firstName = storedFirstName && storedFirstName.trim().length > 0 ? storedFirstName : 'User'
  const { isAdmin } = useAuth()

  // Keyboard and outside-click handling for account menu
  useEffect(() => {
    if (!avatarOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAvatarOpen(false)
        avatarButtonRef.current?.focus()
      }
    }

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const targetNode = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(targetNode) &&
        !(avatarButtonRef.current && avatarButtonRef.current.contains(targetNode))
      ) {
        setAvatarOpen(false)
        avatarButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    const timer = window.setTimeout(() => {
      firstMenuItemRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [avatarOpen])

  return (
    <header className="sticky top-0 z-50 bg-lpc-primary text-white shadow-sm border-t-6 border-[var(--lpc-secondary)]">
      <div className="w-full h-16 px-0 flex items-center gap-4 pt-0.5 relative">
        <div className="flex items-center gap-6 shrink-0 pl-2">
          <Link to="/applications" className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded">
            <Logo src="/lpc-logo.svg" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/apply" className={({ isActive }) => `focus:outline-none focus:ring-2 focus:ring-white/50 rounded hover:text-lpc-secondary ${isActive ? 'underline' : 'hover:underline'}`}>Apply</NavLink>
            <NavLink to="/applications" className={({ isActive }) => `focus:outline-none focus:ring-2 focus:ring-white/50 rounded hover:text-lpc-secondary ${isActive ? 'underline' : 'hover:underline'}`}>My Applications</NavLink>
            <NavLink to="/help" className={({ isActive }) => `focus:outline-none focus:ring-2 focus:ring-white/50 rounded hover:text-lpc-secondary ${isActive ? 'underline' : 'hover:underline'}`}>Help</NavLink>
            {isAdmin && (
              <NavLink to="/settings" className={({ isActive }) => `focus:outline-none focus:ring-2 focus:ring-white/50 rounded hover:text-lpc-secondary ${isActive ? 'underline' : 'hover:underline'}`}>Settings</NavLink>
            )}
          </nav>
        </div>
        <form role="search" aria-label="Search permits" className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-lg" onSubmit={(e) => e.preventDefault()}>
          <input
            type="search"
            placeholder="Search permits, cases, or addresses"
            className="w-full rounded-md bg-white/95 px-3 py-1.5 text-[var(--lpc-text)] placeholder:text-[var(--lpc-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lpc-accent)]"
          />
        </form>
        <div className="ml-auto flex items-center gap-3 shrink-0 pr-2">
          <button aria-label="Notifications" className="relative focus:outline-none focus:ring-2 focus:ring-white/50 rounded" onClick={() => setDrawerOpen(true)}>
            <span aria-hidden>🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-lpc-accent" />
            )}
          </button>
          <div className="relative">
            <button
              id="account-menu-button"
              aria-label={`Account menu for ${firstName}`}
              title={firstName}
              className="ml-1 h-8 w-8 rounded-full bg-white grid place-items-center text-[var(--lpc-primary)] focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-haspopup="menu"
              aria-expanded={avatarOpen}
              aria-controls="account-menu"
              ref={avatarButtonRef}
              onClick={() => setAvatarOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M12 12a5 5 0 1 0 0-10a5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
              </svg>
            </button>
            {avatarOpen && (
              <div
                id="account-menu"
                role="menu"
                aria-labelledby="account-menu-button"
                ref={menuRef}
                className="absolute right-0 mt-2 w-40 overflow-hidden rounded-md border bg-white shadow-lg"
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  ref={firstMenuItemRef as React.RefObject<HTMLAnchorElement>}
                  tabIndex={-1}
                  className="block px-3 py-2 text-sm hover:bg-lpc-bg"
                  onClick={() => {
                    setAvatarOpen(false)
                    avatarButtonRef.current?.focus()
                  }}
                >
                  Profile
                </Link>
                <button
                  role="menuitem"
                  tabIndex={-1}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-lpc-bg"
                  onClick={() => {
                    setAvatarOpen(false)
                    avatarButtonRef.current?.focus()
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <RightDrawer title="Notifications" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <ul className="space-y-3" aria-label="Notifications list">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-3">
              <span className={`mt-1 inline-block h-2 w-2 rounded-full ${n.unread ? 'bg-lpc-accent' : 'bg-gray-300'}`} aria-hidden />
              <div>
                <p className="text-sm text-lpc-text">{n.title}</p>
                <p className="text-xs text-gray-500">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </RightDrawer>
    </header>
  )
}

export default Header


