/**
 * Editor.js has a long-standing, still-reproducing bug where opening the
 * block toolbox or a tool's popover resets window scroll to the top
 * (codex-team/editor.js #2162). It's triggered internally by focus/measure
 * logic we don't control, so the fix is defensive: snapshot scroll position
 * on every interaction that could open a popover, then re-assert it across
 * the next couple of frames (the reset happens asynchronously, often after
 * a layout pass, so a single rAF isn't always enough).
 */
export function installScrollJumpGuard(container: HTMLElement): () => void {
  let lockedY: number | null = null;
  let frames = 0;

  const restore = () => {
    if (lockedY === null) return;
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
    requestAnimationFrame(restore);
  };

  container.addEventListener("mousedown", snapshot, true);
  container.addEventListener("touchstart", snapshot, true);
  container.addEventListener("focusin", snapshot, true);

  return () => {
    container.removeEventListener("mousedown", snapshot, true);
    container.removeEventListener("touchstart", snapshot, true);
    container.removeEventListener("focusin", snapshot, true);
  };
}
