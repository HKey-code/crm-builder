## Node Authoring Guideline (React Flow v11 + Zustand, controlled mode)

0) TL;DR (the one rule)

If a node’s DOM/size/handles can change on mount or update, the node must call:

```tsx
useLayoutEffect(() => {
  updateNodeInternals(id);      // re-measure now that DOM is committed
  markNodeReady(id, true);      // optional: handshake to the app
  return () => markNodeReady(id, false);
}, [id, /* props that affect size/handles */]);
```

This guarantees React Flow flips visibility: visible and edges anchor correctly before paint.

---

1) When to add the handshake (required)

Add useLayoutEffect + useUpdateNodeInternals inside the node component whenever:
- Label/text can change (dynamic label, error text, validation hint).
- Content is async (images, fetched text, collapsible sections).
- Handles are added/removed/moved conditionally (branching, repeaters).
- Layout depends on fonts or CSS that may load late.

Not needed for truly static nodes (fixed size + fixed handles + no dynamic content).

---

2) Minimal skeleton for any custom node

```tsx
import React, { useLayoutEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from 'reactflow';
import { useScriptStore } from '../store';

type MyData = { label?: string; /* other props affecting layout */ };

export function MyNode({ id, data }: NodeProps<MyData>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const markNodeReady = useScriptStore((s) => s.markNodeReady);

  useLayoutEffect(() => {
    updateNodeInternals(id);
    markNodeReady(id, true);
    return () => markNodeReady(id, false);
  }, [id, data?.label, /* include props that affect layout */, updateNodeInternals, markNodeReady]);

  return (
    <div className="rounded border bg-white px-4 py-2 text-sm shadow">
      {data?.label ?? 'Untitled'}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

Tips
- Include every prop that affects size/handles in the dependency array.
- Size nodes with CSS, not inline JS computations; re-measure handles via the effect.

---

3) App side (once per canvas)

- Watch the store’s ready map and perform actions that must happen after measurement (e.g., center/select).

```tsx
const ready = useScriptStore(s => s.ready);
const nodes = useScriptStore(s => s.doc.present.nodes);
const markNodeReady = useScriptStore(s => s.markNodeReady);
const rf = useReactFlow();

useEffect(() => {
  const id = Object.keys(ready).find(k => ready[k]);
  if (!id) return;
  const n = nodes.find(x => x.id === id);
  if (!n) return;
  const { zoom } = rf.getViewport();
  rf.setCenter(n.position.x, n.position.y, { zoom: Math.max(zoom, 1.2), duration: 200 });
  markNodeReady(id, false); // one-shot
}, [ready, nodes, rf, markNodeReady]);
```

- Palette (or any outside code) should only add the node to the store. Do not call updateNodeInternals from outside.

---

4) Data shape & IDs

- Node shape (controlled):

```ts
{ id: string, position: { x: number; y: number }, data: { label?: string, kind: 'start'|'text'|... } }
```

- Generate IDs in the store (nanoid()), not in the node.
- Keep nodeTypes mapping stable:

```ts
const NODE_TYPES = { start: StartNode, text: TextNode, /* ... */ } as const;
```

---

5) Performance & stability

- Don’t call updateNodeInternals in hot loops; the per-node useLayoutEffect is the correct place.
- If many nodes mount at once, it’s okay—each re-measures itself. If you need batching, you can debounce the camera reaction (not the node re-measure).
- Avoid global CSS overrides like `.react-flow__node { visibility: visible !important }` in production—they mask measurement problems.
- Keep `<ReactFlow onlyRenderVisibleElements={false}>` during development if needed; remove later if everything is stable.

---

6) Testing checklist (per node)

- Add the node via Palette → it appears immediately (no flicker, no stuck visibility:hidden).
- Resize or toggle content that changes height/handles → edges reconnect correctly.
- Slow network font/image → node still becomes visible (effect runs after commit).
- Save/load JSON (controlled mode) → nodes render with the same positions.

---

7) Controlled vs uncontrolled (quick reminder)

- Controlled (current): Zustand owns nodes/edges; coordinate lifecycle (useLayoutEffect + re-measure). Pro: save/load, undo/redo, collab.
- Uncontrolled: RF owns nodes/edges; less lifecycle code, less control.

---

8) Common mistakes to avoid

- Calling updateNodeInternals from the page or palette (racy).
- Forgetting to include data.* props that affect layout in the useLayoutEffect deps.
- Re-centering the camera before the node is measured.
- Styling nodes purely with JS layout math; prefer CSS + re-measure.

---

Note: A tiny NodeMeasurer helper can also be added to auto-remeasure newly added nodes, but with the node-level useLayoutEffect + ready watcher you already have a deterministic pattern.


