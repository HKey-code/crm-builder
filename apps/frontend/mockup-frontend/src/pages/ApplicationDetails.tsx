import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { applications, inspectionsByAppId, invoicesByAppId } from '../mock-data'
import { Tabs } from '../components/Tabs'
import DataTable from '../components/DataTable'
import { Modal } from '../components/Modal'
import { useComm } from '../comm/CommContext'
import ComposeBox from './ComposeBox'
import ProgressTracker from '../components/ProgressTracker'

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams()
  const location = useLocation() as any
  const app = useMemo(() => applications.find((a) => a.id === id), [id])
  const [tab, setTab] = useState('overview')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const { messagesByAppId, addMessage } = useComm()

  if (!app) {
    return <div className="mx-auto max-w-4xl p-4">Application not found.</div>
  }

  const [inspections, setInspections] = useState(inspectionsByAppId[app.id] || [])
  const [invoices, setInvoices] = useState(invoicesByAppId[app.id] || [])
  const thread = messagesByAppId[app.id] || []

  useEffect(() => {
    if (location.state?.tab) setTab(location.state.tab)
  }, [location.state])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm">
        <ol className="flex gap-2 text-[var(--lpc-muted)]">
          <li><Link className="underline" to="/applications">My Applications</Link></li>
          <li aria-hidden>/</li>
          <li className="text-[var(--lpc-text)] font-medium">Application {app.id}</li>
        </ol>
      </nav>
      <h1 className="mb-4 text-2xl font-semibold text-lpc-primary">Application {app.id}</h1>
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', content: (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded border bg-white p-4">
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <dt className="text-gray-600">ID</dt><dd className="col-span-2">{app.id}</dd>
                  <dt className="text-gray-600">Type</dt><dd className="col-span-2">{app.type}</dd>
                  <dt className="text-gray-600">Status</dt><dd className="col-span-2">{app.status}</dd>
                  <dt className="text-gray-600">Submitted</dt><dd className="col-span-2">{app.submittedAt}</dd>
                  <dt className="text-gray-600">Last Updated</dt><dd className="col-span-2">{app.lastUpdatedAt}</dd>
                  <dt className="text-gray-600">Next Step</dt><dd className="col-span-2">Awaiting reviewer feedback</dd>
                </dl>
              </div>
              <div className="rounded border bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-lpc.muted">Progress</h2>
                <ProgressTracker steps={["Submitted","Review","Inspection","Decision"]} current={1} />
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-lpc.muted">Upload Documents</h3>
                  <div className="flex items-center gap-2">
                    <input type="file" className="rounded border px-3 py-2" />
                    <button className="rounded bg-lpc.link px-3 py-2 text-white">Upload</button>
                  </div>
                </div>
              </div>
            </div>
          )},
          { id: 'inspections', label: 'Inspections', content: (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button className="rounded bg-lpc-primary px-3 py-2 text-white hover:bg-[#0b417a] focus:ring-2 focus:ring-lpc-secondary" onClick={() => setScheduleOpen(true)}>Schedule</button>
              </div>
              <DataTable
                columns={[
                  { key: 'date', header: 'Date' },
                  { key: 'type', header: 'Type' },
                  { key: 'status', header: 'Status' },
                  { key: 'result', header: 'Result' },
                ]}
                rows={inspections}
              />
            </div>
          )},
          { id: 'payments', label: 'Payments', content: (
            <div className="space-y-3">
              <DataTable
                columns={[
                  { key: 'invoiceId', header: 'Invoice ID' },
                  { key: 'amount', header: 'Amount' },
                  { key: 'due', header: 'Due' },
                  { key: 'status', header: 'Status' },
                  { key: 'invoiceId', header: 'Actions', render: () => (
                    <button className="rounded bg-lpc-secondary px-3 py-1 text-white" onClick={() => setPayOpen(true)}>Pay</button>
                  ) },
                ]}
                rows={invoices}
              />
            </div>
          )},
          { id: 'messages', label: 'Messages', content: (
            <div className="space-y-3">
              <div className="space-y-2">
                {thread.map((m) => (
                  <div key={m.id} className={`rounded border bg-white p-3 text-sm ${m.sender==='You'?'border-lpc.link':'border-lpc.stroke'}`}>
                    <p className="mb-1"><strong>{m.sender}</strong> <span className="text-xs text-lpc.muted">{new Date(m.timestamp).toLocaleString()}</span></p>
                    <p className="text-lpc.text">{m.text}</p>
                    {m.attachmentName && <span className="mt-1 inline-block rounded bg-lpc.bg px-2 py-0.5 text-xs text-lpc.muted border">{m.attachmentName}</span>}
                  </div>
                ))}
              </div>
              <ComposeBox onSend={(text, fileName) => addMessage({ applicationId: app.id, sender: 'You', text, attachmentName: fileName })} />
            </div>
          )},
        ]}
        activeId={tab}
        onChange={setTab}
      />

      <Modal title="Schedule Inspection" open={scheduleOpen} onClose={() => setScheduleOpen(false)} footer={
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2" onClick={() => setScheduleOpen(false)}>Cancel</button>
          <button className="rounded bg-lpc-primary px-3 py-2 text-white" onClick={() => setScheduleOpen(false)}>Schedule</button>
        </div>
      }>
        <div className="space-y-3">
          <label className="block text-sm text-lpc-text">
            <span className="mb-1 inline-block">Date</span>
            <input id="schedule-date" type="date" className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-lpc-secondary" />
          </label>
          <label className="block text-sm text-lpc-text">
            <span className="mb-1 inline-block">Time</span>
            <input id="schedule-time" type="time" className="mt-1 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-lpc-secondary" />
          </label>
          <div className="flex justify-end">
            <button className="rounded bg-lpc.link px-3 py-2 text-white" onClick={() => {
              const date = (document.getElementById('schedule-date') as HTMLInputElement)?.value || new Date().toISOString().slice(0,10)
              const time = (document.getElementById('schedule-time') as HTMLInputElement)?.value || '09:00'
              setInspections((rows) => [...rows, { date: `${date} ${time}`, type: 'General', status: 'Scheduled' }])
              setScheduleOpen(false)
            }}>Confirm</button>
          </div>
        </div>
      </Modal>

      <Modal title="Checkout" open={payOpen} onClose={() => setPayOpen(false)} footer={
        <button className="rounded bg-lpc-primary px-4 py-2 text-white" onClick={() => {
          setInvoices((rows) => rows.map((r, idx) => idx === 0 ? { ...r, status: 'Paid' } : r))
          setPayOpen(false)
        }}>Pay Now</button>
      }>
        <p className="text-lpc-text">Mock checkout: paying the first listed invoice. A receipt number will be shown on close.</p>
      </Modal>
    </div>
  )
}

export default ApplicationDetailsPage


