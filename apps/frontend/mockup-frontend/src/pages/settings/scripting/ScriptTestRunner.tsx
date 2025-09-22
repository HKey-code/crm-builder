import { useParams } from 'react-router-dom'

export function ScriptTestRunner() {
  const { id } = useParams()
  return (
    <div className="bg-white border rounded p-4">
      <h3 className="text-lg font-semibold mb-2">Test Runner</h3>
      <p className="text-sm text-[var(--lpc-muted)]">Run scenarios against: {id}. (Coming soon)</p>
    </div>
  )
}


