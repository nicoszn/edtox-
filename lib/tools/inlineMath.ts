import type { API, InlineTool, SanitizerConfig } from "@editorjs/editorjs";
import katex from "katex";

const CLASS = "inline-math";

/**
 * Replaces editorjs-mathcyou's InlineMathTool.
 *
 * Root cause of "inline math doesn't save": EditorJS strips any markup an
 * inline tool inserts unless that tool declares a `sanitize` static getter
 * (see https://editorjs.io/inline-tool-sanitizing/). The third-party tool
 * doesn't reliably do this, so the <span> it inserts survives in the DOM
 * until the next editor.save(), at which point the sanitizer removes it.
 * This tool declares that rule explicitly, and keeps the raw LaTeX source
 * in a data attribute so the span can be un-rendered back to editable text.
 */
export default class InlineMathTool implements InlineTool {
  static get isInline() {
    return true;
  }

  static get title() {
    return "Math";
  }

  // The fix: tell EditorJS's sanitizer exactly what this tool is allowed
  // to leave behind. Scoped to span so it doesn't loosen sanitization for
  // anything else in the block.
  static get sanitize(): SanitizerConfig {
    return {
      span: {
        class: true,
        style: true,
        "aria-hidden": true,
        "data-latex": true,
        contenteditable: true,
      },
    };
  }

  private api: API;
  private button: HTMLButtonElement | null = null;

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><text x="0" y="12" font-size="13" font-family="serif" fill="currentColor">∑</text></svg>';
    return this.button;
  }

  surround(range: Range): void {
    const existing = this.findMathAncestor(range);
    if (existing) {
      this.unwrap(existing);
      return;
    }

    const latex = range.toString().trim();
    if (!latex) return;

    const span = buildMathSpan(latex);
    range.deleteContents();
    range.insertNode(span);

    const sel = window.getSelection();
    if (sel) {
      const newRange = document.createRange();
      newRange.setStartAfter(span);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
  }

  checkState(selection: Selection): boolean {
    const anchor = selection.anchorNode;
    const el = anchor
      ? anchor.nodeType === Node.ELEMENT_NODE
        ? (anchor as Element)
        : anchor.parentElement
      : null;
    const mathEl = el?.closest(`.${CLASS}`) ?? null;

    this.button?.classList.toggle(
      this.api.styles.inlineToolButtonActive,
      !!mathEl
    );
    return !!mathEl;
  }

  private findMathAncestor(range: Range): HTMLElement | null {
    const node = range.commonAncestorContainer;
    const el =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
    return (el?.closest(`.${CLASS}`) as HTMLElement | null) ?? null;
  }

  private unwrap(mathEl: HTMLElement): void {
    const latex = mathEl.dataset.latex ?? mathEl.textContent ?? "";
    mathEl.replaceWith(document.createTextNode(latex));
  }
}

/** Shared with markdownpaste.ts so both entry points produce identical markup. */
export function buildMathSpan(latex: string): HTMLElement {
  const span = document.createElement("span");
  span.classList.add(CLASS);
  span.contentEditable = "false";
  span.dataset.latex = latex;
  try {
    span.innerHTML = katex.renderToString(latex, {
      throwOnError: false,
      output: "html",
    });
  } catch {
    span.textContent = latex;
  }
  return span;
}

export function mathSpanToHtml(latex: string): string {
  const clean = latex.trim();
  let rendered: string;
  try {
    rendered = katex.renderToString(clean, { throwOnError: false, output: "html" });
  } catch {
    rendered = clean;
  }
  const escapedLatex = clean.replace(/"/g, "&quot;");
  return `<span class="${CLASS}" contenteditable="false" data-latex="${escapedLatex}">${rendered}</span>`;
}
