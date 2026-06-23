import type { BlockTool, BlockToolConstructorOptions, API } from "@editorjs/editorjs";
import type { CitationData } from "@/types/citation";

/**
 * Custom block tool: a structured citation entry (author, year, source).
 * Editor.js has no stock equivalent — this is the school-writing-specific
 * primitive the rest of the toolset doesn't cover.
 */
export default class Citation implements BlockTool {
  private data: CitationData;
  private api: API;
  private wrapper: HTMLElement | null = null;

  static get toolbox() {
    return {
      title: "Citation",
      icon:
        '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h4v4H3.2C3.2 9 4 9.6 5.4 9.6V11C2.8 11 1 9.4 1 6.6V3h1zm8 0h4v4h-2.8c0 2 .8 2.6 2.2 2.6V11c-2.6 0-4.4-1.6-4.4-4.4V3h1z" fill="currentColor"/></svg>',
    };
  }

  constructor({ data, api }: BlockToolConstructorOptions<Partial<CitationData>>) {
    this.api = api;
    this.data = {
      author: data?.author ?? "",
      year: data?.year ?? "",
      source: data?.source ?? "",
    };
  }

  render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("citation-block");

    const row = document.createElement("div");
    row.classList.add("citation-row");

    const author = this.makeField("Author", this.data.author, "citation-author");
    const year = this.makeField("Year", this.data.year, "citation-year");
    row.append(author, year);

    const source = this.makeField("Source / publication", this.data.source, "citation-source");

    wrapper.append(row, source);
    this.wrapper = wrapper;
    return wrapper;
  }

  private makeField(placeholder: string, value: string, cls: string): HTMLElement {
    const field = document.createElement("div");
    field.classList.add("citation-field", cls);
    field.contentEditable = "true";
    field.dataset.placeholder = placeholder;
    field.textContent = value;
    field.addEventListener("input", () => {
      const key = cls.replace("citation-", "") as keyof CitationData;
      if (key === "author" || key === "year" || key === "source") {
        this.data[key] = field.textContent ?? "";
      }
    });
    return field;
  }

  save(): CitationData {
    return this.data;
  }

  static get sanitize() {
    return { author: {}, year: {}, source: {} };
  }
}
