import type { BlockToolConstructorOptions } from "@editorjs/editorjs";
import mermaid from "mermaid";
import { SourcePreviewBlock } from "./sourcePreviewBlock";

if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      background: "#fafaf8",
      primaryColor: "#e8e4dc",
      lineColor: "#8b5a3c",
    },
  });
}

export interface MermaidData extends Record<string, unknown> {
  code: string;
}

const DEFAULT_DIAGRAM =
  "graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Success]\n  C -->|No| E[Error]";

export default class MermaidBlock extends SourcePreviewBlock<MermaidData> {
  static get toolbox() {
    return {
      title: "Mermaid Diagram",
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>',
    };
  }

  constructor({ data }: BlockToolConstructorOptions<Partial<MermaidData>>) {
    super({
      // Pre-fill a runnable sample diagram for brand-new blocks, but only
      // treat it as "already authored" (preview mode) if the caller
      // actually supplied code — matches the original tool's behavior.
      initialData: { code: data?.code || DEFAULT_DIAGRAM },
      defaults: { code: DEFAULT_DIAGRAM },
      sourceField: "code",
      placeholder: "Enter Mermaid graph code...",
      emptyMessage: "No diagram source yet.",
      initialMode: data?.code ? "preview" : "edit",
      renderPreview: async (source) => {
        const renderId = `mermaid-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, source);
        return svg;
      },
    });
  }

  protected get blockClass() {
    return "mermaid-block";
  }
}
