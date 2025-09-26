export default function Footer() {
  return (
    <footer className="border-t-6 border-[var(--lpc-secondary)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-lpc-muted flex items-center justify-between">
        <div>© {new Date().getFullYear()} NebuLogic</div>
        <nav className="flex gap-4">
          <a className="hover:underline" href="#">Accessibility</a>
          <a className="hover:underline" href="#">Privacy</a>
          <a className="hover:underline" href="#">Contact</a>
        </nav>
      </div>
    </footer>
  )
}

