import { Link } from 'react-router-dom'

export function List() {
  const rows = [
    { id: 'kitchen-remodel-triager', name: 'Kitchen Remodel Triager', type: 'Conversation', updated: '2025-08-20' },
    { id: 'plumb-check', name: 'PLUMB-Check', type: 'Validation', updated: '2025-08-18' },
  ]

  return (
    <div id="scripts-list-panel" role="tabpanel" aria-labelledby="scripts-list-tab">
      <div className="flex items-center justify-start gap-2 mb-3">
        <label htmlFor="scriptSearch" className="sr-only">Search scripts</label>
        <input
          id="scriptSearch"
          type="search"
          placeholder="Search scripts"
          className="w-full sm:w-72 rounded border border-[var(--lpc-stroke)] bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">List of scripts</caption>
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Name</th>
              <th scope="col" className="px-4 py-2 font-medium">Type</th>
              <th scope="col" className="px-4 py-2 font-medium">Updated</th>
              <th scope="col" className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.updated}</td>
                <td className="px-4 py-2">
                  <Link
                    className="text-lpc-secondary underline mr-3 focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2 rounded-sm"
                    aria-label={`View script: ${r.name}`}
                    to={`/settings/scripting/${r.id}`}
                  >
                    View
                  </Link>
                  <Link
                    className="text-lpc-secondary underline focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2 rounded-sm"
                    aria-label={`Edit script: ${r.name}`}
                    to={`/settings/scripting/${r.id}/edit`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default List


