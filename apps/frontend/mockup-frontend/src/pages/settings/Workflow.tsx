export const SettingsWorkflow = () => (
  <section className="space-y-4">
    <h1 className="text-2xl font-semibold text-[var(--lpc-primary)]">Workflow</h1>
    <div className="rounded-lg border bg-white p-4">
      <p className="text-sm">Example flows: Building Permit, Business License, Planning Case.</p>
      <ul className="list-disc pl-6 text-sm mt-2">
        <li>Building Permit: Submitted → Review → Inspection → Decision</li>
        <li>Business License: Submitted → Review → Payment → Issued</li>
      </ul>
    </div>
    <p className="text-xs text-[var(--lpc-muted)]">TODO: designer, transitions, SLA rules.</p>
  </section>
)

export default SettingsWorkflow


