/**
 * Editor.js has a long-standing, still-reproducing bug where opening the
 * block toolbox or a tool's popover resets window scroll to the top
 * (codex-team/editor.js #2162). It's triggered internally by focus/measure
 * logic we don't control, so the fix is defensive: snapshot scroll position
 * on every interaction that could open a popover, then re-assert it across
 * the next couple of frames (the reset happens asynchronously, often after
 * a layout pass, so a single rAF isn't always enough).
 *
 * The previous version fought the user unconditionally for 6 frames after
 * any mousedown/touchstart/focusin — including if the user scrolled on
 * purpose during that window, which would get yanked back. This version
 * treats an intentional wheel/touchmove during the guard window as a
 * cancel signal instead of noise.
 */
export function installScrollJumpGuard(container: HTMLElement): () => void {
  let lockedY: number | null = null;
  let frames = 0;
  let cancelled = false;

  const restore = () => {
    if (lockedY === null || cancelled) {
      lockedY = null;
      frames = 0;
      cancelled = false;
      return;
    }
    if (Math.abs(window.scrollY - lockedY) > 2) {
      window.scrollTo({ top: lockedY, behavior: "instant" as ScrollBehavior });
    }
    frames++;
    if (frames < 6) {
      requestAnimationFrame(restore);
    } else {
      lockedY = null;
      frames = 0;
    }
  };

  const snapshot = () => {
    lockedY = window.scrollY;
    frames = 0;
    cancelled = false;
    requestAnimationFrame(restore);
  };

  const cancelGuard = () => {
    cancelled = true;
  };

  container.addEventListener("mousedown", snapshot, true);
  container.addEventListener("touchstart", snapshot, true);
  container.addEventListener("focusin", snapshot, true);
  // A deliberate scroll gesture during the guard window means the user is
  // navigating, not the bug firing — stop overriding them.
  window.addEventListener("wheel", cancelGuard, { passive: true });
  window.addEventListener("touchmove", cancelGuard, { passive: true });

  return () => {
    container.removeEventListener("mousedown", snapshot, true);
    container.removeEventListener("touchstart", snapshot, true);
    container.removeEventListener("focusin", snapshot, true);
    window.removeEventListener("wheel", cancelGuard);
    window.removeEventListener("touchmove", cancelGuard);
  };
}
