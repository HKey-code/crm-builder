import { useParams } from 'react-router-dom'

export function ScriptImportExport() {
  const { id } = useParams()
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Import / Export</h3>
      <p className="text-sm text-[var(--lpc-muted)]">Manage manifest import/export for: {id}. (Coming soon)</p>
    </div>
  )
}


