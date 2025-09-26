import { NavLink, useNavigate, useLocation } from 'react-router-dom'

type TabItem = { label: string; to: string; id: string }

export function NavTabs({ items }: { items: Array<TabItem> }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div role="tablist" aria-label="Scripting tabs" className="flex gap-4 text-sm border-b">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            id={`${it.id}-tab`
            }
            role="tab"
            aria-controls={`${it.id}-panel`}
            className={({ isActive }) =>
              [
                'px-3 py-2 -mb-px border-b-2 focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2 rounded-sm',
                isActive
                  ? 'border-[var(--lpc-primary)] text-[var(--lpc-primary)] font-medium'
                  : 'border-transparent text-[var(--lpc-muted)] hover:text-[var(--lpc-primary)]',
              ].join(' ')
            }
            aria-selected={pathname === it.to}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                navigate(it.to)
              }
            }}
            end
          >
            {it.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default NavTabs


