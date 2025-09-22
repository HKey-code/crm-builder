import * as React from 'react'

import ChoiceEditor from './inspector/ChoiceEditor'
import type { ChoiceConfig, ClauseType } from '../types'
import { ensureChoiceConfig, createChoiceConfig } from '../types'

type ChoiceOption = { label: string; value: string }
type VariableSummary = { name: string; type: ClauseType; nodeId?: string }
type NodeSummary = { id: string; label: string; kind: string }
type MinimalNode = { id: string; kind: string; name?: string; content?: string; title?: string; varNames?: string[]; matchMode?: string; options?: ChoiceOption[]; hasDefault?: boolean; inputType?: string; placeholder?: string; varName?: string; required?: boolean; choice?: ChoiceConfig; availableVars?: VariableSummary[]; graphNodes?: NodeSummary[] }
import { ChevronRight, PanelRightClose } from 'lucide-react'

type TabKey = 'properties' | 'validation' | 'ai' | 'preview'

interface RightRailProps { selectedNode?: MinimalNode | null; onPatch?(next: MinimalNode): void; onCloseMobile?(): void }

const INPUT_TYPES_WITH_OPTIONS = new Set(['singleSelect', 'multiSelect', 'radio', 'checkbox'])

const LS = {
  width: 'scripting.rightRail.width',
  collapsed: 'scripting.rightRail.collapsed',
  tab: 'scripting.rightRail.tab',
}

export default function RightRail({ selectedNode, onPatch, onCloseMobile }: RightRailProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => localStorage.getItem(LS.collapsed) === '1')
  const [tab, setTab] = React.useState<TabKey>(() => (localStorage.getItem(LS.tab) as TabKey) || 'properties')
  const [width, setWidth] = React.useState<number>(() => {
    const saved = Number(localStorage.getItem(LS.width))
    return Number.isFinite(saved) && saved >= 300 && saved <= 520 ? saved : 360
  })

  React.useEffect(() => localStorage.setItem(LS.collapsed, collapsed ? '1' : '0'), [collapsed])
  React.useEffect(() => localStorage.setItem(LS.tab, tab), [tab])
  React.useEffect(() => localStorage.setItem(LS.width, String(width)), [width])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

  // Inline title editing state (click header to rename, like Google Docs)
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState<string>('')
  // Initialize draft when selection changes. Do not re-sync on name changes
  // to avoid overwriting a freshly committed rename before props update.
  React.useEffect(() => {
    if (!selectedNode) {
      setTitleDraft('')
      setIsEditingTitle(false)
      return
    }
    setTitleDraft(selectedNode.name ?? '')
  }, [selectedNode?.id])

  const sendPatch = React.useCallback((updates: Partial<MinimalNode>) => {
    if (!selectedNode) return
    onPatch?.({ id: selectedNode.id, kind: selectedNode.kind, ...updates })
  }, [selectedNode, onPatch])

  const commitTitle = React.useCallback(() => {
    if (!selectedNode) return
    setIsEditingTitle(false)
    if ((selectedNode.name ?? '') !== (titleDraft ?? '')) {
      const nextChoice = selectedNode.choice ? { ...selectedNode.choice, title: titleDraft ?? '' } : undefined
      sendPatch({
        name: titleDraft ?? '',
        title: titleDraft ?? '',
        ...(nextChoice ? { choice: nextChoice } : {}),
      })
    }
  }, [selectedNode, titleDraft, sendPatch])

  // Draft inputs for adding new options (input node)
  const [inputDraftLabel, setInputDraftLabel] = React.useState('')
  const [inputDraftValue, setInputDraftValue] = React.useState('')
  const inputOptionsListRef = React.useRef<HTMLDivElement | null>(null)

  // Local draft for non-input content editor
  const [contentDraft, setContentDraft] = React.useState('')
  React.useEffect(() => {
    if (!selectedNode || selectedNode.kind === 'input') return
    setContentDraft(selectedNode.content ?? '')
  }, [selectedNode?.id, selectedNode?.kind])

  // Local controlled drafts for Input node core fields to avoid flicker/reset
  const [inputContentDraft, setInputContentDraft] = React.useState('')
  const [inputVarNameDraft, setInputVarNameDraft] = React.useState('')
  const [inputTypeDraft, setInputTypeDraft] = React.useState<string>('text')
  const [inputPlaceholderDraft, setInputPlaceholderDraft] = React.useState('')
  const [inputOptionsDraft, setInputOptionsDraft] = React.useState<Array<{ label: string; value: string }>>([])

  const pushOptionsUpdate = React.useCallback((nextOptions: Array<{ label: string; value: string }>) => {
    setInputOptionsDraft(nextOptions)
    sendPatch({
      options: nextOptions,
      inputType: inputTypeDraft as any,
      content: inputContentDraft,
      varName: inputVarNameDraft,
      placeholder: inputPlaceholderDraft,
    })
  }, [sendPatch, inputTypeDraft, inputContentDraft, inputVarNameDraft, inputPlaceholderDraft])

  React.useEffect(() => {
    if (selectedNode?.kind !== 'input') {
      setInputContentDraft('')
      setInputVarNameDraft('')
      setInputTypeDraft('text')
      setInputPlaceholderDraft('')
      setInputOptionsDraft([])
      return
    }
    setInputContentDraft(selectedNode.content ?? '')
    setInputVarNameDraft(selectedNode.varName ?? '')
    setInputTypeDraft(selectedNode.inputType ?? 'text')
    setInputPlaceholderDraft(selectedNode.placeholder ?? '')
    const opts = Array.isArray(selectedNode.options) ? selectedNode.options : []
    setInputOptionsDraft(opts)
  }, [selectedNode?.id, selectedNode?.kind, selectedNode?.options])

  const [choiceDraft, setChoiceDraft] = React.useState<ChoiceConfig | null>(null)

  React.useEffect(() => {
    if (selectedNode?.kind === 'choice') {
      const ensured = ensureChoiceConfig(selectedNode.choice ?? createChoiceConfig())
      setChoiceDraft((prev) => {
        if (prev && JSON.stringify(prev) === JSON.stringify(ensured)) return prev
        return ensured
      })
    } else {
      setChoiceDraft(null)
    }
  }, [selectedNode?.id, selectedNode?.kind, selectedNode?.choice])

  // Resizer logic
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const onMove = (ev: MouseEvent) => {
      const dx = startX - ev.clientX
      let next = startW + dx
      if (next < 300) next = 300
      if (next > 520) next = 520
      setWidth(next)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const Header = (
    <div className="h-12 px-3 flex items-center justify-between border-b bg-white/95 backdrop-blur sticky top-0 z-10">
      <div className="min-w-0 flex-1 pr-2">
        {!selectedNode ? (
          <div className="text-sm font-medium truncate">No node selected</div>
        ) : isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setIsEditingTitle(false); setTitleDraft(selectedNode.name ?? '') }
            }}
            className="w-full rounded border px-2 py-1 text-sm"
            aria-label="Node name"
            placeholder={selectedNode.kind}
          />
        ) : (
          <button
            className="max-w-full truncate text-left text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--lpc-accent)] focus-visible:outline-offset-2"
            onClick={() => setIsEditingTitle(true)}
            title="Rename"
          >
            {titleDraft && titleDraft.length > 0 ? titleDraft : (selectedNode.name && selectedNode.name.length > 0 ? selectedNode.name : 'Rename')}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isMobile && onCloseMobile && (
          <button
            className="rounded p-1 hover:bg-[var(--lpc-bg)] focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
            aria-label="Close"
            onClick={onCloseMobile}
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
        {!isMobile && (
          <button
            className="rounded p-1 hover:bg-[var(--lpc-bg)] focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
            aria-label="Collapse"
            onClick={() => setCollapsed(true)}
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )

  const TabsBar = (
    <div className="px-3 pt-2">
      <div className="grid grid-cols-4 gap-1 text-sm">
        {[
          { k: 'properties', l: 'Properties' },
          { k: 'validation', l: 'Validation' },
          { k: 'ai', l: 'AI' },
          { k: 'preview', l: 'Preview' },
        ].map(({ k, l }) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === (k as TabKey)}
            className={`rounded px-2 py-1 border-b-2 ${tab === k ? 'border-[var(--lpc-primary)] text-[var(--lpc-primary)]' : 'border-transparent text-[var(--lpc-muted)] hover:text-[var(--lpc-primary)]'}`}
            onClick={() => setTab(k as TabKey)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )

  const Body = (
    <div className="flex-1 min-h-0 flex flex-col">
      {TabsBar}
      <div className="h-px bg-[var(--lpc-stroke)] mt-2" />
      <div className="flex-1 overflow-auto px-3 py-3 text-sm">
        {tab === 'properties' && (
          <div className="space-y-3">
            {!selectedNode ? (
              <div className="rounded border bg-white p-3 text-[var(--lpc-muted)]">Select a node on the canvas to configure it.</div>
            ) : (
              <div className="space-y-3">
                {/* Content editor at the top (question text) — for non-input nodes */}
                {selectedNode.kind !== 'input' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="rr-content" className="text-[var(--lpc-text)]">{selectedNode.kind === 'choice' ? 'Description' : 'Content'}</label>
                    {selectedNode.kind !== 'choice' && (
                      <div className="ml-auto flex items-center gap-1 text-xs">
                        <button
                          className="rounded border px-2 py-1"
                          title="Bold"
                          onClick={() => {
                            const el = document.getElementById('rr-content') as HTMLTextAreaElement | null;
                            if (!el) return;
                            const { selectionStart: s, selectionEnd: e, value } = el;
                            const before = value.slice(0, s);
                            const sel = value.slice(s, e);
                            const after = value.slice(e);
                            const next = `${before}**${sel || 'text'}**${after}`;
                            setContentDraft(next);
                            sendPatch({ content: next });
                            setTimeout(() => { el.focus(); el.selectionStart = s + 2; el.selectionEnd = e + 2 + (sel ? sel.length : 4); }, 0);
                          }}
                        >B</button>
                        <button
                          className="rounded border px-2 py-1"
                          title="Underline"
                          onClick={() => {
                            const el = document.getElementById('rr-content') as HTMLTextAreaElement | null;
                            if (!el) return;
                            const { selectionStart: s, selectionEnd: e, value } = el;
                            const before = value.slice(0, s);
                            const sel = value.slice(s, e);
                            const after = value.slice(e);
                            const next = `${before}__${sel || 'text'}__${after}`;
                            setContentDraft(next);
                            sendPatch({ content: next });
                            setTimeout(() => { el.focus(); el.selectionStart = s + 2; el.selectionEnd = e + 2 + (sel ? sel.length : 4); }, 0);
                          }}
                        >U</button>
                        <input
                          type="color"
                          title="Color"
                          onChange={(ev) => {
                            const color = (ev.target as HTMLInputElement).value;
                            const el = document.getElementById('rr-content') as HTMLTextAreaElement | null;
                            if (!el) return;
                            const { selectionStart: s, selectionEnd: e, value } = el;
                            const before = value.slice(0, s);
                            const sel = value.slice(s, e);
                            const after = value.slice(e);
                            const next = `${before}[color=${color}]${sel || 'text'}[/color]${after}`;
                            setContentDraft(next);
                            sendPatch({ content: next });
                            setTimeout(() => { el.focus(); el.selectionStart = s + 8 + color.length; el.selectionEnd = el.selectionStart + (sel ? sel.length : 4); }, 0);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {selectedNode.kind === 'choice' ? (
                    <>
                      <textarea
                        id="rr-content"
                        rows={4}
                        className="rounded border px-3 py-2 text-sm w-full"
                        placeholder="Why does this choice exist? Notes for collaborators…"
                        value={choiceDraft?.description ?? ''}
                        onChange={(e) => {
                          if (!choiceDraft) return
                          const next = { ...choiceDraft, description: e.target.value }
                          setChoiceDraft(next)
                          sendPatch({ choice: next })
                        }}
                      />
                      <p className="text-xs text-[var(--lpc-muted)]">Internal only. Not shown to end users.</p>
                    </>
                  ) : (
                    <textarea
                      id="rr-content"
                      rows={4}
                      className="rounded border px-3 py-2 text-sm w-full font-mono"
                      placeholder="Type a sentence .."
                      value={contentDraft}
                      onChange={(e) => { const v = e.target.value; setContentDraft(v); sendPatch({ content: v }) }}
                    />
                  )}
                </div>
                )}

                {selectedNode.kind === 'choice' && (
                  <div className="rounded border bg-white">
                    <div className="px-3 py-2 border-b font-medium">Choice router</div>
                    <div className="p-3 space-y-3">
                      {choiceDraft ? (
                        <ChoiceEditor
                          config={choiceDraft}
                          availableVars={selectedNode.availableVars ?? []}
                          nodes={selectedNode.graphNodes ?? []}
                          currentNodeId={selectedNode.id}
                          onChange={(next) => {
                            setChoiceDraft(next)
                            sendPatch({ choice: next })
                          }}
                        />
                      ) : (
                        <div className="rounded border border-dashed px-3 py-2 text-sm text-[var(--lpc-muted)]">
                          Choice configuration not available yet. Try reconnecting or reselecting the node.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  {selectedNode.kind === 'input' && (
                    <div className="rounded border bg-white">
                      <div className="px-3 py-2 border-b font-medium">Input</div>
                      <div className="p-3 space-y-3">
                        {/* Content editor inside Input panel (first) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label htmlFor="rr-input-content" className="text-[var(--lpc-text)]">Content</label>
                            <div className="ml-auto flex items-center gap-1 text-xs">
                              <button
                                className="rounded border px-2 py-1"
                                title="Bold"
                                onClick={() => {
                                  const el = document.getElementById('rr-input-content') as HTMLTextAreaElement | null;
                                  if (!el) return;
                                  const { selectionStart: s, selectionEnd: e, value } = el;
                                  const before = value.slice(0, s);
                                  const sel = value.slice(s, e);
                                  const after = value.slice(e);
                                  const next = `${before}**${sel || 'text'}**${after}`;
                                  onPatch?.({ ...selectedNode, content: next });
                                  setTimeout(() => { el.focus(); el.selectionStart = s + 2; el.selectionEnd = e + 2 + (sel ? sel.length : 4); }, 0);
                                }}
                              >B</button>
                              <button
                                className="rounded border px-2 py-1"
                                title="Underline"
                                onClick={() => {
                                  const el = document.getElementById('rr-input-content') as HTMLTextAreaElement | null;
                                  if (!el) return;
                                  const { selectionStart: s, selectionEnd: e, value } = el;
                                  const before = value.slice(0, s);
                                  const sel = value.slice(s, e);
                                  const after = value.slice(e);
                                  const next = `${before}__${sel || 'text'}__${after}`;
                                  onPatch?.({ ...selectedNode, content: next });
                                  setTimeout(() => { el.focus(); el.selectionStart = s + 2; el.selectionEnd = e + 2 + (sel ? sel.length : 4); }, 0);
                                }}
                              >U</button>
                              <input
                                type="color"
                                title="Color"
                                className="h-6 w-6 appearance-none rounded-full border border-[var(--lpc-stroke)] p-0"
                                onChange={(ev) => {
                                  const color = (ev.target as HTMLInputElement).value;
                                  const el = document.getElementById('rr-input-content') as HTMLTextAreaElement | null;
                                  if (!el) return;
                                  const { selectionStart: s, selectionEnd: e, value } = el;
                                  const before = value.slice(0, s);
                                  const sel = value.slice(s, e);
                                  const after = value.slice(e);
                                  const next = `${before}[color=${color}]${sel || 'text'}[/color]${after}`;
                                  onPatch?.({ ...selectedNode, content: next });
                                  setTimeout(() => { el.focus(); el.selectionStart = s + 8 + color.length; el.selectionEnd = el.selectionStart + (sel ? sel.length : 4); }, 0);
                                }}
                              />
                            </div>
                          </div>
                          <textarea
                            id="rr-input-content"
                            rows={4}
                            className="rounded border px-3 py-2 text-sm w-full font-mono"
                            placeholder="Type a sentence .."
                            value={inputContentDraft}
                            onChange={(e) => { const v = e.target.value; setInputContentDraft(v); sendPatch({ content: v }) }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-[var(--lpc-text)]">Variable name</label>
                          <input
                            className="rounded border px-3 py-2 text-sm font-mono"
                            value={inputVarNameDraft}
                            onChange={(e) => { const v = e.target.value; setInputVarNameDraft(v); sendPatch({ varName: v }) }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-[var(--lpc-text)]">Input type</label>
                          <select
                            className="rounded border px-2 py-2 text-sm"
                            value={inputTypeDraft}
                            onChange={(e) => { const v = e.target.value; setInputTypeDraft(v); sendPatch({ inputType: v as any }) }}
                          >
                            <option value="text">Text</option>
                            <option value="singleSelect">Single select</option>
                            <option value="multiSelect">Multi select</option>
                            <option value="radio">Radio</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                        {inputTypeDraft === 'text' && (
                          <div className="grid gap-1.5">
                            <label className="text-[var(--lpc-text)]">Input hint (shown inside field)</label>
                            <input
                              className="rounded border px-3 py-2 text-sm"
                              placeholder="e.g. Enter value..."
                              value={inputPlaceholderDraft}
                              onChange={(e) => { const v = e.target.value; setInputPlaceholderDraft(v); sendPatch({ placeholder: v }) }}
                            />
                          </div>
                        )}
                        {INPUT_TYPES_WITH_OPTIONS.has(inputTypeDraft as any) && (
                          <div className="grid gap-1.5">
                            <label className="text-[var(--lpc-text)]">Options</label>
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-[var(--lpc-muted)]">
                                <span className="col-span-5">Label</span>
                                <span className="col-span-5">Value</span>
                                <span className="col-span-2 text-center" aria-hidden>+</span>
                              </div>
                              {/* Inline add row */}
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <input
                                  className="col-span-5 rounded border px-2 py-1 text-sm"
                                  placeholder="Label"
                                  value={inputDraftLabel}
                                  onChange={(e) => setInputDraftLabel(e.target.value)}
                                />
                                <input
                                  className="col-span-5 rounded border px-2 py-1 text-sm font-mono"
                                  placeholder="value"
                                  value={inputDraftValue}
                                  onChange={(e) => setInputDraftValue(e.target.value)}
                                />
                                <button
                                  className="col-span-2 rounded border px-2 py-1 text-sm"
                                  type="button"
                                  onClick={() => {
                                    const l = inputDraftLabel.trim();
                                    const v = inputDraftValue.trim();
                                    if (!l || !v) return;
                                    const next = [...inputOptionsDraft, { label: l, value: v }];
                                    pushOptionsUpdate(next);
                                    setInputDraftLabel('');
                                    setInputDraftValue('');
                                    setTimeout(() => {
                                      const el = inputOptionsListRef.current;
                                      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                                    }, 0);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                              <div ref={inputOptionsListRef} className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                {inputOptionsDraft.map((opt, idx) => (
                                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                      className="col-span-5 rounded border px-2 py-1 text-sm"
                                      placeholder="Label"
                                      value={opt.label}
                                      onChange={(e) => {
                                        const next = [...inputOptionsDraft];
                                        next[idx] = { ...opt, label: e.target.value };
                                        pushOptionsUpdate(next);
                                      }}
                                    />
                                    <input
                                      className="col-span-5 rounded border px-2 py-1 text-sm font-mono"
                                      placeholder="value"
                                      value={opt.value}
                                      onChange={(e) => {
                                        const next = [...inputOptionsDraft];
                                        next[idx] = { ...opt, value: e.target.value };
                                        pushOptionsUpdate(next);
                                      }}
                                    />
                                    <button
                                      className="col-span-2 flex items-center justify-center rounded border px-2 py-1 text-sm"
                                      type="button"
                                      aria-label="Remove option"
                                      onClick={() => {
                                        const next = [...inputOptionsDraft];
                                        next.splice(idx, 1);
                                        pushOptionsUpdate(next);
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                {/* Additional configuration panels can be added here per node kind */}
              </div>
            )}
          </div>
        )}
        {tab === 'validation' && (
          <div className="rounded border bg-white p-3 text-[var(--lpc-muted)]">Validation editor (coming soon)</div>
        )}
        {tab === 'ai' && (
          <div className="rounded border bg-white p-3 text-[var(--lpc-muted)]">AI-assisted tools (coming soon)</div>
        )}
        {tab === 'preview' && (
          <div className="rounded border bg-white p-3 text-[var(--lpc-muted)]">Preview (coming soon)</div>
        )}
      </div>
    </div>
  )

  if (collapsed && !isMobile) {
    return (
      <aside className="w-8 border-l bg-white flex flex-col items-center justify-start py-2">
        <button
          className="rounded p-1 hover:bg-[var(--lpc-bg)] focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
          onClick={() => setCollapsed(false)}
          aria-label="Expand right rail"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </aside>
    )
  }

  if (!isMobile) {
    return (
      <aside style={{ width }} className="shrink-0 border-l bg-white flex flex-col relative">
        <div
          className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-[var(--lpc-stroke)]"
          onMouseDown={startDrag}
          aria-hidden
        />
        {Header}
        {Body}
      </aside>
    )
  }

  // Mobile overlay version (simple)
  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-xl z-40">
      {Header}
      {Body}
    </aside>
  )
}
