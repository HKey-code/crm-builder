import * as React from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { TextCursorInput } from 'lucide-react';
import type { InputNodeData } from '../../../../types/flow';

const InputNode = React.memo(function InputNode({ id, data, selected }: NodeProps<InputNodeData>) {
  const update = useUpdateNodeInternals();

  const title = data?.title ?? (data as any)?.label ?? 'Input';
  const placeholder = data?.placeholder ?? 'Enter value...';
  const content = (data as any)?.content ?? '';
  const inputType = data?.inputType ?? 'text';
  const options = Array.isArray(data?.options) ? data!.options : [];

  React.useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      try { update(id); } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, [id, title, placeholder, inputType, content, JSON.stringify(options), update]);

  const preview = () => {
    if (inputType === 'text') {
      return null; // no inner field/placeholder for text type per spec
    }
    if (inputType === 'singleSelect' || inputType === 'multiSelect') {
      return (
        <div className="text-[13px]">
          <span className="opacity-70">{options[0]?.label ?? 'Select...'}</span>
          <span aria-hidden className="opacity-50 ml-1">▾</span>
        </div>
      );
    }
    if (inputType === 'radio') {
      if (!options.length) {
        return <div className="text-[12px] italic text-[var(--lpc-muted)]">Add radio choices in the right rail</div>;
      }
      return (
        <div className="space-y-1">
          {options.slice(0, 3).map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className="inline-block h-3 w-3 rounded-full border" />
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      );
    }
    // checkbox
    if (!options.length) {
      return <div className="text-[12px] italic text-[var(--lpc-muted)]">Add checkbox options in the right rail</div>;
    }
    return (
      <div className="space-y-1">
        {options.slice(0, 3).map((o, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span className="inline-block h-3 w-3 rounded border" />
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      role="group"
      tabIndex={0}
      className={[
        // Match TextNode shape and sizing exactly (including focus treatment)
        'group relative rounded-lg border-2 bg-white px-4 py-3 shadow min-w-[220px] max-w-[360px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--lpc-link)] focus-visible:outline-offset-2',
        selected ? 'border-[var(--lpc-primary-600)]' : 'border-[var(--lpc-primary)]',
      ].join(' ')}
    >
      {/* Title badge top-left (outside) — lowered to match Text node visual offset */}
      {typeof title === 'string' && title !== '' && (
        <div aria-hidden className="absolute -top-5 left-[2px] pr-1 select-none pointer-events-none">
          <span className="text-[11px] font-medium text-[var(--lpc-muted)]">{title}</span>
        </div>
      )}

      {/* Node type icon outside bottom-left */}
      <div aria-hidden className="absolute left-0 bottom-0 -translate-x-full translate-y-1/2 pr-1 select-none pointer-events-none">
        <TextCursorInput className="h-4 w-4 text-[var(--lpc-primary)]" />
      </div>

      {/* Content/question at top */}
      <div className="text-sm font-medium text-[var(--lpc-text)] leading-snug whitespace-pre-wrap break-words">
        {content && String(content).length > 0 ? content : <span style={{ color: 'var(--lpc-muted)' }}>Type a sentence ..</span>}
      </div>

      {/* Subtle port hints (top/bottom) to mirror TextNode visuals */}
      <div aria-hidden className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[var(--lpc-primary)]/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[var(--lpc-primary)]/20" />

      {/* Optional preview hint below content (no boxes) */}
      <div className="space-y-1 mt-1.5">{preview()}</div>

      {/* Handles (match TextNode styling for top/bottom + add lateral pair) */}
      <Handle
        id="in"
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 rounded-full border border-[var(--lpc-primary)] bg-[var(--lpc-primary)]/60 ring-2 ring-white opacity-80"
      />
      <Handle
        id="out"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 rounded-full border border-[var(--lpc-primary)] bg-[var(--lpc-primary)]/70 ring-2 ring-white opacity-80"
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 rounded-full border border-[var(--lpc-primary)]/70 bg-[var(--lpc-primary)]/40 ring-1 ring-white opacity-90"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 rounded-full border border-[var(--lpc-primary)]/70 bg-[var(--lpc-primary)]/40 ring-1 ring-white opacity-90"
      />

      {/* Delete button (anchored bottom-right) */}
      <button
        type="button"
        aria-label="Delete node"
        title="Delete"
        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('script-canvas-delete', { detail: { id } })); }}
        className="absolute -right-2 -bottom-2 h-5 w-5 rounded-full bg-[#ef4444] text-white text-[11px] leading-none flex items-center justify-center shadow border border-white hover:bg-red-600"
      >
        ×
      </button>
    </div>
  );
});

export default InputNode;
