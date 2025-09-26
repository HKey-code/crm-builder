import { Outlet, useMatch } from 'react-router-dom'
import Header from '../components/Header'
import { CommProvider } from '../comm/CommContext'
import { AdminUIProvider } from '../contexts/AdminUIContext'
import Footer from '../components/Footer'
import LeftRail from '../components/LeftRail'
import { useState } from 'react'
import { useIsDesktop } from '../hooks/useIsDesktop'

export default function AppShell() {
  const [railExpanded, setRailExpanded] = useState(false)
  const isDesktop = useIsDesktop()
  const isSettings = !!useMatch('/settings/*')
  const style: React.CSSProperties = {
    ['--rail-w' as any]: isDesktop ? (railExpanded ? '224px' : '56px') : '0px',
    ['--content-gap' as any]: '0px',
  }
  return (
    <CommProvider>
      <AdminUIProvider>
        <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--lpc-bg,#F2F6FA)] text-[var(--lpc-text,#263442)]" style={style}>
          <Header />
          <div className="flex-1 min-h-0 flex gap-0 bg-[var(--lpc-bg)]">
            <LeftRail expanded={railExpanded} onToggle={() => setRailExpanded((v) => !v)} />
            <div className="w-full flex-1 min-w-0">
              {isSettings ? (
                <div className="h-full w-full flex flex-col">
                  <main className="flex-1 min-h-0">
                    <Outlet />
                  </main>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-6xl px-4 pt-0 pb-4 flex flex-col">
                  <main className="flex-1 min-h-0">
                    <Outlet />
                  </main>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </AdminUIProvider>
    </CommProvider>
  )
}
