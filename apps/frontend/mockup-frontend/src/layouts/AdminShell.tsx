import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../comm/AuthContext'
import { AdminUIProvider } from '../contexts/AdminUIContext'

function AdminContent({ fullBleed }: { fullBleed?: boolean }) {
  const { isAdmin } = useAuth()
  const location = useLocation()

  const canViewSettings = useMemo(() => !!isAdmin, [isAdmin])

  if (!canViewSettings) {
    return <Navigate to="/applications" state={{ returnTo: location.pathname }} replace />
  }

  return (
    <AdminContentWithRail fullBleed={fullBleed} />
  )
}

function AdminContentWithRail({ fullBleed }: { fullBleed?: boolean }) {
  const { pathname } = useLocation()
  const isSettings = pathname.startsWith('/settings')

  return (
    <div className="w-full flex-1">
      <div className={`${fullBleed ? 'w-full px-0 pt-0 pb-0 flex' : 'mx-auto w-full max-w-6xl px-4 pt-0 pb-4 flex'}`}>
        <main className="flex-1 min-w-0">
          {pathname === '/settings' && (
            <header className="mb-4">
              <h1 className="text-2xl font-semibold text-[var(--lpc-primary)]">Settings</h1>
            </header>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AdminShell({ fullBleed = false }: { fullBleed?: boolean }) {
  return (
    <AdminUIProvider>
      <AdminContent fullBleed={fullBleed} />
    </AdminUIProvider>
  )
}


