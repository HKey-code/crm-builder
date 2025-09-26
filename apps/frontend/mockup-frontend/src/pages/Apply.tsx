import React, { useState } from 'react'
import { Modal } from '../components/Modal'
import { SelectField, TextField } from '../components/FormField'

export const ApplyPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('Building Permit')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold text-lpc-primary">Apply</h1>
      <form onSubmit={submit} className="space-y-4">
        <SelectField
          id="type"
          label="Type"
          required
          value={type}
          onChange={(e) => setType(e.currentTarget.value)}
          options={[
            { value: 'Building Permit', label: 'Building Permit' },
            { value: 'Business License', label: 'Business License' },
            { value: 'Planning Case', label: 'Planning Case' },
          ]}
        />
        <TextField id="name" label="Applicant Name" required value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextField id="address" label="Address" required value={address} onChange={(e) => setAddress(e.currentTarget.value)} />
        <label className="block text-sm text-lpc-text">
          <span className="mb-1 inline-block">File Upload</span>
          <input type="file" className="mt-1 w-full rounded border px-3 py-2 focus:border-lpc-secondary focus:outline-none focus:ring-2 focus:ring-lpc-secondary" />
        </label>
        <button type="submit" className="rounded bg-lpc-primary px-4 py-2 font-medium text-white hover:bg-[#0b417a] focus:outline-none focus:ring-2 focus:ring-lpc-secondary">
          Submit
        </button>
      </form>
      <Modal title="Application Submitted" open={open} onClose={() => setOpen(false)} footer={
        <button className="rounded bg-lpc-primary px-4 py-2 text-white" onClick={() => setOpen(false)}>OK</button>
      }>
        <p className="text-lpc-text">Your application has been submitted successfully. This is a mock toast/modal.</p>
      </Modal>
    </div>
  )
}

export default ApplyPage


