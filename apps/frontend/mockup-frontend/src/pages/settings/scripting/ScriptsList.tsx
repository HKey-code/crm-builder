import { Link, useNavigate } from 'react-router-dom'

export function ScriptsList() {
  const navigate = useNavigate()
  const rows = [
    { id: 'kitchen-remodel-triager', name: 'Kitchen Remodel Triager', type: 'Conversation', updated: '2025-08-20' },
    { id: 'plumb-check', name: 'PLUMB-Check', type: 'Validation', updated: '2025-08-18' },
  ]

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.updated}</td>
                <td className="px-4 py-2">
                  <Link className="text-lpc-secondary underline mr-3" to={`/settings/scripting/${r.id}`}>View</Link>
                  <Link className="text-lpc-secondary underline" to={`/settings/scripting/${r.id}/edit`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--lpc-muted)] mt-2">TODO: add editor, versioning, test runner.</p>
    </div>
  )
}


