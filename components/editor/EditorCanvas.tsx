"use client";

import EditorJS from '@editorjs/editorjs';
import { usePageOverflow } from './hooks/usePageOverflow';
import PageBreakTool from './tools/PageBreakTool';
import { useEffect, useRef } from 'react';

export default function EditorCanvas() {
  const editorRef = useRef<EditorJS | null>(null);
  const { scheduleOverflowCheck } = usePageOverflow(editorRef);

  useEffect(() => {
    const editor = new EditorJS({
      holder: 'editor-canvas',
      tools: {
        pageBreak: PageBreakTool,
        // ...your existing block tools
      },
      onChange: () => {
        // CRITICAL: do not measure or mutate here directly.
        // Just schedule the check for the next settled frame.
        scheduleOverflowCheck();
      },
    });

    editorRef.current = editor;
    return () => { editor.destroy?.(); };
  }, [scheduleOverflowCheck]);

  return <div id="editor-canvas" className="editor-canvas" />;
}
