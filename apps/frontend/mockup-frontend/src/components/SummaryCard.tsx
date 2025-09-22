import React from 'react'

type SummaryCardProps = {
  label: string
  count: number
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, count }) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-3xl font-bold text-lpc-primary">{count}</div>
      <div className="text-sm text-lpc-text">{label}</div>
    </div>
  )
}

export default SummaryCard


