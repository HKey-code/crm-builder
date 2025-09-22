import * as React from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { GitBranch } from 'lucide-react'

import type { ChoiceConfig, Group, Rule } from '../../types'
import { ensureChoiceConfig } from '../../types'
import type { ChoiceNodeData } from '../../../../types/flow'

const SECTION_GAP = 8

function RuleRow({ rule, index, groupIndex }: { rule: Rule; index: number; groupIndex: number }) {
  const label = rule.name && rule.name.trim().length > 0 ? rule.name : `Rule ${groupIndex + 1}.${index + 1}`
  return (
    <div className="relative flex items-center justify-between gap-2 rounded border border-[var(--lpc-stroke)] bg-white px-3 py-1.5 text-sm">
      <span className="font-medium text-[var(--lpc-text)] truncate" title={label}>{label}</span>
      <Handle
        id={rule.id}
        type="source"
        position={Position.Right}
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        className="!h-3 !w-3 !rounded-full !bg-[var(--lpc-primary)]"
      />
    </div>
  )
}

function GroupBlock({ group, index }: { group: Group; index: number }) {
  const title = group.title && group.title.trim().length > 0 ? group.title : `Group ${index + 1}`
  return (
    <div className="space-y-2 rounded border border-[var(--lpc-stroke)]/70 bg-white/70 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--lpc-muted)]">{title}</div>
      <div className="space-y-2">
        {(group.rules ?? []).map((rule, idx) => (
          <RuleRow key={rule.id} rule={rule} index={idx} groupIndex={index} />
        ))}
        {(group.rules ?? []).length === 0 && (
          <div className="text-[11px] italic text-[var(--lpc-muted)]">No rules</div>
        )}
      </div>
    </div>
  )
}

const ChoiceNode = React.memo(function ChoiceNode({ id, data, selected }: NodeProps<ChoiceNodeData>) {
  const update = useUpdateNodeInternals()
  const cfg: ChoiceConfig = ensureChoiceConfig(data.choice)

  React.useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      try { update(id) } catch {}
    })
    return () => cancelAnimationFrame(raf)
  }, [id, cfg.groups?.length, update])

  const title = data.label ?? 'Choice'

  return (
    <div
      className={[
        'relative rounded-xl border-2 bg-white shadow min-w-[260px] max-w-[360px] px-4 py-4 space-y-3',
        selected ? 'border-[var(--lpc-primary-600)]' : 'border-[var(--lpc-primary)]',
      ].join(' ')}
    >
      {title && (
        <div
          aria-hidden
          className="absolute -top-6 left-[2px] pr-1 select-none pointer-events-none"
        >
          <span className="text-[11px] font-medium text-[var(--lpc-muted)]">{title}</span>
        </div>
      )}
      <div className="absolute left-0 bottom-0 -translate-x-full translate-y-1/2 pr-1 select-none pointer-events-none" aria-hidden>
        <GitBranch className="h-4 w-4 text-[var(--lpc-primary)]" />
      </div>

      <div className="space-y-2">
        {(cfg.groups ?? []).map((group, idx) => (
          <GroupBlock key={group.id} group={group} index={idx} />
        ))}
        {(cfg.groups ?? []).length === 0 && (
          <div className="rounded border border-dashed px-3 py-2 text-xs text-[var(--lpc-muted)]">No groups defined</div>
        )}
      </div>

      <div className="relative flex items-center justify-between gap-2 rounded border border-dashed border-[var(--lpc-stroke)]/80 bg-white/80 px-3 py-1.5 text-xs">
        <span>Default</span>
        <Handle
          id="__default__"
          type="source"
          position={Position.Right}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          className="!h-3 !w-3 !rounded-full !bg-[var(--lpc-primary)]"
        />
      </div>

      <Handle id="in" type="target" position={Position.Top} className="!bg-[var(--lpc-primary)]" />

      <button
        type="button"
        aria-label="Delete node"
        title="Delete"
        onClick={(e) => {
          e.stopPropagation()
          window.dispatchEvent(new CustomEvent('script-canvas-delete', { detail: { id } }))
        }}
        className="absolute -right-2 -bottom-2 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#ef4444] text-[11px] text-white shadow hover:bg-red-600"
      >
        ×
      </button>
    </div>
  )
})

ChoiceNode.displayName = 'ChoiceNode'

export default ChoiceNode
