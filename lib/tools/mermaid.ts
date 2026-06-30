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
  private uniqueId: string;

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
    // Generate the ID once in the constructor to keep it persistent across cycles
    this.uniqueId = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
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
    previewSide.id = this.uniqueId;

    // Execution parser runner
    const renderDiagram = async (codeStr: string) => {
      if (!codeStr.trim()) {
        previewSide.innerHTML = '';
        return;
      }
      
      const svgId = `svg-${this.uniqueId}`;
      
      try {
        // Compile the diagram string asynchronously
        const { svg } = await mermaid.render(svgId, codeStr);
        previewSide.innerHTML = svg;
      } catch (err) {
        // Render user-friendly error state
        previewSide.innerHTML = `<span class="text-danger text-xs font-mono" style="color: #dc3545; font-size: 12px; font-family: monospace;">Invalid Mermaid Syntax</span>`;
        
        // CRITICAL: Clean up broken SVG elements injected by Mermaid into document body root
        const brokenElement = document.getElementById(svgId);
        if (brokenElement) {
          brokenElement.remove();
        }
        // Force reset body bindings or bindings appended by older mermaid compilation engines
        const bindElement = document.getElementById(`d${svgId}`);
        if (bindElement) {
          bindElement.remove();
        }
      }
    };

    // Update the internal state string values as the user edits the codebase
    editorSide.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.code = target.value;
    });

    // Auto-renders graphics when the user clicks out or finishes editing text nodes
    editorSide.addEventListener('blur', () => {
      renderDiagram(this.data.code);
    });

    container.appendChild(editorSide);
    container.appendChild(previewSide);
    this.wrapper = container;

    // Initial canvas paint execution cycle once DOM tree settles
    setTimeout(() => renderDiagram(this.data.code), 50);

    return container;
  }

  save(blockContent: HTMLDivElement) {
    return {
      code: this.data.code
    };
  }
}
