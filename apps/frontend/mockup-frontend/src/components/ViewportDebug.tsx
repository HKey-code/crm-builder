import React from 'react';

type ViewportDebugProps = {
  /** Set true if you want it inline in the flow (e.g., right after the hero).
   *  Omit or set false to render as a small fixed overlay (bottom-left).
   */
  inline?: boolean;
};

function sample() {
  const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
  const innerW = window.innerWidth;
  const innerH = window.innerHeight;
  const clientW = document.documentElement.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  const mdPx = 48 * remPx;                   // Tailwind v4: md = 48rem
  const mdMatch = matchMedia('(min-width: 48rem)').matches;

  // A rough zoom estimate (not exact across all platforms, but useful):
  // If devtools are docked, this won't be meaningful—still gives a hint.
  const zoomApprox = (innerW / clientW) || 1;

  // Try to read your CSS var for the rail width if present:
  const rootStyles = getComputedStyle(document.documentElement);
  const railW = rootStyles.getPropertyValue('--rail-w')?.trim() || '(not set)';

  return {
    innerW, innerH, clientW, dpr, remPx, mdPx, mdMatch, zoomApprox, railW,
  };
}

export default function ViewportDebug({ inline = false }: ViewportDebugProps) {
  const [state, setState] = React.useState(sample());

  React.useEffect(() => {
    const onResize = () => setState(sample());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const id = window.setInterval(onResize, 1000); // catch font-size changes / zoom
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.clearInterval(id);
    };
  }, []);

  const Box = (
    <div
      role="status"
      className={
        inline
          ? 'mt-3 mb-4 w-full max-w-6xl mx-auto rounded border border-[var(--lpc-stroke)] bg-white text-[var(--lpc-text)] font-mono text-xs px-3 py-2 shadow-sm'
          : 'fixed left-4 bottom-4 z-[60] rounded border border-[var(--lpc-stroke)] bg-black/70 text-white font-mono text-[11px] px-3 py-2 shadow-lg'
      }
      style={{ backdropFilter: inline ? undefined : 'blur(3px)' }}
    >
      <div><b>Viewport Debug</b></div>
      <div>innerWidth × innerHeight: <b>{state.innerW} × {state.innerH}</b></div>
      <div>clientWidth (docEl): <b>{state.clientW}</b></div>
      <div>devicePixelRatio: <b>{state.dpr}</b></div>
      <div>rem (root font-size): <b>{state.remPx}px</b></div>
      <div>md (48rem) in px: <b>{state.mdPx.toFixed(1)}px</b> — match: <b>{String(state.mdMatch)}</b></div>
      <div>zoom approx: <b>{state.zoomApprox.toFixed(2)}×</b></div>
      <div>--rail-w: <b>{state.railW}</b></div>
    </div>
  );

  return Box;
}


