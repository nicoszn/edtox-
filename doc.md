# Editor.js A4 Pagination — Architecture & Implementation

## 1. Core principle: separate "measure" from "mutate"

Never call `blocks.insert()` synchronously inside the function that measures
height. Use a two-phase loop:

  PHASE A (read)  — runs on a debounced rAF loop, only ever reads the DOM.
  PHASE B (write) — runs only after PHASE A decides a break is needed,
                     and only after the user has paused typing.

This single separation eliminates almost the entire class of cursor-jump
bugs, because you're never mutating blocks while Editor.js's redactor is
mid-render for the active keystroke.

## 2. PageBreak block: make it structural, not dummy

Your current PageBreak block is "dummy" because it's probably just a static
tool with no participation in layout. Fix: give it a `render()` that
outputs a real DOM element with a fixed, known height (e.g. exactly the
page-margin gap), and tag it with a custom attribute so the measurement
pass can find every page boundary in O(1) instead of walking generic divs.

\`\`\`typescript
// tools/PageBreakTool.ts
import type { BlockTool, BlockToolConstructorOptions, API } from '@editorjs/editorjs';

export default class PageBreakTool implements BlockTool {
  static get isReadOnlySupported() { return true; }
  static get toolbox() {
    return { title: 'Page Break', icon: '<svg>...</svg>' };
  }

  private api: API;
  private wrapper: HTMLDivElement;

  constructor({ api }: BlockToolConstructorOptions) {
    this.api = api;
    this.wrapper = document.createElement('div');
  }

  render(): HTMLElement {
    this.wrapper.classList.add('page-break-block');
    this.wrapper.setAttribute('data-page-break', 'true');
    this.wrapper.contentEditable = 'false';
    // Visual gap representing the bottom margin of the page above
    // and the top margin of the page below.
    this.wrapper.innerHTML = `<div class="page-break-marker" aria-hidden="true"></div>`;
    return this.wrapper;
  }

  save() {
    return {}; // structural marker, no content payload needed
  }

  static get sanitize() {
    return {};
  }
}
\`\`\`

\`\`\`css
/* page-break.css */
.page-break-block {
  /* This height is the actual "gap" rendered between pages on screen.
     It must be a KNOWN, FIXED constant so measurement math stays exact. */
  height: 64px;
  position: relative;
  pointer-events: none;
  user-select: none;
}

.page-break-marker {
  position: absolute;
  top: 32px;
  left: -9999px; /* visually hidden in normal flow, shown in print preview mode */
  width: 1px;
}

/* Print-mode: this is where page-break-after actually does something */
@media print {
  .page-break-block {
    break-after: page;
    height: 0;
  }
}
\`\`\`

The key fix here vs. your "dummy block": it has a real, constant pixel
height that the overflow algorithm can subtract cleanly, and it's queryable
via `data-page-break="true"` so you never need to walk the whole block tree
to find existing breaks — `querySelectorAll('[data-page-break]')` gives you
every boundary already placed.

## 3. The screen-pagination illusion (fixing bug #2 directly)

On screen, you cannot literally split one continuous Editor.js redactor
into separate scrollable page boxes without breaking text flow — that's
the same wall you already hit. The trick production editors use (Google
Docs, Word Online) is **visual segmentation via background, not DOM
slicing**: the editor is one continuous column, but it's rendered on top
of a repeating CSS background that *looks* like discrete A4 sheets, and
each PageBreakBlock pushes enough margin to align the next block with the
top of the next "sheet" in that illusion.

\`\`\`css
.editor-canvas {
  --page-height: 1122px;       /* A4 at 96dpi */
  --page-gap: 32px;            /* visual gap between sheets */
  width: 794px;                /* A4 width at 96dpi */
  margin: 0 auto;
  background-image: repeating-linear-gradient(
    to bottom,
    #ffffff 0,
    #ffffff calc(var(--page-height)),
    #e5e5e5 calc(var(--page-height)),
    #e5e5e5 calc(var(--page-height) + var(--page-gap))
  );
  background-attachment: local;
}
\`\`\`

This `repeating-linear-gradient` is what actually produces the "stack of
A4 sheets" look you're after — it's a background pattern that repeats
every `(page-height + page-gap)` pixels, scrolling with the content via
`background-attachment: local`. The PageBreakBlock's job becomes much
simpler: it doesn't create the page illusion, it just needs to land its
top edge exactly on a `page-height` boundary so the white/gray transition
lines up with where the text actually breaks. That's a measurement
problem, solved in step 4.

## 4. The overflow algorithm — measure, don't react

\`\`\`typescript
// hooks/usePageOverflow.ts
import { useRef, useCallback } from 'react';
import type EditorJS from '@editorjs/editorjs';

const PAGE_HEIGHT_PX = 1122; // 297mm @ 96dpi
const PAGE_BREAK_HEIGHT_PX = 64; // must match PageBreakTool CSS exactly

interface OverflowCheckResult {
  needsBreak: boolean;
  insertAfterBlockIndex: number;
}

export function usePageOverflow(editorRef: React.RefObject<EditorJS | null>) {
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
\`\`\`

## 5. Wiring it into Editor.js's onChange

\`\`\`typescript
// EditorCanvas.tsx
import EditorJS from '@editorjs/editorjs';
import { usePageOverflow } from './hooks/usePageOverflow';
import PageBreakTool from './tools/PageBreakTool';
import { useEffect, useRef } from 'react';

export function EditorCanvas() {
  const editorRef = useRef<EditorJS | null>(null);
  const { scheduleOverflowCheck } = usePageOverflow(editorRef);

  useEffect(() => {
    const editor = new EditorJS({
      holder: 'editor-canvas',
      tools: {
        pageBreak: PageBreakTool,
        // ...your existing block tools
      },
      onChange: () => {
        // CRITICAL: do not measure or mutate here directly.
        // Just schedule the check for the next settled frame.
        scheduleOverflowCheck();
      },
    });

    editorRef.current = editor;
    return () => { editor.destroy?.(); };
  }, [scheduleOverflowCheck]);

  return <div id="editor-canvas" className="editor-canvas" />;
}
\`\`\`

## 6. Why this kills bug #1 specifically

Three things had to change simultaneously, not just one:

1. **Double rAF instead of synchronous onChange** — guarantees the DOM has
   fully settled (layout + paint) before you read heights, and guarantees
   you're never inserting a block in the same tick as the keystroke that
   triggered the check.
2. **Explicit caret save/restore around the insert** — Editor.js does not
   promise caret stability across `blocks.insert()`. You have to manage it
   yourself via `editor.caret.setToBlock()`.
3. **Insert at a computed index, never at the end or at 0** — a generic
   `blocks.insert('pageBreak')` with no index defaults to inserting at the
   *current* block or appending, which is almost certainly why you're
   seeing a jump to the beginning: a default-index insert combined with a
   stale `currentBlockIndex` reference.

## 7. Known remaining edge case (be aware of this)

Deleting content that causes a *previous* overflow to resolve (page 2
collapses back into page 1) requires the same measurement pass to detect
*under*-fill and remove a PageBreakBlock. The algorithm above only grows
pages forward. If you want pages to also shrink back when text is deleted,
the same `measureOverflow` function needs a second branch: if a page's
content height is far below `PAGE_HEIGHT_PX` AND the next page-break
immediately follows, remove that break via `blocks.delete()` using the
same save/restore caret pattern.
