/**
 * Locks page scrolling while an overlay (seat pop-up, bus details drawer) is open.
 * A counter is used because two overlays can briefly overlap (drawer -> seat pop-up);
 * the page only scrolls again once the last one is gone.
 */
let locks = 0;
let original = '';

export function lockScroll(body: HTMLElement | null | undefined): () => void {
  if (!body) return () => {};
  // Never remember 'hidden' as the page's normal state (it could be a leftover), or it would be restored later.
  if (locks === 0) original = body.style.overflow === 'hidden' ? '' : body.style.overflow;
  locks++;
  body.style.overflow = 'hidden';
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) body.style.overflow = original;
  };
}

/** Safety net: call when no overlay is open. Clears a lock that was left behind by anything unexpected. */
export function releaseStaleScrollLock(body: HTMLElement | null | undefined) {
  if (!body || locks === 0 && body.style.overflow !== 'hidden') return;
  locks = 0;
  body.style.overflow = original;
}
