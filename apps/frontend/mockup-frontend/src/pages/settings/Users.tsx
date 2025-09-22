export const SettingsUsers = () => (
  <section className="space-y-4">
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-[var(--lpc-primary)]">User Management</h1>
      <button className="rounded-md bg-[var(--lpc-primary)] text-white px-3 py-1.5 hover:bg-[var(--lpc-primary-600)]">Add User</button>
    </header>
    <div className="rounded-lg border bg-white overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700">
          <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Actions</th></tr>
        </thead>
        <tbody>
          <tr className="border-t"><td className="px-4 py-2">Jane Staff</td><td className="px-4 py-2">jane@county.gov</td><td className="px-4 py-2">Reviewer</td><td className="px-4 py-2"><a className="underline" href="#">Manage</a></td></tr>
        </tbody>
      </table>
    </div>
  </section>
)

export default SettingsUsers


