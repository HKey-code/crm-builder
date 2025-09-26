import * as React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

import { useScriptStore } from '../../store'

const DEFAULT_STROKE = 'var(--lpc-primary)'

function DeleteButton({ onClick }: { onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        onClick(event)
      }}
      className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#ef4444] text-[10px] font-semibold leading-none text-white shadow-md transition-colors hover:bg-red-600"
      aria-label="Delete edge"
      title="Delete edge"
    >
      ×
    </button>
  )
}

const DeletableEdge = (props: EdgeProps) => {
  const removeEdge = useScriptStore((state) => state.removeEdge)

  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    label,
    selected,
    data,
  } = props

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const remove = React.useCallback(() => {
    const customDelete = typeof (data as any)?.onDelete === 'function' ? (data as any).onDelete : null
    if (customDelete) {
      customDelete(id)
      return
    }
    if (typeof removeEdge === 'function') {
      removeEdge(id)
    }
  }, [id, data, removeEdge])

  const baseStyle = React.useMemo(() => ({
    stroke: DEFAULT_STROKE,
    strokeWidth: selected ? 3 : 2,
    ...(style ?? {}),
  }), [style, selected])

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={baseStyle} interactionWidth={32} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {label && (
            <span className="rounded border border-[var(--lpc-primary)] bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[var(--lpc-primary)] shadow-sm">
              {label}
            </span>
          )}
          <DeleteButton onClick={remove} />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default DeletableEdge
