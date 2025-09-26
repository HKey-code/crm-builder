import { createContext, useContext, useState, ReactNode } from 'react'

type AdminUIState = {
  isAdminRailOpen: boolean
  openAdminRail: () => void
  closeAdminRail: () => void
  toggleAdminRail: () => void
}

const AdminUIContext = createContext<AdminUIState | null>(null)

export function AdminUIProvider({ children }: { children: ReactNode }) {
  const [isAdminRailOpen, setOpen] = useState(false)
  return (
    <AdminUIContext.Provider
      value={{
        isAdminRailOpen,
        openAdminRail: () => setOpen(true),
        closeAdminRail: () => setOpen(false),
        toggleAdminRail: () => setOpen((v) => !v),
      }}
    >
      {children}
    </AdminUIContext.Provider>
  )
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext)
  if (!ctx) throw new Error('useAdminUI must be used within AdminUIProvider')
  return ctx
}





