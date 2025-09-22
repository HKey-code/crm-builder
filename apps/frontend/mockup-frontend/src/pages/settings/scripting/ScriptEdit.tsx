import { useParams } from 'react-router-dom'

export function ScriptEdit() {
  const { id } = useParams()
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Editor</h3>
      <p className="text-sm text-[var(--lpc-muted)]">Embed flow editor for script: {id}. (Coming soon)</p>
    </div>
  )
}


