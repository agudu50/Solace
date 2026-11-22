'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendHeartbeat } from '../../utils/opsService';

const BEAT_MS = 30_000;

/** Random per-tab id (not a tracking cookie: cleared when the tab closes). */
function visitorId() {
  try {
    let id = sessionStorage.getItem('solace_visitor_id');
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem('solace_visitor_id', id);
    }
    return id;
  } catch {
    return '';
  }
}

/**
 * Lets the admin console show how many people have Solace open right now and
 * on which page. Sends the current path every 30s and on navigation.
 */
export default function PresenceBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    const id = visitorId();
    if (!id) return;
    const beat = () => sendHeartbeat(id, pathname || '/');
    beat();
    const timer = setInterval(beat, BEAT_MS);
    const onVisible = () => document.visibilityState === 'visible' && beat();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pathname]);

  return null;
}
