import React from 'react'
import ViewportDebug from '../components/ViewportDebug'
import { applications } from '../mock-data'
import SummaryCard from '../components/SummaryCard'
import DataTable from '../components/DataTable'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner'

export const ApplicationsPage: React.FC = () => {
  const inProgress = applications.filter((a) => a.status === 'In Review' || a.status === 'Submitted').length
  const inspections = applications.filter((a) => a.status === 'Awaiting Inspection').length
  const paymentsDue = 1

  return (
    <>
      {/* Full-bleed hero that underlaps the rail */}
      <section
        className="
          relative z-0
          -ml-[var(--rail-w,56px)]
          w-[calc(100%+var(--rail-w,56px))]
          max-w-[calc(100%+var(--rail-w,56px))]
          overflow-hidden
        "
      >
        <HeroBanner slim />
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 pt-0 md:pl-[var(--rail-w,56px)]">
        <h1 className="mb-4 text-2xl font-semibold text-lpc-primary">My Applications</h1>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 md:pl-[var(--rail-w,56px)] mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Applications in Progress" count={inProgress} />
        <SummaryCard label="Inspections Scheduled" count={inspections} />
        <SummaryCard label="Payments Due" count={paymentsDue} />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 md:pl-[var(--rail-w,56px)]">
        <DataTable
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'type', header: 'Type' },
          { key: 'status', header: 'Status' },
          { key: 'submittedAt', header: 'Submitted' },
          { key: 'actions', header: 'Actions', render: (row: any) => <Link className="text-lpc-secondary underline" to={`/applications/${row.id}`}>View</Link> },
        ]}
        rows={applications}
      />
      </div>
    </>
  )
}

export default ApplicationsPage
