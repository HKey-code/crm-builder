import React, { createContext, useContext, useMemo, useState } from 'react'

export type NotificationKind = 'system' | 'message'

export type AppLink = {
  applicationId: string
  tab?: 'overview' | 'inspections' | 'payments' | 'messages'
}

export type Notification = {
  id: string
  title: string
  time: string
  unread?: boolean
  kind: NotificationKind
  link?: AppLink
}

export type Message = {
  id: string
  applicationId: string
  sender: 'You' | 'Staff'
  text: string
  timestamp: string
  attachmentName?: string
}

type CommState = {
  notifications: Notification[]
  messagesByAppId: Record<string, Message[]>
}

type CommActions = {
  addMessage: (m: Omit<Message, 'id' | 'timestamp'> & { attachmentName?: string }) => void
  markNotificationRead: (id: string) => void
  addSystemNotification: (n: Omit<Notification, 'id' | 'time'>) => void
}

type CommContextValue = CommState & CommActions & {
  unreadCount: number
}

const CommContext = createContext<CommContextValue | null>(null)

function nowIso() {
  return new Date().toISOString()
}

export const CommProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'N1', title: 'Inspection scheduled for APP-1003', time: '5m ago', unread: true, kind: 'system', link: { applicationId: 'APP-1003', tab: 'inspections' } },
    { id: 'N2', title: 'Payment due for APP-1001', time: '1h ago', unread: true, kind: 'system', link: { applicationId: 'APP-1001', tab: 'payments' } },
    { id: 'N3', title: 'Message from reviewer on APP-1005', time: 'Yesterday', kind: 'message', link: { applicationId: 'APP-1005', tab: 'messages' } },
  ])

  const [messagesByAppId, setMessagesByAppId] = useState<Record<string, Message[]>>({
    'APP-1001': [
      { id: 'M1', applicationId: 'APP-1001', sender: 'Staff', text: 'Welcome to the portal!', timestamp: nowIso() },
    ],
    'APP-1005': [
      { id: 'M2', applicationId: 'APP-1005', sender: 'Staff', text: 'Please upload your site plan.', timestamp: nowIso() },
    ],
  })

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications])

  const addMessage: CommActions['addMessage'] = ({ applicationId, sender, text, attachmentName }) => {
    const id = `M${Math.random().toString(36).slice(2, 8)}`
    const message: Message = { id, applicationId, sender, text, timestamp: nowIso(), attachmentName }
    setMessagesByAppId((prev) => ({
      ...prev,
      [applicationId]: [...(prev[applicationId] ?? []), message],
    }))
    setNotifications((prev) => [
      { id: `N${Math.random().toString(36).slice(2, 8)}`, title: `New message on ${applicationId}`, time: 'just now', unread: true, kind: 'message', link: { applicationId, tab: 'messages' } },
      ...prev,
    ])
  }

  const markNotificationRead: CommActions['markNotificationRead'] = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const addSystemNotification: CommActions['addSystemNotification'] = (n) => {
    setNotifications((prev) => [
      { id: `N${Math.random().toString(36).slice(2, 8)}`, time: 'just now', unread: true, ...n },
      ...prev,
    ])
  }

  const value: CommContextValue = {
    notifications,
    messagesByAppId,
    unreadCount,
    addMessage,
    markNotificationRead,
    addSystemNotification,
  }
  return <CommContext.Provider value={value}>{children}</CommContext.Provider>
}

export function useComm() {
  const ctx = useContext(CommContext)
  if (!ctx) throw new Error('useComm must be used within CommProvider')
  return ctx
}


