import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { ScriptNode, ScriptEdge, NodeKind } from './types'
import { ensureChoiceConfig } from './types'

type History<T> = { past: T[]; present: T; future: T[] }
const commit = <T,>(h: History<T>, next: T): History<T> => ({ past: [...h.past, h.present], present: next, future: [] })

type ScriptState = {
  doc: History<{ nodes: ScriptNode[]; edges: ScriptEdge[] }>
  ready: Record<string, boolean>
  selectNodeId?: string
  setSelect(id?: string): void
  addNode(kind: NodeKind, p: { x: number; y: number }, label?: string): void
  updateNode(id: string, patch: Partial<ScriptNode>): void
  setGraph(g: { nodes: ScriptNode[]; edges: ScriptEdge[] }): void
  addEdge(e: ScriptEdge): void
  removeEdge(id: string): void
  markNodeReady(id: string, value?: boolean): void
  isNodeReady(id: string): boolean
  undo(): void
  redo(): void
}

const empty = { nodes: [] as ScriptNode[], edges: [] as ScriptEdge[] }

export const useScriptStore = create<ScriptState>((set, get) => ({
  doc: { past: [], present: empty, future: [] },
  ready: {},
  selectNodeId: undefined,
  setSelect: (id) => set({ selectNodeId: id }),
  addNode: (kind, position, label) => set((s) => {
    const n: ScriptNode = { id: nanoid(), position, data: { label: label ?? kind, kind } }
    const next = { ...s.doc.present, nodes: [...s.doc.present.nodes, n] }
    queueMicrotask(() => localStorage.setItem('script.autosave', JSON.stringify(next)))
    return { doc: commit(s.doc, next), selectNodeId: n.id }
  }),
  updateNode: (id, patch) => set((s) => {
    const next = {
      ...s.doc.present,
      nodes: s.doc.present.nodes.map((n) => (n.id === id ? { ...n, ...patch, data: { ...n.data, ...(patch as any).data } } : n)),
    }
    queueMicrotask(() => localStorage.setItem('script.autosave', JSON.stringify(next)))
    return { doc: commit(s.doc, next) }
  }),
  setGraph: (g) => set((s) => ({ doc: commit(s.doc, g) })),
  addEdge: (edge) => set((s) => {
    const next = { ...s.doc.present, edges: [...s.doc.present.edges, edge] }
    queueMicrotask(() => localStorage.setItem('script.autosave', JSON.stringify(next)))
    return { doc: commit(s.doc, next) }
  }),
  removeEdge: (id) => set((s) => {
    const filtered = s.doc.present.edges.filter((edge) => edge.id !== id)
    if (filtered.length === s.doc.present.edges.length) return s

    let nodesChanged = false
    const nextNodes = s.doc.present.nodes.map((node) => {
      const data: any = node.data ?? {}
      if ((data.kind ?? (node as any).type) !== 'choice') return node

      const cfg = ensureChoiceConfig(data.choice)
      let mutated = false

      const updatedGroups = cfg.groups.map((group: any) => {
        const edgeForGroup = filtered.find((edge) => edge.source === node.id && edge.sourceHandle === group.id)
        const nextTarget = edgeForGroup?.target ?? null
        if ((group.targetNodeId ?? null) !== nextTarget) {
          mutated = true
          return { ...group, targetNodeId: nextTarget }
        }
        return group
      })

      const defaultEdge = filtered.find((edge) => edge.source === node.id && edge.sourceHandle === '__default__')
      const nextDefault = defaultEdge?.target ?? null
      if ((cfg.defaultTargetNodeId ?? null) !== nextDefault) {
        mutated = true
      }

      if (!mutated) return node
      nodesChanged = true
      return {
        ...node,
        data: {
          ...data,
          choice: {
            ...cfg,
            groups: updatedGroups,
            defaultTargetNodeId: nextDefault,
          },
        },
      }
    })

    const next = {
      ...s.doc.present,
      nodes: nodesChanged ? (nextNodes as ScriptNode[]) : s.doc.present.nodes,
      edges: filtered,
    }

    queueMicrotask(() => localStorage.setItem('script.autosave', JSON.stringify(next)))
    return { doc: commit(s.doc, next) }
  }),
  markNodeReady: (id, value = true) => set((s) => ({ ready: { ...s.ready, [id]: value } })),
  isNodeReady: (id) => Boolean(get().ready[id]),
  undo: () => set((s) => (s.doc.past.length ? { doc: { past: s.doc.past.slice(0, -1), present: s.doc.past.at(-1)!, future: [s.doc.present, ...s.doc.future] } } : s)),
  redo: () => set((s) => (s.doc.future.length ? { doc: { past: [...s.doc.past, s.doc.present], present: s.doc.future[0], future: s.doc.future.slice(1) } } : s)),
}))
