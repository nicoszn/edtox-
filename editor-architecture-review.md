# Scribe/Edtox — Architecture Review

## TL;DR

The core complaint is correct: **EditorJS's imperative, class-per-block model fundamentally fights React's declarative one**, and nearly every "clever" file in this codebase (`usePageOverflow`, `scrollguard`, the paste interceptor in `orchestrator`, `rehydrate`) exists only to paper over that mismatch. None of these are individually unreasonable engineering — each is a real workaround for a real EditorJS limitation — but stacked together they've made the app fragile, hard to reason about, and dependent on constants staying in sync across files that have no compile-time link to each other.

I also found **two concrete bugs**, not just architectural smell, detailed below.

---

## 1. Confirmed bugs

### 1a. Page-break tool name mismatch
- `lib/tools/index.ts` registers the tool as `pagebreak: { class: PageBreak }`.
- `pages.ts`'s `PAGEBREAK_TYPE = "pagebreak"` agrees with that.
- But `usePageOverflow.ts` inserts it as `editor.blocks.insert('pageBreak', ...)` — **camelCase**, which doesn't match the registered tool name.

EditorJS resolves tools by exact string key, so this insert will either silently fail or throw at runtime, meaning **automatic page breaks likely never actually get inserted** in production, only ones a user drags in manually from the toolbox (which uses the correctly-registered name internally).

### 1b. The pagination math is measuring a CSS class that isn't applied
- `usePageOverflow.ts` hardcodes `PAGE_BREAK_HEIGHT_PX = 64` with a comment: *"must match PageBreakTool CSS exactly."*
- `globals.css` does define `.page-break-block { height: 64px; }` — but `pagebreak.ts`'s `render()` actually sets `wrapper.classList.add("pagebreak-block")` (no dash). The 64px rule never applies to the real element.
- The actual rendered height of a page-break block is whatever `.pagebreak-block`'s children (`.pagebreak-line`, `.pagebreak-label`) happen to lay out to — not a controlled, known constant.

So the overflow calculation subtracts a magic number that has no real relationship to the DOM it's measuring. This is the kind of bug that "mostly works" in one browser/zoom level and drifts everywhere else — a classic symptom of syncing a layout constant across JS and CSS by convention instead of by a single source of truth.

---

## 2. File-by-file notes

**`usePageOverflow.ts`** — Double-rAF debounce + full `.ce-block` DOM walk on every settle, reading `getBoundingClientRect().height` for every block to reconstruct "which page are we on." Works, but: it re-measures *all* blocks from scratch every time instead of incrementally, it has no bounds-check on `insertAfterBlockIndex - 1` going negative, and (per bug 1a/1b above) its two governing constants are silently desynced from reality.

**`orchestrator.ts`** — The paste handler is registered with `capture: true` specifically to "win the race" against EditorJS's internal paste module. This is an assumption about listener registration order between two independent libraries that has no contract behind it — it works today because of *how EditorJS happens to attach its own listener*, not because of anything guaranteed. If EditorJS ever changes its internal paste wiring, this silently breaks.

**`markdownpaste.ts`** — A hand-rolled markdown→block parser (regex-based inline formatting, manual list/table/quote/math/mermaid parsing) built from scratch, while `markdown-it` is *already a project dependency* and unused here. Hand-written regex markdown parsing is exactly the kind of thing that quietly breaks on nested emphasis, escaped characters, or malformed tables.

**`scrollguard.ts`** — A justified workaround for a real upstream EditorJS bug, but the implementation is broad: it snapshots scroll position on *any* `mousedown`/`touchstart`/`focusin` inside the whole editor, then fights to re-assert that position for 6 animation frames. If a user clicks into the editor and then intentionally scrolls within that ~6-frame window, the guard will yank them back. It's solving a real problem with a blunt instrument.

**`mathblock.ts` vs `mermaid.ts`** — Structurally near-identical classes (toolbar, toggle button, textarea, preview pane, edit/preview mode machinery) duplicated wholesale rather than sharing a base. `mathblock.ts` even reuses the literal CSS class `mermaid-block` with a comment admitting it's "reusing identical structural styling" — a naming leak that will confuse anyone styling one and accidentally affecting the other.

**`lib/tools/index.ts`** — Registers **two different math implementations** at once: `editorjs-mathcyou`'s `MathBlockTool` as `mathBlock`, and the custom `MathBlock` class as `math`. That's two math tools with overlapping purpose sitting in the toolbox side by side — almost certainly not intentional, and confusing for anyone maintaining this later.

**`wordcount.ts` / `pages.ts`** — These are the cleanest files in the set. `wordcount.ts` delegates to a shared `toExportNodes` normalizer rather than re-deriving block semantics itself, which is the right pattern — more of the codebase should follow this instead of each feature (overflow, export, word count) re-walking `data.blocks` with its own logic.

**`page.tsx` (home page)** — Worth noting: it already offers **"+ New (Editor.js)" and "+ New (Slate)"** as two separate creation paths. That strongly suggests a Slate-based rewrite is already underway or was already explored. That's relevant to the refactor recommendation below — you may not need to *start* a migration, just finish one.

---

## 3. Refactor direction

### Quick, low-risk fixes (do these regardless of the bigger question)
1. Fix the `pageBreak` → `pagebreak` string mismatch (bug 1a).
2. Make `PAGE_BREAK_HEIGHT_PX` and the CSS height rule share one source of truth — either export the constant from a shared file and reference it in a CSS custom property, or better, **measure the actual rendered page-break element's height at runtime** instead of hardcoding it. Also fix the `.page-break-block` vs `.pagebreak-block` class name drift.
3. Remove one of the two math tools (`mathBlock` vs `math`) — pick one implementation.
4. Extract a shared `ToggleableSourceBlock` base (toolbar + toggle + textarea + preview scaffold) that `MermaidBlock` and `MathBlock` both extend, passing in only the render/validate function that differs. Cuts ~60% of both files.
5. Swap `markdownpaste.ts`'s hand-rolled inline parser for `markdown-it` (already installed, unused) with a small block-mapping layer on top — keeps your custom block types (mermaid/math/pagebreak fences) as a thin plugin instead of a full parser rewrite.

### The bigger question: is EditorJS the right foundation?
Given that a Slate path already exists in the app, this is worth stating plainly: **every one of the four "escape hatch" files exists specifically because EditorJS keeps its state in the DOM and its own internal instance, not in React state.** That's not a bug you can refactor away one file at a time — it's the trade-off of picking EditorJS. Options, roughly in order of effort:

- **Stay on EditorJS, harden the escape hatches** — the fixes above, plus centralizing all "walk the blocks" logic (word count, pagination, export) behind one shared traversal module so page-count, word-count, and PDF export can never silently disagree with each other the way the page-break height already has.
- **Finish the Slate migration** — Slate's model lives in React state by design, which would eliminate `scrollguard.ts`, the imperative paste interceptor, and most of `usePageOverflow.ts`'s DOM-walking outright (pagination becomes a matter of computing where breaks fall over a React-owned document tree, not observing rendered DOM after the fact). This is the larger lift, but it directly removes the category of bug you hit in section 1 — a Slate-based doc can't have its block-type name drift from the code that inserts it, because there's no string-keyed tool registry to drift from.
- **Move to a maintained React-native rich-text engine** (Tiptap/ProseMirror) if Slate's own tooling gaps (tables, more exotic blocks) become the blocker — same core benefit (state lives in React/the editor's own model, not scraped from the DOM), more batteries included for the custom blocks you already have (math, mermaid, citations, page breaks).

Given the app already ships a "Slate" creation path as a first-class option next to "Editor.js," I'd treat this less as "should we migrate" and more as "which of these two paths do we finish and which do we retire" — running both indefinitely means every future feature (page breaks, math, mermaid) has to be built twice.
