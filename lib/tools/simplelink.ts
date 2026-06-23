import type { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

export interface SimpleLinkData {
  url: string;
  label: string;
}

/**
 * @editorjs/link requires a server endpoint to fetch page metadata (title/
 * description/preview image) — there is no documented no-backend fallback,
 * so it isn't usable in a local-only app. This tool covers the same intent
 * (drop a link, optionally with a friendly label) without any network call.
 */
export default class SimpleLink implements BlockTool {
  private data: SimpleLinkData;

  static get toolbox() {
    return {
      title: "Link",
      icon:
        '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M6 8.5a3 3 0 0 0 4.24.27l2-2a3 3 0 0 0-4.24-4.24l-1 1M9 6.5a3 3 0 0 0-4.24-.27l-2 2a3 3 0 0 0 4.24 4.24l1-1" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
    };
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<SimpleLinkData>>) {
    this.data = { url: data?.url ?? "", label: data?.label ?? "" };
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("simple-link-block");

    const urlField = document.createElement("div");
    urlField.classList.add("simple-link-field", "simple-link-url");
    urlField.contentEditable = "true";
    urlField.dataset.placeholder = "https://…";
    urlField.textContent = this.data.url;
    urlField.addEventListener("input", () => {
      this.data.url = urlField.textContent ?? "";
    });

    const labelField = document.createElement("div");
    labelField.classList.add("simple-link-field", "simple-link-label");
    labelField.contentEditable = "true";
    labelField.dataset.placeholder = "Link text (optional)";
    labelField.textContent = this.data.label;
    labelField.addEventListener("input", () => {
      this.data.label = labelField.textContent ?? "";
    });

    wrapper.append(urlField, labelField);
    return wrapper;
  }

  save(): SimpleLinkData {
    return this.data;
  }

  static get sanitize() {
    return { url: {}, label: {} };
  }
}
