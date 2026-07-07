import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
import { PAGE_BREAK_HEIGHT_PX } from "@/lib/pageLayout";

/**
 * A page-break marker. Carries no editable data — its only job is to exist
 * at a position in the block array so countPages/splitIntoPages can use it
 * as a delimiter. Rendered as a clear, deliberate divider so it reads as
 * structure rather than an empty block.
 *
 * Height is set inline from the shared PAGE_BREAK_HEIGHT_PX constant
 * (rather than relying on a CSS class matching a JS constant by
 * convention) so pagination math in usePageOverflow.ts is always measuring
 * against the value it assumes.
 */
export default class PageBreak implements BlockTool {
  static get toolbox() {
    return {
      title: "Page break",
      icon:
        '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M1 4h15M1 11h15M5 1v3M5 11v3M12 1v3M12 11v3" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2" fill="none"/></svg>',
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  constructor(_opts: BlockToolConstructorOptions) {
    // No persisted data; the block's mere presence is the signal.
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("pagebreak-block");
    wrapper.style.height = `${PAGE_BREAK_HEIGHT_PX}px`;
    wrapper.contentEditable = "false";
    // Marks this element for usePageOverflow's DOM scan without depending
    // on class-name matching CSS.
    wrapper.dataset.pageBreak = "true";

    const line = document.createElement("div");
    line.classList.add("pagebreak-line");

    const label = document.createElement("span");
    label.classList.add("pagebreak-label");
    label.textContent = "Page break";

    wrapper.append(line, label, line.cloneNode());
    return wrapper;
  }

  save(): Record<string, never> {
    return {};
  }
}
