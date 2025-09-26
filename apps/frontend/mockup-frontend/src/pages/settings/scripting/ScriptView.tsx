import { useParams } from 'react-router-dom'

export function ScriptView() {
  const { id } = useParams()
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Script Overview</h3>
      <p className="text-sm text-[var(--lpc-muted)]">ID: {id} — summary, manifest, metadata. (Coming soon)</p>
    </div>
  )
}


