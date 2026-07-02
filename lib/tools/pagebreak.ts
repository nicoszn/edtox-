import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

/**
 * A page-break marker. Carries no editable data — its only job is to exist
 * at a position in the block array so countPages/splitIntoPages can use it
 * as a delimiter. Rendered as a clear, deliberate divider so it reads as
 * structure rather than an empty block.
 */
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
