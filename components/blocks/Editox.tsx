'use client';

import { useEffect, useRef, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import MermaidBlock from './MermaidBlock';

// Optional: Import additional official tools as needed
// import Header from '@editorjs/header';
// import Paragraph from '@editorjs/paragraph';
// import List from '@editorjs/list';

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export default function Editox({
  data,
  onChange,
  readOnly = false,
  placeholder = 'Start writing...',
}: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Clean up any existing instance
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    const initEditor = async () => {
      const editor = new EditorJS({
        holder: 'editorjs-container',
        placeholder,
        readOnly, // Safe in v2.31.1+ - no warning
        data: data || undefined,
        tools: {
          mermaid: MermaidBlock,
          // Add other tools here:
          // header: Header,
          // paragraph: Paragraph,
          // list: List,
        },
        onChange: async (api, event) => {
          try {
            const savedData = await api.saver.save();
            onChange?.(savedData);
          } catch (err) {
            console.warn('Save error:', err);
          }
        },
        onReady: () => {
          console.log('Editor.js ready');
        },
      });

      editorRef.current = editor;
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [isMounted, data, readOnly, placeholder, onChange]);

  if (!isMounted) {
    return (
      <div
        className="editor-skeleton"
        style={{
          minHeight: '300px',
          background: '#f9f9f9',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        Loading editor...
      </div>
    );
  }

  return <div id="editorjs-container" style={{ width: '100%', minHeight: '300px' }} />;
}
