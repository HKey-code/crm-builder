import React, { useState } from 'react'

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded border bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left text-lpc-text focus:outline-none focus:ring-2 focus:ring-lpc-secondary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium">{q}</span>
        <span aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-700">{a}</div>}
    </div>
  )
}

export const HelpPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold text-lpc-primary">Help</h1>
      <FAQItem q="How do I apply?" a="Go to Apply, fill the form, and submit." />
      <FAQItem q="How to schedule inspections?" a="Open your application and use the Inspections tab." />
      <FAQItem q="Accessibility statement" a="We strive to meet WCAG 2.1 AA. Contact support for accommodations." />
      <a href="#" className="inline-block text-lpc-secondary underline">Read our accessibility statement</a>
    </div>
  )
}

export default HelpPage


