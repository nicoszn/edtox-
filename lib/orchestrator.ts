import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { EDITOR_TOOLS } from "@/lib/tools";

interface OrchestratorOptions {
  holderId: string;
  initialData: OutputData;
  onChange: (data: OutputData) => void;
  placeholder?: string;
}

/**
 * Owns exactly one Editor.js instance for the lifetime of the editor screen.
 * Mirrors the orchestrator pattern used elsewhere: a single class responsible
 * for init, teardown, and save, so the React component never touches the
 * Editor.js instance directly.
 */
export class EditorOrchestrator {
  private editor: EditorJS | null = null;
  private destroyed = false;

  constructor(private options: OrchestratorOptions) {}

  async init(): Promise<void> {
    if (this.editor) return;
    this.editor = new EditorJS({
      holder: this.options.holderId,
      tools: EDITOR_TOOLS,
      data: this.options.initialData,
      placeholder: this.options.placeholder ?? "Start writing…",
      autofocus: false,
      onChange: async () => {
        if (this.destroyed || !this.editor) return;
        const data = await this.editor.save();
        this.options.onChange(data);
      },
    });
    await this.editor.isReady;
  }

  async save(): Promise<OutputData | null> {
    if (!this.editor) return null;
    return this.editor.save();
  }

  destroy(): void {
    this.destroyed = true;
    if (this.editor && typeof this.editor.destroy === "function") {
      this.editor.destroy();
    }
    this.editor = null;
  }
}
