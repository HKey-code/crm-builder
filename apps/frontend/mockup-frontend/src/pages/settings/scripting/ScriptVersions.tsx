import { useParams } from 'react-router-dom'

export function ScriptVersions() {
  const { id } = useParams()
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Versions</h3>
      <p className="text-sm text-[var(--lpc-muted)]">List and compare versions for: {id}. (Coming soon)</p>
    </div>
  )
}


