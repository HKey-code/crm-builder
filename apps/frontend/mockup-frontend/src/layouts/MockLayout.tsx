import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Header from '../components/Header'
import { CommProvider } from '../comm/CommContext'
import Footer from '../components/Footer'
import LeftRail from '../components/LeftRail'

export default function MockLayout() {
  const [railExpanded, setRailExpanded] = useState(false)
  return (
    <CommProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--lpc-bg,#F2F6FA)] text-[var(--lpc-text,#263442)]">
        <Header />
        <div className="flex-1 flex gap-4">
          <LeftRail expanded={railExpanded} onToggle={() => setRailExpanded((v) => !v)} />
          <div className="w-full flex-1 relative">
            {/* Secondary toggle so the control is always visible near content */}
            <button
              className="hidden md:block absolute left-0 -ml-2 top-2 z-10 h-7 w-7 rounded-full bg-white/80 border border-gray-300 shadow hover:bg-white"
              aria-label={railExpanded ? 'Collapse menu' : 'Expand menu'}
              onClick={() => setRailExpanded((v) => !v)}
              title={railExpanded ? 'Collapse' : 'Expand'}
            >
              <span aria-hidden>≡</span>
            </button>
            <div className="mx-auto w-full max-w-6xl px-4 pt-0 pb-4 flex flex-col">
              <main className="flex-1">
                <Outlet />
              </main>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </CommProvider>
  )
}


