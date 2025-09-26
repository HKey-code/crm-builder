import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../comm/AuthContext'

type ItemProps = { to: string; label: string; icon?: string; expanded: boolean; onClick?: () => void }

const Item = ({ to, label, icon, expanded, onClick }: ItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        'group flex items-center rounded-md text-[var(--lpc-text)] hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200',
        expanded ? 'h-12 w-56 px-3 gap-2' : 'h-16 w-12 flex-col justify-start',
        isActive ? 'bg-white/60' : '',
      ].join(' ')
    }
    aria-label={label}
    onClick={onClick}
  >
    {expanded ? (
      <div className="flex items-center gap-2">
        {icon ? <span className="text-xl leading-none" aria-hidden>{icon}</span> : null}
        <span className="text-sm leading-tight truncate">{label}</span>
      </div>
    ) : (
      <>
        {icon ? <span className="text-xl mt-1 leading-none" aria-hidden>{icon}</span> : null}
        <span className="mt-1 text-[10px] leading-tight text-center">{label}</span>
      </>
    )}
  </NavLink>
)

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    className={`h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    aria-hidden
  >
    <path
      fill="currentColor"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z"
    />
  </svg>
)

// (legacy MenuGroup removed; using explicit settings group below)

export default function LeftRail({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const showSettings = useMemo(() => !!isAdmin, [isAdmin])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const prevPathRef = useRef(location.pathname)

  // Auto-open when on /settings/* and ensure rail is expanded for usability
  useEffect(() => {
    const nowInSettings = location.pathname.startsWith('/settings')
    const wasInSettings = prevPathRef.current.startsWith('/settings')
    if (nowInSettings) {
      // Keep the section open when anywhere in settings
      setSettingsOpen(true)
      // Only auto-expand the rail when first entering the settings area
      if (!wasInSettings && !expanded) {
        onToggle()
      }
    }
    prevPathRef.current = location.pathname
  }, [location.pathname, expanded, onToggle])
  return (
    <aside
      className={`flex flex-col items-center pt-4 pb-4 gap-3 bg-[var(--lpc-bg,#F2F6FA)] border-r border-[var(--lpc-stroke)] transition-all duration-300 overflow-hidden sticky top-16 z-40 max-h-[calc(100vh-64px)] overflow-y-auto ${expanded ? 'w-56 shadow-md' : 'w-14'}`}
      role="menu"
      aria-label="Primary navigation"
    >
      <button
        className="flex h-12 w-12 items-center justify-center rounded-md text-[var(--lpc-text)] hover:bg-white/40 bg-white/30 border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
        aria-expanded={expanded}
        onClick={onToggle}
        title={expanded ? 'Collapse menu' : 'Expand menu'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path fill="currentColor" d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
        </svg>
      </button>
      <Item to="/apply" label="Apply" icon="➕" expanded={expanded} />
      <Item to="/applications" label="My Apps" icon="📄" expanded={expanded} />
      <Item to="/help" label="Help" icon="❓" expanded={expanded} />
      <Item to="/notifications" label="Alerts" icon="🔔" expanded={expanded} />
      {showSettings && (
        <>
          {expanded ? (
            <button
              type="button"
              aria-expanded={settingsOpen}
              aria-controls="settings-subnav"
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-56 h-12 px-3 flex items-center justify-between rounded-md text-[var(--lpc-text)] hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-xl">⚙️</span>
                <span className="text-sm leading-tight truncate">Settings</span>
              </div>
              <Chevron open={settingsOpen} />
            </button>
          ) : (
            <Item
              to="/settings"
              label="Settings"
              icon="⚙️"
              expanded={expanded}
              onClick={() => {
                if (!expanded) onToggle()
                setTimeout(() => navigate('/settings'), 0)
              }}
            />
          )}

          {expanded && settingsOpen && (
            <nav id="settings-subnav" className="w-56 mt-1 mb-2">
              <ul className="space-y-1">
                {[
                  { to: '/settings', label: 'Overview' },
                  { to: '/settings/scripting', label: 'Scripting' },
                  { to: '/settings/workflow', label: 'Workflow' },
                  { to: '/settings/users', label: 'User Management' },
                  { to: '/settings/roles-permissions', label: 'Roles & Permissions' },
                  { to: '/settings/notifications', label: 'Notifications' },
                  { to: '/settings/templates', label: 'Templates' },
                  { to: '/settings/branding', label: 'Branding / Theme' },
                  { to: '/settings/catalog', label: 'Service Catalog' },
                  { to: '/settings/permit-types', label: 'Permit Types' },
                  { to: '/settings/fees', label: 'Fees' },
                  { to: '/settings/gis', label: 'GIS / Integrations' },
                  { to: '/settings/audit-logs', label: 'Audit Logs' },
                ].map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      className={({ isActive }) =>
                        [
                          'block rounded px-3 py-2 text-sm pl-6',
                          'text-[var(--lpc-text)] hover:bg-white/40 focus:outline-none focus:ring-2 focus:ring-white/40',
                          isActive ? 'bg-white/60 font-medium' : '',
                        ].join(' ')
                      }
                    >
                      {i.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </aside>
  )
}
