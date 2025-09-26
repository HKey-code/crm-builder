import * as React from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import RightRail from '../components/RightRail';
import ScriptCanvasLocal from '../components/ScriptCanvasLocal';
import { useScriptStore } from '../store';
import type { ChoiceConfig, ClauseType } from '../types';
import { ensureChoiceConfig } from '../types';
import { MessageSquare, TextCursorInput, GitBranch, Plug, Circle } from 'lucide-react';

/* ----------------------------- Palette (Add) ------------------------------ */
/**
 * NOTE:
 * - This Palette still calls Zustand (addNode) because other parts of your app expect that.
 * - When you are using ScriptCanvasLocal (which manages its own local JSON + undo),
 *   the Palette should eventually be refactored to call a prop (e.g. onAdd(kind)),
 *   so ScriptCanvasLocal can add the node to its own state.
 */
function Palette() {

  const handleAdd = (kind: 'text' | 'input' | 'choice' | 'connector' | 'end') => {
    // When using the local canvas, dispatch a request for it to add the node
    // at the viewport center. This avoids wiring Zustand into the local JSON.
    window.dispatchEvent(new CustomEvent('script-canvas-add', { detail: { kind } }));
  };

  const items = [
    { key: 'text',      label: 'Text',      Icon: MessageSquare },
    { key: 'input',     label: 'Input',     Icon: TextCursorInput },
    { key: 'choice',    label: 'Choice',    Icon: GitBranch },
    { key: 'connector', label: 'Connector', Icon: Plug },
    { key: 'end',       label: 'End',       Icon: Circle },
  ] as const;

  return (
    <div className="flex items-center gap-3" aria-label="Node palette">
      {items.map(({ key, label, Icon }) => (
        <button
          key={key}
          className="group flex h-16 w-16 flex-col items-center justify-center rounded-lg p-1 hover:bg-[var(--lpc-bg)] focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
          aria-label={`Add ${label} Node`}
          onClick={() => handleAdd(key as any)}
        >
          <span className="relative inline-block">
            <Icon aria-hidden className="h-5 w-5 text-[var(--lpc-primary)]" />
            <span
              aria-hidden
              className="absolute -right-[8px] -top-[8px] text-[12px] leading-none font-semibold text-[var(--lpc-primary)]"
            >
              +
            </span>
          </span>
          <span className="mt-0.5 text-xs text-[var(--lpc-muted)]">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Page content ------------------------------ */

function PageInner() {
  const selectNodeId = useScriptStore((s) => s.selectNodeId);
  const updateNode   = useScriptStore((s) => s.updateNode);
  const dbg = React.useCallback((..._args: any[]) => {}, []);

  // Local selection from the canvas (preferred when using ScriptCanvasLocal)
  const [selectedLocal, setSelectedLocal] = React.useState<{
    id: string;
    kind: string;
    name?: string;
    content?: string;
    title?: string;
    varNames?: string[];
    matchMode?: string;
    options?: { label: string; value: string }[];
    hasDefault?: boolean;
    // input
    inputType?: string;
    placeholder?: string;
    varName?: string;
    required?: boolean;
    choice?: ChoiceConfig;
    availableVars?: { name: string; type: ClauseType; nodeId?: string }[];
    graphNodes?: { id: string; label: string; kind: string }[];
  } | null>(null);
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const anyEv = ev as any;
      const detail = anyEv?.detail ?? null;
      dbg('script-canvas-select', {
        id: detail?.id,
        kind: detail?.kind,
        groups: Array.isArray(detail?.choice?.groups) ? detail.choice.groups.length : undefined,
      });
      setSelectedLocal(detail);
    };
    window.addEventListener('script-canvas-select', handler as EventListener);
    return () => window.removeEventListener('script-canvas-select', handler as EventListener);
  }, []);

  // Fallback to Zustand selection if local is absent
  const selectedNodeFromStore = useScriptStore(
    (s) => (selectNodeId ? s.doc.present.nodes.find((n) => n.id === selectNodeId) ?? null : null)
  );

  // Intentionally no store-change log to reduce noise

  const fallbackSelectedNode = React.useMemo(() => {
    if (!selectedNodeFromStore) return null;
    const data = (selectedNodeFromStore.data ?? {}) as any;
    return {
      id: selectedNodeFromStore.id,
      kind: data?.kind ?? ((selectedNodeFromStore as any).type ?? 'text'),
      name: data?.label ?? data?.title ?? '',
      content: data?.content ?? '',
      title: data?.title ?? undefined,
      varNames: Array.isArray(data?.varNames) ? data.varNames : undefined,
      matchMode: data?.matchMode ?? undefined,
      options: Array.isArray(data?.options) ? data.options : undefined,
      hasDefault: typeof data?.hasDefault === 'boolean' ? data.hasDefault : undefined,
      inputType: data?.inputType ?? undefined,
      placeholder: data?.placeholder ?? undefined,
      varName: data?.varName ?? undefined,
      required: typeof data?.required === 'boolean' ? data.required : undefined,
      choice: data?.choice ? ensureChoiceConfig(data.choice) : undefined,
    };
  }, [selectedNodeFromStore]);

  const selectedForRail = React.useMemo(() => {
    return selectedLocal ?? fallbackSelectedNode;
  }, [selectedLocal, fallbackSelectedNode]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Top toolbar */}
      <div className="border-b bg-white">
        <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <input
              className="w-64 rounded border border-[var(--lpc-stroke)] px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
              placeholder="Untitled script"
              aria-label="Script title"
            />
            <select
              className="rounded border border-[var(--lpc-stroke)] px-2 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--lpc-accent)] focus-visible:ring-offset-2"
              aria-label="Script type"
            >
              <option>Conversation</option>
              <option>Validation</option>
            </select>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-[var(--lpc-muted)]">
              Draft
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded border px-3 py-2 text-sm">Import</button>
            <button className="rounded border px-3 py-2 text-sm">Export</button>
            <button className="rounded bg-[var(--lpc-primary)] px-3 py-2 text-sm text-white hover:bg-[var(--lpc-primary-600)]">
              Save
            </button>
            <button className="rounded border px-3 py-2 text-sm">Preview</button>
          </div>
        </div>
      </div>

      {/* Main: canvas + right rail */}
      <div className="flex min-h-0 flex-1">
        {/* Canvas column */}
        <section className="flex min-h-[calc(100vh-180px)] flex-1 flex-col">
          {/* Palette row */}
          <div className="flex items-center justify-between gap-3 border-b bg-background/60 pr-3">
            <Palette />
            <div>
              <button className="rounded border px-3 py-2 text-sm">Preview Script</button>
            </div>
          </div>

          {/* Canvas wrapper — owns the remaining height */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div style={{ height: '100%' }}>
              {/* Local/undo canvas (v12-ready) */}
              <ScriptCanvasLocal />
            </div>
          </div>
        </section>

        {/* Right rail column */}
        <aside className="shrink-0">
          <RightRail
            selectedNode={selectedForRail}
            onPatch={(next) => {
              if (!next) return;
              if (selectedLocal) {
                // Optimistically update local selection so the input stays controlled while typing
                setSelectedLocal((current) => {
                  if (!current || next.id !== current.id) return current;
                  const updated = { ...current } as any;
                  if ('name' in next) updated.name = next.name;
                  if ('content' in next) updated.content = next.content;
                  if ('title' in next) updated.title = next.title;
                  if ('varNames' in next) updated.varNames = next.varNames;
                  if ('matchMode' in next) updated.matchMode = next.matchMode;
                  if ('options' in next) updated.options = next.options;
                  if ('hasDefault' in next) updated.hasDefault = next.hasDefault;
                  if ('inputType' in next) updated.inputType = next.inputType;
                  if ('placeholder' in next) updated.placeholder = next.placeholder;
                  if ('varName' in next) updated.varName = next.varName;
                  if ('required' in next) updated.required = next.required;
                  if ('choice' in next) updated.choice = next.choice;
                  if ('availableVars' in next) updated.availableVars = next.availableVars;
                  if ('graphNodes' in next) updated.graphNodes = next.graphNodes;
                  return updated;
                });

                const detail: any = { id: next.id };
                if ('name' in next) detail.name = next.name;
                if ('content' in next) detail.content = next.content;
                if ('title' in next) detail.title = next.title;
                if ('varNames' in next) detail.varNames = next.varNames;
                if ('matchMode' in next) detail.matchMode = next.matchMode;
                if ('options' in next) detail.options = next.options;
                if ('hasDefault' in next) detail.hasDefault = next.hasDefault;
                if ('inputType' in next) detail.inputType = next.inputType;
                if ('placeholder' in next) detail.placeholder = next.placeholder;
                if ('varName' in next) detail.varName = next.varName;
                if ('required' in next) detail.required = next.required;
                if ('choice' in next) detail.choice = next.choice;
                window.dispatchEvent(new CustomEvent('script-canvas-rename', { detail }));

                // Keep Zustand store in sync so fallback selection matches local edits
                const dataPatch: any = {};
                if ('name' in next) {
                  dataPatch.label = next.name;
                  dataPatch.title = next.title ?? next.name;
                }
                if ('content' in next) dataPatch.content = next.content;
                if ('title' in next) dataPatch.title = next.title;
                if ('varNames' in next) dataPatch.varNames = next.varNames;
                if ('matchMode' in next) dataPatch.matchMode = next.matchMode;
                if ('options' in next) dataPatch.options = next.options;
                if ('hasDefault' in next) dataPatch.hasDefault = next.hasDefault;
                if ('inputType' in next) dataPatch.inputType = next.inputType;
                if ('placeholder' in next) dataPatch.placeholder = next.placeholder;
                if ('varName' in next) dataPatch.varName = next.varName;
                if ('required' in next) dataPatch.required = next.required;
                if ('choice' in next) dataPatch.choice = next.choice;
                if (Object.keys(dataPatch).length > 0) {
                  updateNode(next.id, { data: dataPatch } as any);
                }
              } else {
                const dataPatch: any = {
                  ...(typeof next.name === 'string' ? { label: next.name, title: next.title ?? next.name } : {}),
                  ...(typeof next.content === 'string' ? { content: next.content } : {}),
                };
                if ('title' in next) dataPatch.title = next.title;
                if ('varNames' in next) dataPatch.varNames = next.varNames;
                if ('matchMode' in next) dataPatch.matchMode = next.matchMode;
                if ('options' in next) dataPatch.options = next.options;
                if ('hasDefault' in next) dataPatch.hasDefault = next.hasDefault;
                if ('inputType' in next) dataPatch.inputType = next.inputType;
                if ('placeholder' in next) dataPatch.placeholder = next.placeholder;
                if ('varName' in next) dataPatch.varName = next.varName;
                if ('required' in next) dataPatch.required = next.required;
                if ('choice' in next) dataPatch.choice = next.choice;
                updateNode(next.id, { data: dataPatch } as any);
              }
            }}
          />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------- Page shell ------------------------------- */

export default function NewScriptPage() {
  return (
    <ReactFlowProvider>
      <PageInner />
    </ReactFlowProvider>
  );
}
