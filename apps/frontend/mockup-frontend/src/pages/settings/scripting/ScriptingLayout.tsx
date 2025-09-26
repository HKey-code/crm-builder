import { Outlet, NavLink, useParams, useLocation, Navigate } from 'react-router-dom'

export function ScriptingLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const isDetail = !!id

  return (
    <div className="flex h-full w-full flex-col">
      <header className="px-6 pt-3 pb-2 border-b bg-background">
        <nav aria-label="Breadcrumb" className="text-sm text-[var(--lpc-muted)]">
          <ol className="flex items-center gap-2">
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'text-[var(--lpc-primary)]' : 'hover:text-[var(--lpc-primary)]'}>Settings</NavLink>
            </li>
            <li aria-hidden> / </li>
            <li className="text-[var(--lpc-text)]">Scripting</li>
          </ol>
        </nav>
        <div className="mt-2 border-b">
          <nav className="flex gap-4 text-sm">
            {!isDetail ? (
              <>
                <Tab to="/settings/scripting/list" label="All Scripts" />
                <Tab to="/settings/scripting/new" label="New Script" />
              </>
            ) : (
              <>
                <Tab to={`/settings/scripting/${id}`} label="Overview" />
                <Tab to={`/settings/scripting/${id}/versions`} label="Versions" />
                <Tab to={`/settings/scripting/${id}/test`} label="Test" />
              </>
            )}
          </nav>
        </div>
      </header>
      {pathname.endsWith('/scripting') && <Navigate to="/settings/scripting/list" replace />}
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  )
}

function Tab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3 py-2 -mb-px border-b-2',
          isActive
            ? 'border-[var(--lpc-primary)] text-[var(--lpc-primary)] font-medium'
            : 'border-transparent text-[var(--lpc-muted)] hover:text-[var(--lpc-primary)]',
        ].join(' ')
      }
      end
    >
      {label}
    </NavLink>
  )
}


