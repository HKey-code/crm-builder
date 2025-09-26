import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComm } from '../comm/CommContext'

type Filter = 'all' | 'unread' | 'system' | 'message'

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useComm()
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()

  const list = useMemo(() => notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !!n.unread
    return n.kind === filter
  }), [notifications, filter])

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold text-lpc.text">Notifications</h1>
      <div className="mb-4 flex gap-2">
        {(['all','unread','system','message'] as Filter[]).map((f) => (
          <button key={f} className={`rounded border px-3 py-1 ${filter===f? 'bg-lpc.primary text-white border-lpc.primary' : 'bg-lpc.surface'}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {list.map((n) => (
          <li key={n.id} className="flex items-start gap-3 rounded border p-3 bg-white">
            <span className={`mt-1 inline-block h-2 w-2 rounded-full ${n.unread ? 'bg-lpc.accent' : 'bg-lpc.stroke'}`} />
            <div className="flex-1">
              <div className="text-sm text-lpc.text">{n.title}</div>
              <div className="text-xs text-lpc.muted">{n.time}</div>
            </div>
            {n.link && (
              <button className="rounded bg-lpc.link px-3 py-1 text-white" onClick={() => {
                markNotificationRead(n.id)
                navigate(`/applications/${n.link!.applicationId}`, { state: { tab: n.link!.tab } })
              }}>Open</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}


