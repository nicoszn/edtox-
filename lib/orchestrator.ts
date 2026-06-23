import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { buildEditorTools } from "@/lib/tools";
import { rehydrateAssetUrls } from "@/lib/storage/rehydrate";

interface OrchestratorOptions {
  holderId: string;
  documentId: string;
  initialData: OutputData;
  onChange: (data: OutputData) => void;
  placeholder?: string;
}

export class EditorOrchestrator {
  private editor: EditorJS | null = null;
  private destroyed = false;

  constructor(private options: OrchestratorOptions) {}

  async init(): Promise<void> {
    if (this.editor) return;

    const hydrated = await rehydrateAssetUrls(this.options.initialData);
    if (this.destroyed) return;

    this.editor = new EditorJS({
      holder: this.options.holderId,
      tools: buildEditorTools(this.options.documentId),
      data: hydrated,
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
