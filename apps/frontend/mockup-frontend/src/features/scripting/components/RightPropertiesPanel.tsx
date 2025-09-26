import * as React from 'react'
import type { ScriptNode, InputNode } from '../types.ts'

interface RightPropertiesPanelProps {
  selectedNode?: ScriptNode | null
  onChange?(next: ScriptNode): void
  onClose?(): void
}

export default function RightPropertiesPanel({ selectedNode, onChange, onClose }: RightPropertiesPanelProps) {
  const handlePatch = <K extends keyof ScriptNode>(key: K, value: ScriptNode[K]) => {
    if (!selectedNode || !onChange) return
    onChange({ ...selectedNode, [key]: value })
  }

  const patchInput = <K extends keyof InputNode>(key: K, value: InputNode[K]) => {
    if (!selectedNode || selectedNode.kind !== 'input' || !onChange) return
    onChange({ ...(selectedNode as InputNode), [key]: value })
  }

  return (
    <aside className="w-[360px] shrink-0 border-l bg-white/90 backdrop-blur flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur border-b z-10">
        <div className="text-sm font-medium text-[var(--lpc-text)]">
          {selectedNode ? `Node: ${selectedNode.name ?? selectedNode.kind}` : 'No node selected'}
        </div>
        {onClose && (
          <button
            className="rounded px-2 py-1 text-sm hover:bg-[var(--lpc-bg)] focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {!selectedNode && (
            <div className="rounded border bg-white">
              <div className="px-4 py-2 border-b font-medium">Properties</div>
              <div className="px-4 py-3 text-sm text-[var(--lpc-muted)]">Select a node on the canvas to configure it.</div>
            </div>
          )}

          {selectedNode && (
            <>
              <div className="rounded border bg-white">
                <div className="px-4 py-2 border-b font-medium">General</div>
                <div className="p-4 space-y-3">
                  <div className="grid gap-1.5">
                    <label htmlFor="node-name" className="text-sm text-[var(--lpc-text)]">Name</label>
                    <input
                      id="node-name"
                      className="rounded border px-3 py-2 text-sm"
                      value={selectedNode.name ?? ''}
                      onChange={(e) => handlePatch('name', e.target.value)}
                      placeholder="Friendly node name"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-[var(--lpc-stroke)]" />

              {selectedNode.kind === 'input' && (
                <div className="rounded border bg-white">
                  <div className="px-4 py-2 border-b font-medium">Input</div>
                  <div className="p-4 space-y-4">
                    <div className="grid gap-1.5">
                      <label className="text-sm text-[var(--lpc-text)]">Input type</label>
                      <select
                        className="rounded border px-2 py-2 text-sm"
                        value={(selectedNode as InputNode).inputType ?? 'text'}
                        onChange={(e) => patchInput('inputType', e.target.value as any)}
                      >
                        <option value="text">Text</option>
                        <option value="radio">Radio</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="multiSelect">Multi-select</option>
                        <option value="singleSelect">Single-select</option>
                      </select>
                    </div>

                    <div className="grid gap-1.5">
                      <label htmlFor="placeholder" className="text-sm text-[var(--lpc-text)]">Placeholder</label>
                      <input
                        id="placeholder"
                        className="rounded border px-3 py-2 text-sm"
                        value={(selectedNode as InputNode).placeholder ?? ''}
                        onChange={(e) => patchInput('placeholder', e.target.value)}
                        placeholder="Enter value…"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label htmlFor="required" className="text-sm text-[var(--lpc-text)]">Required</label>
                      <input
                        id="required"
                        type="checkbox"
                        className="h-4 w-4"
                        checked={(selectedNode as InputNode).required ?? false}
                        onChange={(e) => patchInput('required', e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.kind !== 'input' && (
                <div className="rounded border bg-white">
                  <div className="px-4 py-2 border-b font-medium">Configuration</div>
                  <div className="px-4 py-3 text-sm text-[var(--lpc-muted)]">
                    Configuration for <span className="font-medium">{selectedNode.kind}</span> nodes is coming soon.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}


