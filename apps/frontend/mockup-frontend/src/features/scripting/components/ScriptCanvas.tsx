// ScriptCanvas: controlled React Flow with a small debug HUD.
// Fix: skip writing identical graphs back to the store to avoid endless loops.

import * as React from 'react'
import { useLayoutEffect } from 'react'

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Panel,
  useReactFlow,
  useViewport,
  useUpdateNodeInternals,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
  type ReactFlowInstance,
  type NodeChange,
  type EdgeChange,
  type Viewport,
} from '@xyflow/react'

import { useScriptStore } from '../store'
import type { ScriptNode, ScriptEdge } from '../types'

/* --------------------------------- utils ---------------------------------- */

const r1 = (n: number) => Math.round(n)
const r01 = (n: number) => Math.round(n * 10) / 10 // 0.1px tolerance to ignore sub-pixel jitter

function clampPosition(pos: { x: number; y: number }) {
  const x = Number.isFinite(pos.x) ? pos.x : 0
  const y = Number.isFinite(pos.y) ? pos.y : 0
  return { x: Math.abs(x) > 1e5 ? 0 : x, y: Math.abs(y) > 1e5 ? 0 : y }
}

/** Lightweight deep-ish compare that ignores order and sub-pixel noise */
function graphsEqual(
  a: { nodes: ScriptNode[]; edges: ScriptEdge[] },
  b: { nodes: ScriptNode[]; edges: ScriptEdge[] }
): boolean {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return false

  const an = [...a.nodes].sort((x, y) => x.id.localeCompare(y.id))
  const bn = [...b.nodes].sort((x, y) => x.id.localeCompare(y.id))
  for (let i = 0; i < an.length; i++) {
    const n1 = an[i], n2 = bn[i]
    if (n1.id !== n2.id) return false
    if (r01(n1.position.x) !== r01(n2.position.x)) return false
    if (r01(n1.position.y) !== r01(n2.position.y)) return false
    const t1 = (n1 as any).data?.kind === 'start' ? 'start' : 'default'
    const t2 = (n2 as any).data?.kind === 'start' ? 'start' : 'default'
    if (t1 !== t2) return false
    const l1 = (n1 as any).data?.label ?? undefined
    const l2 = (n2 as any).data?.label ?? undefined
    if (l1 !== l2) return false
  }

  const ae = [...a.edges].sort((x, y) => x.id.localeCompare(y.id))
  const be = [...b.edges].sort((x, y) => x.id.localeCompare(y.id))
  for (let i = 0; i < ae.length; i++) {
    const e1 = ae[i], e2 = be[i]
    if (e1.id !== e2.id) return false
    if (e1.source !== e2.source) return false
    if (e1.target !== e2.target) return false
    if ((e1.label ?? undefined) !== (e2.label ?? undefined)) return false
  }
  return true
}

/* ------------------------------- custom node ------------------------------ */

const StartNode = React.memo(function StartNode({ id, data }: { id: string; data: { label?: string } }) {
  const updateNodeInternals = useUpdateNodeInternals()
  const markNodeReady = useScriptStore((s) => s.markNodeReady)

  // Re-measure once after DOM commit (one rAF), then publish "ready".
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      try { updateNodeInternals(id) } catch {}
      markNodeReady(id, true)
    })
    return () => {
      cancelAnimationFrame(raf)
      markNodeReady(id, false)
    }
  }, [id, data?.label, updateNodeInternals, markNodeReady])

  return (
    <div
      className="rounded-full border-2 border-[var(--lpc-primary)] bg-white px-6 py-3 text-sm font-medium shadow"
      style={{ minWidth: 140, textAlign: 'center' }}
    >
      {data?.label ?? 'Start'}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})

const NODE_TYPES: Record<string, any> = { start: StartNode, default: StartNode }

/* ----------------------------- store → RF props --------------------------- */

function useRFProps() {
  const present = useScriptStore((s) => s.doc.present)

  const nodes: RFNode[] = React.useMemo(
    () =>
      present.nodes.map((n) => ({
        id: n.id,
        type: (n as any).data?.kind === 'start' ? 'start' : 'default',
        position: n.position,
        data: { label: (n as any).data?.label, kind: (n as any).data?.kind },
        hidden: false,
      })),
    [present.nodes]
  )

  const edges: RFEdge[] = React.useMemo(
    () =>
      present.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'default',
        hidden: false,
      })),
    [present.edges]
  )

  return { nodes, edges }
}

/* --------------------------------- debug ---------------------------------- */

function DebugPanel({
  paneRef,
  seedAt,
}: {
  paneRef: React.RefObject<HTMLDivElement | null>
  seedAt: { x: number; y: number } | null
}) {
  const rf = useReactFlow<RFNode, RFEdge>()
  const vp = useViewport()
  const nodes = useScriptStore((s) => s.doc.present.nodes)
  const [open, setOpen] = React.useState(true)

  const rect = paneRef.current?.getBoundingClientRect()

  const corners = React.useMemo(() => {
    if (!rect) return null
    const tl = rf.screenToFlowPosition({ x: rect.left,  y: rect.top    })
    const tr = rf.screenToFlowPosition({ x: rect.right, y: rect.top    })
    const bl = rf.screenToFlowPosition({ x: rect.left,  y: rect.bottom })
    const br = rf.screenToFlowPosition({ x: rect.right, y: rect.bottom })
    return { tl, tr, bl, br }
  }, [rect, rf, vp.x, vp.y, vp.zoom])

  const centerStart = () => {
    const n = nodes.find((nn) => (nn as any).data?.kind === 'start') ?? nodes[0]
    if (!n) return
    rf.setCenter(n.position.x, n.position.y, { zoom: 1.2, duration: 200 })
  }

  return (
    <Panel position="top-left" className="text-xs font-mono">
      <div className="rounded border bg-white/90 shadow" style={{ minWidth: 240 }}>
        <div className="flex items-center justify-between px-2 py-1 border-b">
          <div className="font-semibold">debug</div>
          <button type="button" className="rounded border px-2 py-0.5" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Show'} debug
          </button>
        </div>

        {open && (
          <div className="px-2 py-2">
            <div>viewport: x:{r1(vp.x)}, y:{r1(vp.y)}, z:{r01(vp.zoom)}</div>
            {rect && (
              <>
                <div>pane: w:{r1(rect.width)}, h:{r1(rect.height)}</div>
                {corners && (
                  <>
                    <div>tl: {r1(corners.tl.x)}, {r1(corners.tl.y)}</div>
                    <div>tr: {r1(corners.tr.x)}, {r1(corners.tr.y)}</div>
                    <div>bl: {r1(corners.bl.x)}, {r1(corners.bl.y)}</div>
                    <div>br: {r1(corners.br.x)}, {r1(corners.br.y)}</div>
                  </>
                )}
              </>
            )}
            {seedAt && <div>seeded at: x:{r1(seedAt.x)}, y:{r1(seedAt.y)}</div>}

            <div className="mt-2">
              <div className="font-bold">nodes ({nodes.length}):</div>
              <div className="max-h-32 overflow-auto">
                {nodes.map((n) => (
                  <div key={n.id}>
                    {(n as any).data?.kind ?? 'node'} id:{n.id.slice(0, 6)} → x:{r1(n.position.x)}, y:{r1(n.position.y)}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded border px-2 py-0.5"
                onClick={() => requestAnimationFrame(() => rf.fitView({ padding: 0.2 }))}
              >
                Fit
              </button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={centerStart}>
                Center Start
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

/* --------------------------------- canvas --------------------------------- */

function CanvasInner({ paneRef }: { paneRef: React.RefObject<HTMLDivElement | null> }) {
  const { nodes, edges } = useRFProps()
  const rf  = useReactFlow<RFNode, RFEdge>()

  const setGraph    = useScriptStore((s) => s.setGraph)
  const setSelect   = useScriptStore((s) => s.setSelect)
  const updateNode  = useScriptStore((s) => s.updateNode)
  const addEdgeToDb = useScriptStore((s) => s.addEdge)
  const storeNodes  = useScriptStore((s) => s.doc.present.nodes)
  const ready       = useScriptStore((s) => s.ready)

  const rfRef = React.useRef<ReactFlowInstance | null>(null)
  const centeredRef = React.useRef(false)
  const [seedAt, setSeedAt] = React.useState<{ x: number; y: number } | null>(null)

  // Seed once when pane has size
  React.useEffect(() => {
    const state = useScriptStore.getState()
    if (state.doc.present.nodes.some((n) => (n as any).data?.kind === 'start')) return

    const pane = paneRef.current
    if (!pane) return

    const trySeed = () => {
      const r = pane.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return false
      const px = r.width / 2
      const py = 120
      const fp = rf.screenToFlowPosition({ x: r.left + px, y: r.top + py })
      state.addNode('start', fp, 'Start')
      setSeedAt(fp)
      return true
    }

    if (trySeed()) return
    const ro = new ResizeObserver(() => { if (trySeed()) ro.disconnect() })
    ro.observe(pane)
    return () => ro.disconnect()
  }, [rf, paneRef])

  // Center exactly once when a node reports ready
  React.useEffect(() => {
    if (centeredRef.current) return
    const id = Object.keys(ready).find((k) => ready[k])
    if (!id) return
    const n = storeNodes.find((x) => x.id === id)
    if (!n) return

    centeredRef.current = true
    rf.setCenter(n.position.x, n.position.y, { zoom: 1.15, duration: 220 })
    useScriptStore.getState().markNodeReady(id, false)
  }, [ready, storeNodes, rf])

  // Self-heal invalid positions (rare)
  const present = useScriptStore((s) => s.doc.present)
  React.useEffect(() => {
    const s = useScriptStore.getState()
    const { nodes, edges } = s.doc.present
    let changed = false
    const fixed = nodes.map((n) => {
      const safe = clampPosition(n.position)
      if (safe.x !== n.position.x || safe.y !== n.position.y) {
        changed = true
        return { ...n, position: safe }
      }
      return n
    })
    if (changed) s.setGraph({ nodes: fixed as any, edges })
  }, [present.nodes])

  /* ---------- RF handlers: write only when the graph really changed -------- */

  const onInit = React.useCallback((inst: ReactFlowInstance) => {
    rfRef.current = inst
  }, [])

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    const s = useScriptStore.getState()
    const curr = s.doc.present

    const nextNodes = applyNodeChanges(changes, curr.nodes.map((n) => ({ ...n } as any)))
    const next = { nodes: nextNodes as ScriptNode[], edges: curr.edges }

    if (graphsEqual(curr, next)) return  // ⛔️ skip no-op updates
    s.setGraph(next)                     // ✅ meaningful change
  }, [])

  const onEdgesChange = React.useCallback((changes: EdgeChange[]) => {
    const s = useScriptStore.getState()
    const curr = s.doc.present

    const nextEdges = applyEdgeChanges(changes, curr.edges.map((e) => ({ ...e } as any)))
    const next = { nodes: curr.nodes, edges: nextEdges as ScriptEdge[] }

    if (graphsEqual(curr, next)) return
    s.setGraph(next)
  }, [])

  const onConnect = React.useCallback((c: Connection) => {
    const s = useScriptStore.getState()
    const curr = s.doc.present

    const rfNext = addEdge(c, edges)
    const last = rfNext[rfNext.length - 1]
    if (!last?.source || !last?.target) return

    const next = {
      nodes: curr.nodes,
      edges: [
        ...curr.edges,
        {
          id: last.id,
          source: last.source,
          target: last.target,
          label: typeof last.label === 'string' ? last.label : undefined,
        } as ScriptEdge,
      ],
    }

    if (graphsEqual(curr, next)) return
    s.setGraph(next)
    addEdgeToDb(next.edges[next.edges.length - 1]) // keep your existing side-effect
  }, [edges, addEdgeToDb])

  const onNodeDragStop = React.useCallback((_e: React.MouseEvent, node: RFNode) => {
    const s = useScriptStore.getState()
    const curr = s.doc.present

    const nextNodes = curr.nodes.map((n) =>
      n.id === node.id
        ? { ...n, position: clampPosition({ x: r01(node.position.x), y: r01(node.position.y) }) }
        : n
    )

    const next = { nodes: nextNodes as ScriptNode[], edges: curr.edges }
    if (graphsEqual(curr, next)) return
    s.setGraph(next)
  }, [])

  const onSelectionChange = React.useCallback(({ nodes: sel }: { nodes: RFNode[] }) => {
    setSelect(sel?.[0]?.id)
  }, [setSelect])

  return (
    <ReactFlow
      style={{ width: '100%', height: '100%' }}
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onInit={onInit}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      onSelectionChange={onSelectionChange}
      proOptions={{ hideAttribution: true }}
    >
      <MiniMap pannable zoomable />
      <Controls position="bottom-right" />
      <Background />
      <div className="absolute right-2 top-2 rounded border bg-white/90 px-2 py-1 text-xs font-mono shadow">
        nodes: {nodes.length}
      </div>
      <DebugPanel paneRef={paneRef} seedAt={seedAt} />
    </ReactFlow>
  )
}

/* ---------------------------------- export -------------------------------- */

export default function ScriptCanvas() {
  const paneRef = React.useRef<HTMLDivElement | null>(null)
  return (
    <div ref={paneRef} className="h-full w-full">
      <CanvasInner paneRef={paneRef} />
    </div>
  )
}