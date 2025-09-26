import { Outlet } from 'react-router-dom'
import ViewportDebug from '../components/ViewportDebug'
import Header from '../components/Header'
import Footer from '../components/Footer'
import LeftRail from '../components/LeftRail'
import { CommProvider } from '../comm/CommContext'
import { AdminUIProvider } from '../contexts/AdminUIContext'
import { useState } from 'react'
import { useIsDesktop } from '../hooks/useIsDesktop'

export default function AppShellFullBleed() {
  const [railExpanded, setRailExpanded] = useState(false)
  const isDesktop = useIsDesktop()
  const style: React.CSSProperties = {
    ['--rail-w' as any]: isDesktop ? (railExpanded ? '224px' : '56px') : '0px',
    ['--content-gap' as any]: '0px',
  }
  return (
    <CommProvider>
      <AdminUIProvider>
        <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--lpc-bg,#F2F6FA)] text-[var(--lpc-text,#263442)]" style={style}>
          <Header/>
          <div className="flex-1 flex gap-0 bg-[var(--lpc-bg)]">
            <LeftRail expanded={railExpanded} onToggle={() => setRailExpanded((v) => !v)} />
            <div className="w-full flex-1 min-w-0">
              <main className="flex-1 min-w-0">
                <Outlet/>
              </main>
                {/* 👇 Add the debug component here so it shows below all page content */}
  <ViewportDebug />

            </div>
          </div>
          <Footer/>
        </div>
      </AdminUIProvider>
    </CommProvider>
  )
}


