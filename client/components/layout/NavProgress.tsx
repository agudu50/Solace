'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Slim top progress bar that starts the instant an internal link is clicked
 * and completes when the new route has rendered. Gives immediate feedback
 * while a page is fetched (or, in dev, compiled).
 *
 * Programmatic navigations can opt in with:
 *   window.dispatchEvent(new Event('solace:navigate'))
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval>>();
  const safety = useRef<ReturnType<typeof setTimeout>>();

  const start = () => {
    clearInterval(trickle.current);
    clearTimeout(safety.current);
    setState('loading');
    setProgress(12);
    // Ease toward 90% while waiting; never reaches 100% on its own.
    trickle.current = setInterval(() => setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p)), 180);
    // Never leave a stuck bar if navigation is cancelled or fails.
    safety.current = setTimeout(finish, 12000);
  };

  const finish = () => {
    clearInterval(trickle.current);
    clearTimeout(safety.current);
    setProgress(100);
    setState('done');
  };

  // Route changed: the new page has rendered.
  useEffect(() => {
    if (state === 'loading') finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // Fade out after completing.
  useEffect(() => {
    if (state !== 'done') return;
    const id = setTimeout(() => {
      setState('idle');
      setProgress(0);
    }, 350);
    return () => clearTimeout(id);
  }, [state]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same page (or only the #hash differs): nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    const onProgrammatic = () => start();
    document.addEventListener('click', onClick, true);
    window.addEventListener('solace:navigate', onProgrammatic);
    window.addEventListener('popstate', onProgrammatic);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('solace:navigate', onProgrammatic);
      window.removeEventListener('popstate', onProgrammatic);
      clearInterval(trickle.current);
      clearTimeout(safety.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-0.5"
      style={{ opacity: state === 'idle' ? 0 : 1, transition: state === 'done' ? 'opacity 300ms ease 150ms' : 'none' }}
    >
      <div
        className="h-full bg-accent shadow-[0_0_10px_var(--e-global-color-accent)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 200ms cubic-bezier(0.165, 0.84, 0.44, 1)',
        }}
      />
    </div>
  );
}

export default function NavProgress() {
  // useSearchParams needs a Suspense boundary so static pages still prerender.
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
