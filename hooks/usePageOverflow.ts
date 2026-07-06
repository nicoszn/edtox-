import { useRef, useCallback } from 'react';
import type EditorJS from '@editorjs/editorjs';

const PAGE_HEIGHT_PX = 1122; // 297mm @ 96dpi
const PAGE_BREAK_HEIGHT_PX = 64; // must match PageBreakTool CSS exactly

interface OverflowCheckResult {
  needsBreak: boolean;
  insertAfterBlockIndex: number;
}

export default function usePageOverflow(editorRef: React.RefObject<EditorJS | null>) {
  const rafId = useRef<number | null>(null);
  const lastCheckedBlockCount = useRef(0);

  // PHASE A — pure read, runs on rAF, never mutates anything.
  const measureOverflow = useCallback((): OverflowCheckResult | null => {
    const editor = editorRef.current;
    if (!editor) return null;

    const holder = document.querySelector('.codex-editor__redactor');
    if (!holder) return null;

    const blockElements = Array.from(
      holder.querySelectorAll<HTMLElement>('.ce-block')
    );

    // Walk blocks accumulating height, tracking existing page-break
    // markers to know which "page" we're currently filling.
    let runningHeight = 0;
    let currentPageStart = 0;

    for (let i = 0; i < blockElements.length; i++) {
      const el = blockElements[i];
      const isBreak = el.querySelector('[data-page-break]') !== null
        || el.matches('[data-page-break]');

      if (isBreak) {
        // Reset the running total — a new page starts here.
        runningHeight = 0;
        currentPageStart = i + 1;
        continue;
      }

      runningHeight += el.getBoundingClientRect().height;

      if (runningHeight > PAGE_HEIGHT_PX - PAGE_BREAK_HEIGHT_PX) {
        // This block is the one that overflowed. The break must be
        // inserted BEFORE it, not after — it's the block that doesn't fit.
        return { needsBreak: true, insertAfterBlockIndex: i - 1 };
      }
    }

    return { needsBreak: false, insertAfterBlockIndex: -1 };
  }, [editorRef]);

  // PHASE B — write, only called after debounce + only if Phase A said yes.
  const applyBreakIfNeeded = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const result = measureOverflow();
    if (!result || !result.needsBreak) return;

    // Preserve caret BEFORE mutating — this is the actual fix for bug #1.
    const currentBlockIndex = editor.blocks.getCurrentBlockIndex();
    const caretApi = editor.caret;

    await editor.blocks.insert(
      'pageBreak',
      {},
      undefined,
      result.insertAfterBlockIndex + 1,
      false
    );

    // Restore focus to where the user actually was typing.
    // Index shifts by +1 because we just inserted a block above it.
    const restoredIndex =
      currentBlockIndex >= result.insertAfterBlockIndex + 1
        ? currentBlockIndex + 1
        : currentBlockIndex;

    requestAnimationFrame(() => {
      caretApi.setToBlock(restoredIndex, 'end');
    });
  }, [editorRef, measureOverflow]);

  // Debounced trigger — called from onChange, but does NOT measure or
  // mutate synchronously. It schedules a check for the next idle frame,
  // after the current keystroke's render cycle has fully settled.
  const scheduleOverflowCheck = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      // Second rAF: guarantees we're reading post-layout, post-paint state,
      // not mid-reflow state from the same frame as the keystroke.
      rafId.current = requestAnimationFrame(() => {
        applyBreakIfNeeded();
      });
    });
  }, [applyBreakIfNeeded]);

  return { scheduleOverflowCheck };
}
