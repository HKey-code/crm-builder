export type ApplicationItem = {
  id: string
  type: 'Building Permit' | 'Business License' | 'Planning Case'
  status: 'Submitted' | 'In Review' | 'Awaiting Inspection' | 'Approved'
  submittedAt: string
  lastUpdatedAt: string
}

export const applications: ApplicationItem[] = [
  { id: 'APP-1001', type: 'Building Permit', status: 'In Review', submittedAt: '2025-08-01', lastUpdatedAt: '2025-08-20' },
  { id: 'APP-1002', type: 'Business License', status: 'Submitted', submittedAt: '2025-08-18', lastUpdatedAt: '2025-08-18' },
  { id: 'APP-1003', type: 'Planning Case', status: 'Awaiting Inspection', submittedAt: '2025-08-02', lastUpdatedAt: '2025-08-21' },
  { id: 'APP-1004', type: 'Building Permit', status: 'Approved', submittedAt: '2025-07-25', lastUpdatedAt: '2025-08-10' },
  { id: 'APP-1005', type: 'Business License', status: 'In Review', submittedAt: '2025-08-10', lastUpdatedAt: '2025-08-19' },
  { id: 'APP-1006', type: 'Planning Case', status: 'Submitted', submittedAt: '2025-08-19', lastUpdatedAt: '2025-08-19' },
]

export type NotificationItem = {
  id: string
  title: string
  time: string
  unread?: boolean
}

export const notifications: NotificationItem[] = [
  { id: 'N1', title: 'Inspection scheduled for APP-1003', time: '5m ago', unread: true },
  { id: 'N2', title: 'Payment due for APP-1001', time: '1h ago', unread: true },
  { id: 'N3', title: 'Message from reviewer on APP-1005', time: 'Yesterday' },
]

export type InspectionRow = { date: string; type: string; status: string; result?: string }
export type InvoiceRow = { invoiceId: string; amount: string; due: string; status: 'Unpaid' | 'Paid' }

export const inspectionsByAppId: Record<string, InspectionRow[]> = {
  'APP-1001': [
    { date: '2025-08-26', type: 'Site Visit', status: 'Scheduled' },
  ],
  'APP-1003': [
    { date: '2025-08-27', type: 'Electrical', status: 'Completed', result: 'Pass' },
    { date: '2025-08-30', type: 'Final', status: 'Scheduled' },
  ],
}

export const invoicesByAppId: Record<string, InvoiceRow[]> = {
  'APP-1001': [
    { invoiceId: 'INV-7771', amount: '$150.00', due: '2025-08-28', status: 'Unpaid' },
  ],
  'APP-1004': [
    { invoiceId: 'INV-7702', amount: '$0.00', due: '—', status: 'Paid' },
  ],
}


