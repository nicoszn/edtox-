import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { buildEditorTools } from "@/lib/tools";
import { rehydrateAssetUrls } from "@/lib/storage/rehydrate";
import { installScrollJumpGuard } from "@/lib/scrollguard";
import { looksLikeMarkdown, markdownToBlocks } from "@/lib/markdownpaste";

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
  private removeScrollGuard: (() => void) | null = null;
  private holder: HTMLElement | null = null;
  private onPaste = (event: ClipboardEvent) => this.handlePaste(event);

  constructor(private options: OrchestratorOptions) {}

  async init(): Promise<void> {
    if (this.editor) return;

    const hydrated = await rehydrateAssetUrls(this.options.initialData);
    if (this.destroyed) return;

    this.editor = new EditorJS({
      holder: this.options.holderId,
      tools: buildEditorTools(this.options.documentId),
      data: hydrated,
      defaultBlock: "paragraph",
      placeholder: this.options.placeholder ?? "Start writing…",
      autofocus: false,
      onChange: async () => {
        if (this.destroyed || !this.editor) return;
        const data = await this.editor.save();
        this.options.onChange(data);
      },
    });
    await this.editor.isReady;

    this.holder = document.getElementById(this.options.holderId);
    if (this.holder) {
      this.removeScrollGuard = installScrollJumpGuard(this.holder);
      // capture: true so we see the clipboard event before Editor.js's own
      // paste module does — its built-in handling only auto-converts a
      // single-line pasted pattern into one block, which is wrong for a
      // multi-paragraph markdown document.
      this.holder.addEventListener("paste", this.onPaste, true);
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (!looksLikeMarkdown(text) || !this.editor) return;

    event.preventDefault();
    event.stopPropagation();

    const blocks = markdownToBlocks(text);
    if (!blocks.length) return;

    const currentIndex = this.editor.blocks.getCurrentBlockIndex();
    const currentBlock = currentIndex >= 0 ? this.editor.blocks.getBlockByIndex(currentIndex) : null;
    const wasEmpty = currentBlock?.isEmpty ?? false;
    const insertAt = currentIndex >= 0 ? currentIndex + 1 : this.editor.blocks.getBlocksCount();

    blocks.forEach((b, offset) => {
      this.editor!.blocks.insert(b.type, b.data, undefined, insertAt + offset, false);
    });

    // If the cursor was sitting in an empty default block, remove it now —
    // its index hasn't shifted since it sat *before* every block we just
    // inserted at insertAt.
    if (wasEmpty && currentIndex >= 0) {
      this.editor.blocks.delete(currentIndex);
    }
  }

  async save(): Promise<OutputData | null> {
    if (!this.editor) return null;
    return this.editor.save();
  }

  destroy(): void {
    this.destroyed = true;
    this.removeScrollGuard?.();
    this.removeScrollGuard = null;
    this.holder?.removeEventListener("paste", this.onPaste, true);
    this.holder = null;
    if (this.editor && typeof this.editor.destroy === "function") {
      this.editor.destroy();
    }
    this.editor = null;
  }
}
