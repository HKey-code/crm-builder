import * as React from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { MessageSquare } from 'lucide-react';

type Data = { label?: string; note?: string };

function TextNode({ id, data }: NodeProps<Data>) {
  const update = useUpdateNodeInternals();

  React.useLayoutEffect(() => {
    try {
      update(id);
    } catch {
      // no-op: React Flow might not be ready during initial render
    }
  }, [id, data?.label, (data as any)?.content, data?.note, update]);

  // Safe formatter → React nodes (supports **bold**, __underline__, [color=#hex]text[/color])
  const renderFormatted = React.useCallback((raw?: string): React.ReactNode => {
    if (!raw) return null;

    // Render inline formatting for a single string (no newlines)
    const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
      const nodes: React.ReactNode[] = [];
      let remaining = text;
      let partKey = 0;

      // Helper to push plain text
      const pushText = (t: string) => {
        if (t.length > 0) nodes.push(<span key={`${keyPrefix}-t${partKey++}`} style={{ whiteSpace: 'pre-wrap' }}>{t}</span>);
      };

      // First handle color segments greedily (outermost)
      const colorRegex = /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/i;
      let colorMatch: RegExpExecArray | null;
      while ((colorMatch = colorRegex.exec(remaining))) {
        const [full, colorRaw, inner] = colorMatch;
        const before = remaining.slice(0, colorMatch.index);
        pushText(before);
        const safeColor = (() => {
          const c = String(colorRaw).trim();
          return /^#[0-9a-fA-F]{3,8}$/.test(c) || /^[a-zA-Z]+$/.test(c) ? c : 'inherit';
        })();
        nodes.push(
          <span key={`${keyPrefix}-c${partKey++}`} style={{ color: safeColor }}>
            {renderInline(inner, `${keyPrefix}-ci${partKey++}`)}
          </span>
        );
        remaining = remaining.slice(colorMatch.index + full.length);
      }
      // After colors, process remaining text for bold/underline
      // We will iteratively find the earliest formatting marker
      const pattern = /(\*\*|__)([\s\S]+?)\1/; // matches **text** or __text__
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(remaining))) {
        const [full, marker, inner] = match;
        const before = remaining.slice(0, match.index);
        pushText(before);
        if (marker === '**') {
          nodes.push(<strong key={`${keyPrefix}-b${partKey++}`}>{renderInline(inner, `${keyPrefix}-bi${partKey++}`)}</strong>);
        } else {
          nodes.push(<u key={`${keyPrefix}-u${partKey++}`}>{renderInline(inner, `${keyPrefix}-ui${partKey++}`)}</u>);
        }
        remaining = remaining.slice(match.index + full.length);
      }
      pushText(remaining);
      return nodes;
    };

    // Split on newlines and join with <br /> to grow height naturally
    const lines = String(raw).split('\n');
    return lines.map((line, idx) => (
      <React.Fragment key={`ln-${idx}`}>
        {renderInline(line, `l${idx}`)}
        {idx < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    ));
  }, []);

  return (
    <div
      role="group"
      tabIndex={0}
      className="group relative rounded-lg border-2 bg-white px-4 py-3 shadow min-w-[220px] max-w-[360px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--lpc-link)] focus-visible:outline-offset-2"
      style={{ borderColor: 'var(--lpc-primary)' }}
    >
      {/* Node name (data.label) badge outside, top-left */}
      {typeof (data as any)?.label === 'string' && (data as any).label !== '' && (
        <div aria-hidden className="absolute -top-6 left-[2px] pr-1 select-none pointer-events-none">
          <span className="text-[11px] font-medium text-[var(--lpc-muted)]">{(data as any).label}</span>
        </div>
      )}

      {/* Node type icon outside, anchored to bottom-left corner */}
      <div aria-hidden className="absolute left-0 bottom-0 -translate-x-full translate-y-1/2 pr-1 select-none pointer-events-none">
        <MessageSquare className="h-4 w-4 text-[var(--lpc-primary)]" />
      </div>

      {/* Value/content at the top-left inside the card */}
      <div className="text-sm font-medium text-[var(--lpc-text)] leading-snug whitespace-pre-wrap break-words">
        {(data as any)?.content && (data as any).content.length > 0 ? (
          renderFormatted((data as any).content)
        ) : (
          <span style={{ color: 'var(--lpc-muted)' }}>Type a sentence ..</span>
        )}
      </div>
      {data?.note ? (
        <div className="mt-0.5 text-xs text-[var(--lpc-muted)]">{data.note}</div>
      ) : null}

      {/* Handles (kept measurable; fade in on hover for subtlety) */}
      {/* Subtle port hints (top/bottom) */}
      <div aria-hidden className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[var(--lpc-primary)]/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[var(--lpc-primary)]/20" />

      {/* Actual handles kept measurable; left/right are lighter per request */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 rounded-full border border-[var(--lpc-primary)] bg-[var(--lpc-primary)]/60 ring-2 ring-white opacity-80"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 rounded-full border border-[var(--lpc-primary)] bg-[var(--lpc-primary)]/70 ring-2 ring-white opacity-80"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 rounded-full border border-[var(--lpc-primary)]/70 bg-[var(--lpc-primary)]/40 ring-1 ring-white opacity-90"
      />
      <Handle
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
}

export default React.memo(TextNode);


