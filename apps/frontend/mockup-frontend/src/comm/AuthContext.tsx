import React, { createContext, useContext } from 'react'

type AuthShape = { isAdmin: boolean; userName?: string }
const AuthContext = createContext<AuthShape>({ isAdmin: true, userName: 'Admin' })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={{ isAdmin: true, userName: 'Admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)


