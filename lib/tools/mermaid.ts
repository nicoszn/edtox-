import { API, BlockTool, BlockToolData } from '@editorjs/editorjs';
import mermaid from 'mermaid';

// Initialize mermaid configuration parameters cleanly
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      background: '#fafaf8',
      primaryColor: '#e8e4dc',
      lineColor: '#8b5a3c',
    }
  });
}

export default class MermaidBlock implements BlockTool {
  private api: API;
  private data: { code: string };
  private mode: 'edit' | 'preview';
  private wrapper: HTMLDivElement | null = null;

  static get toolbox() {
    return {
      title: 'Mermaid Diagram',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>'
    };
  }

  constructor({ data, api }: { data: BlockToolData; api: API }) {
    this.api = api;
    this.data = {
      code: data.code || 'graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Success]\n  C -->|No| E[Error]'
    };
    // Smart default: preview if source exists, otherwise edit
    this.mode = data.code ? 'preview' : 'edit';
  }

  render(): HTMLDivElement {
    const container = document.createElement('div');
    // ✅ SWAPPED: mermaid-block-wrapper → mermaid-block
    container.classList.add('mermaid-block');

    // ---- Toolbar with toggle button ----
    const toolbar = document.createElement('div');
    toolbar.classList.add('mermaid-toolbar');

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.classList.add('mermaid-toggle');
    toolbar.appendChild(toggleBtn);
    container.appendChild(toolbar);

    // ---- Source editor (textarea) ----
    const editorSide = document.createElement('textarea');
    // ✅ SWAPPED: mermaid-block-input → mermaid-source
    editorSide.classList.add('mermaid-source');
    editorSide.value = this.data.code;
    editorSide.placeholder = 'Enter Mermaid graph code...';
    editorSide.spellcheck = false;
    container.appendChild(editorSide);

    // ---- Preview container ----
    const previewSide = document.createElement('div');
    // ✅ SWAPPED: mermaid-block-preview → mermaid-preview
    previewSide.classList.add('mermaid-preview');
    
   // const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    const uniqueId = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
    previewSide.id = uniqueId;

    // ---- Core render function (stable logic from mermaid.ts 2.txt) ----
    const renderDiagram = async (codeStr: string) => {
      if (!codeStr.trim()) {
        previewSide.innerHTML = '<p class="mermaid-empty">No diagram source yet.</p>';
        return;
      }
      try {
        previewSide.removeAttribute('data-processed');
        const renderId = `${uniqueId}-svg-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, codeStr);
        previewSide.innerHTML = svg;
      } catch (err) {
        console.warn('Mermaid render error:', err);
        // ✅ SWAPPED: text-danger text-xs font-mono → mermaid-error
        previewSide.innerHTML = `<span class="mermaid-error">Invalid Mermaid Syntax</span>`;
      }
    };

    // ---- Live typing updates (only in preview mode) ----
    editorSide.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.code = target.value;
      if (this.mode === 'preview') {
        renderDiagram(target.value);
      }
    });

    // ---- Mode toggle logic ----
    const applyMode = () => {
      const isEdit = this.mode === 'edit';
      editorSide.style.display = isEdit ? 'block' : 'none';
      previewSide.style.display = isEdit ? 'none' : 'block';
      toggleBtn.textContent = isEdit ? 'Preview' : 'Edit source';
    };

    toggleBtn.addEventListener('click', () => {
      this.mode = this.mode === 'edit' ? 'preview' : 'edit';
      applyMode();
      if (this.mode === 'preview') {
        renderDiagram(this.data.code);
      }
    });

    // ---- Initial setup ----
    applyMode();
    if (this.mode === 'preview') {
      setTimeout(() => renderDiagram(this.data.code), 50);
    }

    container.appendChild(editorSide);
    container.appendChild(previewSide);
    this.wrapper = container;

    return container;
  }

  save(blockContent: HTMLDivElement) {
    return {
      code: this.data.code
    };
  }
}
