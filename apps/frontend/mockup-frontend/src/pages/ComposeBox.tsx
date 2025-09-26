import { useState } from 'react'

export default function ComposeBox({ onSend }: { onSend: (text: string, fileName?: string) => void }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | undefined>(undefined)

  return (
    <div className="flex gap-2">
      <textarea
        className="flex-1 rounded border px-3 py-2 focus:ring-2 focus:ring-lpc.link min-h-[42px]"
        placeholder="Type a message"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
      />
      <label className="rounded border px-3 py-2 cursor-pointer bg-white">
        Attach
        <input type="file" className="hidden" onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name)} />
      </label>
      <button
        className="rounded bg-lpc.primary px-3 py-2 text-white disabled:opacity-50"
        disabled={!text.trim()}
        onClick={() => { onSend(text.trim(), fileName); setText(''); setFileName(undefined) }}
        aria-live="polite"
      >
        Send
      </button>
    </div>
  )
}


