// apps/frontend/mockup-frontend/src/features/scripting/components/ScriptCanvasLocal.tsx
import * as React from 'react';
import { useLayoutEffect } from 'react';
import useUndo from 'use-undo';
import { nanoid } from 'nanoid';

import { migrateSimpleChoice, ensureChoiceConfig, createChoiceConfig, type ClauseType } from '../types';

import { ReactFlow, 
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  useViewport,
  useUpdateNodeInternals,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node as RFNode,
  type Edge as RFEdge,
  MarkerType,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Panel,
} from '@xyflow/react';
import TextNode from './nodes/TextNode';
import ChoiceNode from './nodes/ChoiceNode';
import InputNode from './nodes/InputNode';

export type NodeKind = 'start' | 'text' | 'input' | 'choice' | 'connector' | 'end';

export type GraphJSON = {
  nodes: { id: string; x: number; y: number; type?: string; data?: any }[];
  edges: { id: string; source: string; target: string; label?: string; sourceHandle?: string | null }[];
};

const r1 = (n: number) => Math.round(n);
const r2 = (n: number) => Math.round(n * 10) / 10;

function clampPosition(pos: { x: number; y: number }) {
  const x = Number.isFinite(pos.x) ? pos.x : 0;
  const y = Number.isFinite(pos.y) ? pos.y : 0;
  return { x: Math.abs(x) > 1e5 ? 0 : x, y: Math.abs(y) > 1e5 ? 0 : y };
}

const inferVarType = (inputType?: string): ClauseType => {
  switch (inputType) {
    case 'multiSelect':
    case 'checkbox':
      return 'array';
    case 'radio':
    case 'singleSelect':
    case 'text':
    default:
      return 'string';
  }
};

/* ------------------------------ Custom node ------------------------------- */

const StartNode = React.memo(function StartNode({ id, data }: { id: string; data: { label?: string } }) {
  const update = useUpdateNodeInternals();

  // One frame after mount: ask React Flow to measure
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      try { update(id); } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, [id, data?.label, update]);

  return (
    <div
      className="relative group rounded-full border-2 border-[var(--lpc-primary)] bg-white px-6 py-3 text-sm font-medium shadow"
      style={{ minWidth: 140, textAlign: 'center' }}
    >
      {data?.label ?? 'Start'}
      {/* Bottom port indicator + handle for starting edges */}
      <div aria-hidden className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[var(--lpc-primary)]/30" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 translate-y-1 rounded-full border border-[var(--lpc-primary)] bg-[var(--lpc-primary)]/70 ring-2 ring-white"
      />
    </div>
  );
});

const NODE_TYPES = { start: StartNode, text: TextNode, choice: ChoiceNode, input: InputNode, default: TextNode } as any;

/* --------------------------------- Canvas ---------------------------------- */

export default function ScriptCanvasLocal({
  initial,
  onChange,
}: {
  initial?: GraphJSON;
  onChange?: (g: GraphJSON) => void;
}) {
  /** 1) Undoable JSON graph (single source of truth) */
  const initialJSON = React.useMemo<GraphJSON>(() => initial ?? { nodes: [], edges: [] }, [initial]);
  const [graphState, { set: setGraphJSON, undo, redo, canUndo, canRedo }] = useUndo<GraphJSON>(initialJSON);
  const { present: graphJSON, past, future } = graphState;

  /** 2) Derive RF nodes/edges from JSON */
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { nodes, edges } = React.useMemo(() => {
    const base = fromJSON(graphJSON);
    const withSelection = selectedId
      ? { nodes: base.nodes.map(n => (n.id === selectedId ? { ...n, selected: true } : n)), edges: base.edges }
      : base;
    return withSelection;
  }, [graphJSON, selectedId]);

  /** 3) RF helpers + pane */
  const rf = useReactFlow<RFNode, RFEdge>();
  const vp = useViewport();
  const paneRef = React.useRef<HTMLDivElement | null>(null);

  const seededRef = React.useRef(false);
  const [seedAt, setSeedAt] = React.useState<{ x: number; y: number } | null>(null);

  /** Helper: add a text node just AFTER Start node (with offset) */
  const addTextAtCenter = React.useCallback((label = 'New text') => {
    const pane = paneRef.current;
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const startNode = nodes.find(n => (n.type ?? '') === 'start' || (n as any)?.data?.kind === 'start');
    const verticalOffset = 120;

    let posX: number;
    let posY: number;

    if (startNode) {
      posX = startNode.position.x;
      posY = startNode.position.y + verticalOffset;
    } else {
      // Fallback: place near top-center if no Start
      const screen = { x: rect.left + rect.width / 2, y: rect.top + verticalOffset };
      const p = rf.screenToFlowPosition(screen);
      posX = p.x;
      posY = p.y;
    }

    // Avoid overlapping existing nodes: nudge down until free
    const isOccupied = (x: number, y: number) =>
      nodes.some(n => Math.abs(n.position.x - x) < 24 && Math.abs(n.position.y - y) < 24);
    while (isOccupied(posX, posY)) posY += 80;

    const newNode: RFNode = {
      id: crypto.randomUUID(),
      type: 'text',
      position: { x: posX, y: posY },
      data: { label: label, kind: 'text', content: '' },
    } as any;

    const next = toJSON([...nodes, newNode], edges);
    setGraphJSON(next);
  }, [rf, paneRef, nodes, edges, setGraphJSON]);

  /** Helper: add an input node near center with defaults */
  const addInputAtCenter = React.useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const startNode = nodes.find(n => (n.type ?? '') === 'start' || (n as any)?.data?.kind === 'start');
    const verticalOffset = 120;

    let posX: number;
    let posY: number;

    if (startNode) {
      posX = startNode.position.x + 220;
      posY = startNode.position.y + verticalOffset;
    } else {
      const screen = { x: rect.left + rect.width / 2 + 120, y: rect.top + verticalOffset };
      const p = rf.screenToFlowPosition(screen);
      posX = p.x;
      posY = p.y;
    }

    const isOccupied = (x: number, y: number) =>
      nodes.some(n => Math.abs(n.position.x - x) < 24 && Math.abs(n.position.y - y) < 24);
    while (isOccupied(posX, posY)) posY += 80;

    const newNode: RFNode = {
      id: crypto.randomUUID(),
      type: 'input',
      position: { x: posX, y: posY },
      data: {
        kind: 'input',
        title: 'New input',
        varName: 'value',
        inputType: 'text',
        placeholder: 'Enter value...',
        required: false,
        options: [],
      },
    } as any;

    const next = toJSON([...nodes, newNode], edges);
    setGraphJSON(next);
  }, [rf, paneRef, nodes, edges, setGraphJSON]);

  /** Helper: add a choice node near center with useful defaults */
  const addChoiceAtCenter = React.useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const rect = pane.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const startNode = nodes.find(n => (n.type ?? '') === 'start' || (n as any)?.data?.kind === 'start');
    const verticalOffset = 200;

    let posX: number;
    let posY: number;

    if (startNode) {
      posX = startNode.position.x + 220;
      posY = startNode.position.y + verticalOffset;
    } else {
      const screen = { x: rect.left + rect.width / 2 + 120, y: rect.top + verticalOffset };
      const p = rf.screenToFlowPosition(screen);
      posX = p.x;
      posY = p.y;
    }

    const isOccupied = (x: number, y: number) =>
      nodes.some(n => Math.abs(n.position.x - x) < 24 && Math.abs(n.position.y - y) < 24);
    while (isOccupied(posX, posY)) posY += 80;

    const baseChoice = createChoiceConfig();
    const initializedChoice = {
      ...baseChoice,
      groups: baseChoice.groups.map((group, idx) => ({
        ...group,
        title: `Group ${idx + 1}`,
        rules: group.rules.map((rule, ridx) => ({
          ...rule,
          name: `Rule ${ridx + 1}`,
        })),
      })),
    };

    const newNode: RFNode = {
      id: crypto.randomUUID(),
      type: 'choice',
      position: { x: posX, y: posY },
      data: {
        kind: 'choice',
        label: 'New choice',
        choice: initializedChoice,
      },
    } as any;

    const next = toJSON([...nodes, newNode], edges);
    setGraphJSON(next);
  }, [rf, paneRef, nodes, edges, setGraphJSON]);

  /** 4) Seed Start once when pane has size (v12: screenToFlowPosition) */
  React.useEffect(() => {
    if (seededRef.current) return;
    if (graphJSON.nodes.length) { seededRef.current = true; return; }

    const pane = paneRef.current;
    if (!pane) return;

    const trySeed = () => {
      if (seededRef.current) return true;
      const rect = pane.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;

      const screenX = rect.left + rect.width / 2;
      const screenY = rect.top + 120;
      const fp = rf.screenToFlowPosition({ x: screenX, y: screenY });

      setGraphJSON({
        nodes: [
          {
            id: crypto.randomUUID(),
            x: fp.x,
            y: fp.y,
            type: 'start',
            data: { label: 'Start', kind: 'start', content: '' },
          },
        ],
        edges: [],
      });

      seededRef.current = true;
      setSeedAt(fp);
      return true;
    };

    if (trySeed()) return;
    const ro = new ResizeObserver(() => { if (trySeed()) ro.disconnect(); });
    ro.observe(pane);
    return () => ro.disconnect();
  }, [rf, graphJSON.nodes.length, setGraphJSON]);

  // Removed auto-centering to avoid moving the seeded Start node

  /** 6) Export callback on JSON change (optional) */
  React.useEffect(() => { onChange?.(graphJSON); }, [graphJSON, onChange]);

  /** Listen for palette requests (page-level) to add nodes locally */
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const anyEv = ev as any;
      const kind: string | undefined = anyEv?.detail?.kind;
      if (kind === 'text') addTextAtCenter('New text');
      if (kind === 'input') addInputAtCenter();
      if (kind === 'choice') addChoiceAtCenter();
    };
    window.addEventListener('script-canvas-add', handler as EventListener);
    return () => window.removeEventListener('script-canvas-add', handler as EventListener);
  }, [addTextAtCenter, addInputAtCenter, addChoiceAtCenter]);

  React.useEffect(() => {
    let changed = false;
    const nextNodes = nodes.map((node) => {
      const data: any = node.data ?? {};
      if ((data.kind ?? node.type) !== 'choice') return node;
      const ensured = ensureChoiceConfig(data.choice ?? {})
      const needsUpdate = JSON.stringify(ensured) !== JSON.stringify(data.choice ?? {})
      const legacyVarNames = Array.isArray(data.varNames) ? data.varNames : []
      const legacyOptions = Array.isArray(data.options) ? data.options : []
      let updatedConfig = ensured
      if (!data.choice && legacyVarNames.length && legacyOptions.length) {
        updatedConfig = migrateSimpleChoice(legacyVarNames[0], legacyOptions)
      }
      if (!needsUpdate && updatedConfig === data.choice) return node
      changed = true
      return {
        ...node,
        data: {
          ...data,
          choice: updatedConfig,
          varNames: undefined,
          matchMode: undefined,
          options: undefined,
          hasDefault: undefined,
        },
      }
    });
    if (!changed) return;
    const next = toJSON(nextNodes, edges);
    if (graphsEqual(graphJSON, next)) return;
    setGraphJSON(next);
  }, [nodes, edges, graphJSON, setGraphJSON]);

  /** Listen for rename requests from the page (right rail) */
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const anyEv = ev as any;
      const id: string | undefined = anyEv?.detail?.id;
      const name: string | undefined = anyEv?.detail?.name; // maps to data.label
      const content: string | undefined = anyEv?.detail?.content; // maps to data.content
      const inputType: string | undefined = anyEv?.detail?.inputType;
      const placeholder: string | undefined = anyEv?.detail?.placeholder;
      const varName: string | undefined = anyEv?.detail?.varName;
      const required: boolean | undefined = anyEv?.detail?.required;
      const ioptions: any[] | undefined = anyEv?.detail?.options;
      const title: string | undefined = anyEv?.detail?.title; // for choice
      const varNames: string[] | undefined = anyEv?.detail?.varNames;
      const matchMode: string | undefined = anyEv?.detail?.matchMode;
      const options: any[] | undefined = anyEv?.detail?.options;
      const hasDefault: boolean | undefined = anyEv?.detail?.hasDefault;
      const choice: any | undefined = anyEv?.detail?.choice;
      if (!id) return;
      let nextEdges = edges;
      const nextNodes = nodes.map(n => {
        if (n.id !== id) return n;
        const current = n.data ?? {};
        let effectiveChoice = choice !== undefined ? ensureChoiceConfig(choice) : ensureChoiceConfig((current as any).choice ?? {});
        if (effectiveChoice) {
          const ruleIds = new Set(effectiveChoice.groups.flatMap((group: any) => (group.rules ?? []).map((r: any) => r.id)));
          ruleIds.add('__default__');
          nextEdges = nextEdges
            .filter((edge) => edge.source !== id || !edge.sourceHandle || ruleIds.has(String(edge.sourceHandle)))
            .map((edge) => {
              if (edge.source !== id || !edge.sourceHandle) return edge;
              if (edge.sourceHandle === '__default__') return edge;
              const nextLabel = effectiveChoice.groups.flatMap((g: any) => g.rules ?? []).find((r: any) => r.id === edge.sourceHandle)?.name;
              return nextLabel ? { ...edge, label: nextLabel } : edge;
            });
        }
        return {
          ...n,
          data: {
            ...current,
            ...(name !== undefined ? { label: name, title: name } : {}),
            ...(content !== undefined ? { content } : {}),
            ...(inputType !== undefined ? { inputType } : {}),
            ...(placeholder !== undefined ? { placeholder } : {}),
            ...(varName !== undefined ? { varName } : {}),
            ...(required !== undefined ? { required } : {}),
            ...(ioptions !== undefined ? { options: ioptions } : {}),
            ...(title !== undefined ? { title } : {}),
            ...(varNames !== undefined ? { varNames } : {}),
            ...(matchMode !== undefined ? { matchMode } : {}),
            ...(options !== undefined ? { options } : {}),
            ...(hasDefault !== undefined ? { hasDefault } : {}),
            ...(effectiveChoice !== undefined
              ? {
                  choice: effectiveChoice,
                  varNames: undefined,
                  matchMode: undefined,
                  options: undefined,
                  hasDefault: undefined,
                }
              : {}),
          },
        };
      });
      const next = toJSON(nextNodes, nextEdges);
      if (graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
    };
    window.addEventListener('script-canvas-rename', handler as EventListener);
    return () => window.removeEventListener('script-canvas-rename', handler as EventListener);
  }, [nodes, edges, graphJSON, setGraphJSON]);

  /** Listen for delete node requests from node UI */
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const anyEv = ev as any;
      const id: string | undefined = anyEv?.detail?.id;
      if (!id) return;
      const nextNodes = nodes.filter(n => n.id !== id);
      const nextEdges = edges.filter(e => e.source !== id && e.target !== id);
      const next = toJSON(nextNodes, nextEdges);
      if (graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
      setSelectedId((curr) => (curr === id ? null : curr));
    };
    window.addEventListener('script-canvas-delete', handler as EventListener);
    return () => window.removeEventListener('script-canvas-delete', handler as EventListener);
  }, [nodes, edges, graphJSON, setGraphJSON]);

  /** 7) RF handlers → write back into undoable JSON */
  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      // Ignore ephemeral changes that occur during drag/measure to avoid re-mount flicker.
      // We only persist positions in onNodeDragStop.
      const actionable = changes.filter(change =>
        change.type !== 'dimensions' && change.type !== 'position'
      );
      if (actionable.length === 0) return;

      const nextNodes = applyNodeChanges(actionable, nodes);
      const next = toJSON(nextNodes, edges);
      if (graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
    },
    [nodes, edges, graphJSON, setGraphJSON]
  );

  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      let touched = false;
      const nextNodes = nodes.map((node) => {
        const ndata: any = node.data ?? {};
        const choiceCfg = ensureChoiceConfig(ndata.choice);
        let changed = false;
        const updatedGroups = choiceCfg.groups.map((group: any) => ({
          ...group,
          rules: (group.rules ?? []).map((rule: any) => {
            const edgeForRule = nextEdges.find((edge) => edge.source === node.id && edge.sourceHandle === rule.id);
            const nextTarget = edgeForRule?.target ?? null;
            if (rule.target !== nextTarget) {
              changed = true;
              return { ...rule, target: nextTarget };
            }
            return rule;
          }),
        }));
        const defaultEdge = nextEdges.find((edge) => edge.source === node.id && edge.sourceHandle === '__default__');
        if ((choiceCfg.defaultTarget ?? null) !== (defaultEdge?.target ?? null)) {
          changed = true;
        }
        if (!changed) return node;
        touched = true;
        return {
          ...node,
          data: {
            ...ndata,
            choice: {
              ...choiceCfg,
              groups: updatedGroups,
              defaultTarget: defaultEdge?.target ?? null,
            },
          },
        };
      });
      const next = toJSON(nextNodes, nextEdges);
      if (!touched && graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
    },
    [nodes, edges, graphJSON, setGraphJSON]
  );

  const onConnect = React.useCallback(
    (c: Connection) => {
      const sourceNode = nodes.find((n) => n.id === c.source);
      const sourceData: any = sourceNode?.data ?? {};
      const choiceCfg = ensureChoiceConfig(sourceData?.choice ?? {});
      const allRules = choiceCfg.groups.flatMap((group: any) => group.rules ?? []);
      const matchedRule = typeof c.sourceHandle === 'string'
        ? allRules.find((r: any) => r.id === c.sourceHandle)
        : undefined;

      let nextNodes = nodes;
      if (matchedRule) {
        const updatedGroups = choiceCfg.groups.map((group: any) => ({
          ...group,
          rules: (group.rules ?? []).map((r: any) => (r.id === matchedRule.id ? { ...r, target: c.target ?? null } : r)),
        }));
        if (JSON.stringify(updatedGroups) !== JSON.stringify(choiceCfg.groups)) {
          nextNodes = nodes.map((n) => {
            if (n.id !== sourceNode?.id) return n;
            return {
              ...n,
              data: {
                ...(n.data ?? {}),
                choice: {
                  ...choiceCfg,
                  groups: updatedGroups,
                },
              },
            };
          });
        }
      } else if (c.sourceHandle === '__default__') {
        const nextCfg = { ...choiceCfg, defaultTarget: c.target ?? null };
        nextNodes = nodes.map((n) => (n.id === sourceNode?.id ? { ...n, data: { ...(n.data ?? {}), choice: nextCfg } } : n));
      }

      const connectionWithLabel = {
        ...c,
        ...(matchedRule && !(c as any).label ? { label: matchedRule.name } : {}),
      } as Connection & { label?: string };

      const nextEdges = addEdge(connectionWithLabel, edges);
      const next = toJSON(nextNodes, nextEdges);
      if (graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
    },
    [nodes, edges, graphJSON, setGraphJSON]
  );

  const onNodeDragStop = React.useCallback(
    (_e: React.MouseEvent, node: RFNode) => {
      const nextNodes = nodes.map(n => (n.id === node.id ? { ...n, position: clampPosition(node.position) } : n));
      const next = toJSON(nextNodes, edges);
      if (graphsEqual(graphJSON, next)) return;
      setGraphJSON(next);
    },
    [nodes, edges, graphJSON, setGraphJSON]
  );

  /** Bridge selection to page via CustomEvent */
  const onSelectionChange = React.useCallback((payload: any) => {
    const sel = Array.isArray(payload?.nodes) && payload.nodes.length > 0 ? payload.nodes[0] : null;
    const availableVars = nodes
      .filter((node) => ((node.data as any)?.kind ?? node.type) === 'input')
      .map((node) => {
        const data: any = node.data ?? {};
        const name = data.varName;
        if (!name || typeof name !== 'string') return null;
        return { name, type: inferVarType(data.inputType), nodeId: node.id };
      })
      .filter(Boolean) as { name: string; type: ClauseType; nodeId: string }[];

    const graphNodesSummary = nodes.map((node) => {
      const data: any = node.data ?? {};
      return {
        id: node.id,
        label: data.label ?? data.title ?? node.id,
        kind: data.kind ?? node.type ?? 'text',
      };
    });

    const detail = sel
      ? {
          id: sel.id as string,
          kind: (sel as any)?.data?.kind ?? (sel.type ?? 'text'),
          name: (sel as any)?.data?.label ?? (sel as any)?.data?.title ?? '',
          content: (sel as any)?.data?.content ?? '',
          // input
          inputType: (sel as any)?.data?.inputType ?? undefined,
          placeholder: (sel as any)?.data?.placeholder ?? undefined,
          varName: (sel as any)?.data?.varName ?? undefined,
          required: (sel as any)?.data?.required ?? undefined,
          options: (sel as any)?.data?.options ?? undefined,
          // choice
          title: (sel as any)?.data?.title ?? undefined,
          varNames: (sel as any)?.data?.varNames ?? undefined,
          matchMode: (sel as any)?.data?.matchMode ?? undefined,
          hasDefault: (sel as any)?.data?.hasDefault ?? undefined,
          choice: (sel as any)?.data?.choice ?? undefined,
          availableVars,
          graphNodes: graphNodesSummary,
        }
      : null;
    setSelectedId(detail?.id ?? null);
    window.dispatchEvent(new CustomEvent('script-canvas-select', { detail }));
  }, [nodes]);

  /** 8) Debug pane corners/center in FLOW coords */
  const corners = React.useMemo(() => {
    const rect = paneRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const tl = rf.screenToFlowPosition({ x: rect.left, y: rect.top });
    const tr = rf.screenToFlowPosition({ x: rect.right, y: rect.top });
    const bl = rf.screenToFlowPosition({ x: rect.left, y: rect.bottom });
    const br = rf.screenToFlowPosition({ x: rect.right, y: rect.bottom });
    const center = rf.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    return { tl, tr, bl, br, center, rect };
  }, [vp.x, vp.y, vp.zoom, rf]);

  return (
    <div ref={paneRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: 'var(--lpc-primary)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--lpc-primary)', width: 18, height: 18 },
        }}
        proOptions={{ hideAttribution: true }}
        fitView={nodes.length === 0}
      >
        <MiniMap pannable zoomable />
        <Controls position="bottom-right" />
        <Panel position="top-right" className="text-xs">
          <div className="rounded border bg-white/90 shadow px-2 py-1 flex gap-2 items-center">
            <button className="rounded border px-2 py-0.5 disabled:opacity-50" disabled={!canUndo} onClick={undo}>
              Undo
            </button>
            <button className="rounded border px-2 py-0.5 disabled:opacity-50" disabled={!canRedo} onClick={redo}>
              Redo
            </button>
            <span className="text-[11px] text-gray-600">({past.length} / {future.length})</span>
          </div>
        </Panel>
        <Panel position="top-left" className="text-xs font-mono">
          <div className="rounded border bg-white/90 shadow" style={{ minWidth: 240 }}>
            <div className="px-2 py-2 space-y-1">
              <div>viewport: x:{r1(vp.x)}, y:{r1(vp.y)}, z:{r2(vp.zoom)}</div>
              {corners && (
                <>
                  <div>pane: w:{r1(corners.rect.width)}, h:{r1(corners.rect.height)}</div>
                  <div>tl: {r1(corners.tl.x)}, {r1(corners.tl.y)}</div>
                  <div>tr: {r1(corners.tr.x)}, {r1(corners.tr.y)}</div>
                  <div>bl: {r1(corners.bl.x)}, {r1(corners.bl.y)}</div>
                  <div>br: {r1(corners.br.x)}, {r1(corners.br.y)}</div>
                  <div>center(flow): {r1(corners.center.x)}, {r1(corners.center.y)}</div>
                </>
              )}
              {seedAt && <div>seeded at: x:{r1(seedAt.x)}, y:{r1(seedAt.y)}</div>}
              <div className="mt-1">nodes: {nodes.length} / edges: {edges.length}</div>
            </div>
          </div>
        </Panel>
        <Background />
      </ReactFlow>
    </div>
  );
}

/* ----------------------------- JSON helpers ------------------------------- */

export function toJSON(nodes: RFNode[], edges: RFEdge[]): GraphJSON {
  return {
    nodes: nodes.map(n => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      type: n.type,
      data: {
        ...(n.data ?? {}),
        label: typeof (n as any).data?.label === 'string' ? (n as any).data.label : undefined,
        content: typeof (n as any).data?.content === 'string' ? (n as any).data.content : undefined,
      },
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: typeof e.label === 'string' ? e.label : undefined,
      sourceHandle: typeof (e as any).sourceHandle === 'string' ? (e as any).sourceHandle : undefined,
    })),
  };
}

export function fromJSON(g: GraphJSON): { nodes: RFNode[]; edges: RFEdge[] } {
  return {
    nodes: g.nodes.map(n => ({
      id: n.id,
      type: n.type ?? 'default',
      position: { x: n.x, y: n.y },
      data: n.data ?? {},
      hidden: false,
    })),
    edges: g.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? undefined,
      sourceHandle: e.sourceHandle ?? undefined,
      hidden: false,
      type: 'default',
    })),
  };
}

function graphsEqual(a: GraphJSON, b: GraphJSON): boolean {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return false;

  for (let i = 0; i < a.nodes.length; i += 1) {
    const na = a.nodes[i];
    const nb = b.nodes[i];
    if (na.id !== nb.id || na.x !== nb.x || na.y !== nb.y || (na.type ?? '') !== (nb.type ?? '')) return false;
    const da = na.data ?? {};
    const db = nb.data ?? {};
    const varNamesA = Array.isArray(da.varNames) ? da.varNames.join(',') : '';
    const varNamesB = Array.isArray(db.varNames) ? db.varNames.join(',') : '';
    const optionsA = JSON.stringify(da.options ?? []);
    const optionsB = JSON.stringify(db.options ?? []);
    const choiceA = JSON.stringify(da.choice ?? null);
    const choiceB = JSON.stringify(db.choice ?? null);
    if (
      (da.label ?? '') !== (db.label ?? '') ||
      (da.title ?? '') !== (db.title ?? '') ||
      (da.kind ?? '') !== (db.kind ?? '') ||
      (da.content ?? '') !== (db.content ?? '') ||
      (da.matchMode ?? '') !== (db.matchMode ?? '') ||
      (da.inputType ?? '') !== (db.inputType ?? '') ||
      (da.placeholder ?? '') !== (db.placeholder ?? '') ||
      (da.varName ?? '') !== (db.varName ?? '') ||
      (String(da.required ?? false) !== String(db.required ?? false)) ||
      (String(da.hasDefault ?? false) !== String(db.hasDefault ?? false)) ||
      varNamesA !== varNamesB ||
      optionsA !== optionsB ||
      choiceA !== choiceB
    ) return false;
  }

  for (let i = 0; i < a.edges.length; i += 1) {
    const ea = a.edges[i];
    const eb = b.edges[i];
    if (ea.id !== eb.id || ea.source !== eb.source || ea.target !== eb.target) return false;
    if ((ea.label ?? '') !== (eb.label ?? '')) return false;
    if ((ea as any).sourceHandle !== (eb as any).sourceHandle) return false;
  }

  return true;
}
