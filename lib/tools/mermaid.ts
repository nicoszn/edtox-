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
  }

  render(): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add('mermaid-block-wrapper');

    const editorSide = document.createElement('textarea');
    editorSide.classList.add('mermaid-block-input');
    editorSide.value = this.data.code;
    editorSide.placeholder = 'Enter Mermaid graph code...';

    const previewSide = document.createElement('div');
    previewSide.classList.add('mermaid-block-preview');
    
    // Fallback unique id string generation mapping
    const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
    previewSide.id = uniqueId;

    // Execution parser runner
    const renderDiagram = async (codeStr: string) => {
      if (!codeStr.trim()) return;
      try {
        previewSide.removeAttribute('data-processed');
        const { svg } = await mermaid.render(`${uniqueId}-svg`, codeStr);
        previewSide.innerHTML = svg;
      } catch (err) {
        // Clear broken syntax configurations from view softly
        previewSide.innerHTML = `<span class="text-danger text-xs font-mono">Invalid Mermaid Syntax</span>`;
      }
    };

    // Reactively re-render graphics on user typing events
    editorSide.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.code = target.value;
      renderDiagram(target.value);
    });

    container.appendChild(editorSide);
    container.appendChild(previewSide);
    this.wrapper = container;

    // Initial canvas paint execution cycle
    setTimeout(() => renderDiagram(this.data.code), 50);

    return container;
  }

  save(blockContent: HTMLDivElement) {
    return {
      code: this.data.code
    };
  }
}
