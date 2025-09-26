import { Link } from 'react-router-dom'

type Crumb = { label: string; to?: string }

export function PageHeader({ breadcrumbs = [], title, description }: { breadcrumbs?: Crumb[]; title?: string; description?: string }) {
  const hasTitle = !!title
  return (
    <header className={`mx-auto w-full max-w-6xl px-4 ${hasTitle ? 'pt-0 pb-3' : 'pt-0 pb-2'}`}>
      {breadcrumbs.length > 0 && (
        <nav className="text-sm text-[color:var(--lpc-text,#263442)]/70 mb-1" aria-label="Breadcrumb">
          <ol className="flex gap-1 flex-wrap">
            {breadcrumbs.map((c, idx) => (
              <li key={idx} className="flex items-center gap-1">
                {c.to ? (
                  <Link className="hover:underline" to={c.to}>{c.label}</Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && <span aria-hidden>/</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      {hasTitle && (
        <h1 className="text-2xl font-semibold text-lpc-primary">{title}</h1>
      )}
      {description && hasTitle && (
        <p className="mt-1 text-[var(--lpc-muted)] text-sm">{description}</p>
      )}
    </header>
  )
}

export default PageHeader


