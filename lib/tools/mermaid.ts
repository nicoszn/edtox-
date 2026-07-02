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
  private data: { source: string };
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
      source: data.source || 'graph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Success]\n  C -->|No| E[Error]'
    };
    // Default to preview if source exists, otherwise start in edit mode
    this.mode = data.source ? 'preview' : 'edit';
  }

  render(): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add('mermaid-block-wrapper');

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
    editorSide.classList.add('mermaid-block-input');
    editorSide.value = this.data.source;
    editorSide.placeholder = 'Enter Mermaid graph code...';
    editorSide.spellcheck = false;
    container.appendChild(editorSide);

    // ---- Preview container ----
    const previewSide = document.createElement('div');
    previewSide.classList.add('mermaid-block-preview');
    // Stable unique ID for this instance
    const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    previewSide.id = uniqueId;
    container.appendChild(previewSide);

    // ---- Core rendering function (taken directly from the working mermaid.ts.txt) ----
    const renderDiagram = async (codeStr: string) => {
      if (!codeStr.trim()) {
        previewSide.innerHTML = '<p class="mermaid-empty">No diagram source yet.</p>';
        return;
      }
      try {
        // CRITICAL FIX 1: remove the cached "processed" flag
        previewSide.removeAttribute('data-processed');
        // CRITICAL FIX 2: use a fresh ID per render call to avoid "already registered"
        const renderId = `${uniqueId}-svg-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, codeStr);
        previewSide.innerHTML = svg;
      } catch (err) {
        console.warn('Mermaid render error:', err);
        previewSide.innerHTML = `<span class="text-danger text-xs font-mono">Invalid Mermaid Syntax</span>`;
      }
    };

    // ---- Reactively re-render on typing (only when in preview mode) ----
    editorSide.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.source = target.value;
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
        renderDiagram(this.data.source);
      }
    });

    // ---- Initial setup ----
    applyMode();
    // If we start in preview mode, render after DOM is ready
    if (this.mode === 'preview') {
      setTimeout(() => renderDiagram(this.data.source), 50);
    }

    this.wrapper = container;
    return container;
  }

  save(blockContent: HTMLDivElement) {
    return {
      source: this.data.source
    };
  }
}
