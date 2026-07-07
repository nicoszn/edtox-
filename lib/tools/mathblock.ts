import type { BlockToolConstructorOptions } from "@editorjs/editorjs";
import katex from "katex";
import "katex/dist/katex.min.css";
import { SourcePreviewBlock } from "./sourcePreviewBlock";

export interface MathData extends Record<string, unknown> {
  latex: string;
}

export default class MathBlock extends SourcePreviewBlock<MathData> {
  static get toolbox() {
    return {
      title: "Math",
      icon: '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><text x="0" y="12" font-size="13" font-family="serif" fill="currentColor">∑</text></svg>',
    };
  }

  static get sanitize() {
    return { latex: false };
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MathData>>) {
    super({
      initialData: { latex: data?.latex ?? "" },
      defaults: { latex: "" },
      sourceField: "latex",
      placeholder: "E = mc^2",
      emptyMessage: "No formula yet.",
      initialMode: data?.latex ? "preview" : "edit",
      renderPreview: (source) =>
        katex.renderToString(source, {
          throwOnError: false,
          displayMode: true,
          output: "html",
        }),
    });
  }

  protected get blockClass() {
    return "math-block";
  }
}
