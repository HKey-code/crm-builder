import React from 'react'

type Tab = { id: string; label: string; content: React.ReactNode }

type TabsProps = {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div>
      <div className="border-b">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeId === t.id}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-lpc-secondary ${
                activeId === t.id ? 'border-lpc-primary text-lpc-primary' : 'border-transparent text-gray-500 hover:text-lpc-primary'
              }`}
              onClick={() => onChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4">
        {tabs.find((t) => t.id === activeId)?.content}
      </div>
    </div>
  )
}


