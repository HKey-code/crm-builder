type ProgressTrackerProps = {
  steps: string[]
  current: number
}

export default function ProgressTracker({ steps, current }: ProgressTrackerProps) {
  return (
    <ol className="flex items-center gap-4" aria-label="Progress" data-testid="progress">
      {steps.map((label, idx) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              idx <= current ? 'bg-lpc.primary text-white' : 'bg-lpc.stroke text-lpc.muted'
            }`}
            aria-current={idx === current ? 'step' : undefined}
          >
            {idx + 1}
          </span>
          <span className={`text-sm ${idx <= current ? 'text-lpc.text' : 'text-lpc.muted'}`}>{label}</span>
          {idx < steps.length - 1 && <span className="mx-2 h-px w-8 bg-lpc.stroke" aria-hidden />}
        </li>
      ))}
    </ol>
  )
}


