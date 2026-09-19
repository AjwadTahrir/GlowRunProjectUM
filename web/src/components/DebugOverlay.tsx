import { useEffect, useState } from 'react';

/**
 * Diagnostics for layout problems that only show on a real phone. Rendered only when
 * the URL carries ?debug, so it is invisible to everyone else. Remove once the top-gap
 * question is settled.
 *
 * Two coloured lines are pinned to the top of the page's layout viewport:
 *   red  line  at top: 0
 *   blue line  at top: env(safe-area-inset-top)
 * If the red line sits BELOW the top of the screen, the browser is laying the page out
 * lower than the screen edge, and that gap is not something the CSS can paint over.
 */
export function DebugOverlay() {
  const [rows, setRows] = useState<string[]>([]);

  useEffect(() => {
    const read = () => {
      const probe = document.getElementById('debug-probe');
      const cs = probe ? getComputedStyle(probe) : null;
      const vv = window.visualViewport;
      const header = document.querySelector('header')?.getBoundingClientRect();
      const at = (y: number) => {
        const el = document.elementFromPoint(window.innerWidth / 2, y);
        return el ? `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0] ?? ''}` : 'none';
      };
      const bg = (el: Element) => getComputedStyle(el).backgroundColor;
      setRows([
        `viewport ${window.innerWidth}x${window.innerHeight}  screen ${screen.width}x${screen.height}  dpr ${window.devicePixelRatio}`,
        `scrollY ${Math.round(window.scrollY)}  standalone ${String((navigator as unknown as { standalone?: boolean }).standalone)}`,
        vv
          ? `visualViewport top ${Math.round(vv.offsetTop)} pageTop ${Math.round(vv.pageTop)} h ${Math.round(vv.height)} scale ${vv.scale}`
          : 'visualViewport n/a',
        cs
          ? `env inset top ${cs.paddingTop} bottom ${cs.paddingBottom} left ${cs.paddingLeft} right ${cs.paddingRight}`
          : 'env probe missing',
        `--safe-top ${getComputedStyle(document.documentElement).getPropertyValue('--safe-top').trim() || '(unset)'}  --header-h ${getComputedStyle(document.documentElement).getPropertyValue('--header-h').trim()}`,
        header ? `header top ${Math.round(header.top)} bottom ${Math.round(header.bottom)} height ${Math.round(header.height)}` : 'header missing',
        `at y=1 ${at(1)} | y=20 ${at(20)} | y=60 ${at(60)} | y=120 ${at(120)}`,
        `bg html ${bg(document.documentElement)} body ${bg(document.body)}`,
        `theme-color ${document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? 'none'}`,
        `viewport meta ${document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'none'}`,
        `UA ${navigator.userAgent.replace(/Mozilla\/5.0 /, '').slice(0, 90)}`,
      ]);
    };
    read();
    // Polling, not a scroll listener: this is throwaway diagnostics.
    const timer = window.setInterval(read, 400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <div
        id="debug-probe"
        aria-hidden
        style={{
          position: 'fixed',
          visibility: 'hidden',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      />
      <div aria-hidden style={{ position: 'fixed', left: 0, right: 0, top: 0, height: 3, background: '#ff2d2d', zIndex: 9998, pointerEvents: 'none' }} />
      <div
        aria-hidden
        style={{ position: 'fixed', left: 0, right: 0, top: 'env(safe-area-inset-top, 0px)', height: 3, background: '#2d7bff', zIndex: 9998, pointerEvents: 'none' }}
      />
      <pre
        aria-hidden
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          margin: 0,
          padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(0,0,0,0.88)',
          color: '#9dff9d',
          font: '10px/1.35 ui-monospace, monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          pointerEvents: 'none',
        }}
      >
        {rows.join('\n')}
      </pre>
    </>
  );
}
