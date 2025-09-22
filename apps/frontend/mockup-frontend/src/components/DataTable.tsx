import React from 'react'

type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode }

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
}

export function DataTable<T extends Record<string, any>>({ columns, rows }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-2 font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-4 py-2">
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable


