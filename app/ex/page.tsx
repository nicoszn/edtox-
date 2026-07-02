// app/page.tsx (or app/your-route/page.tsx)
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { OutputData } from '@editorjs/editorjs';

// Dynamically import with SSR disabled
const Editor = dynamic(
  () => import('@/components/blocks/Editox'),
  {
    ssr: false,
    loading: () => <div className="editor-skeleton">Loading editor...</div>,
  }
);

// Import styles
//import '@/components/editor/editor.css';

export default function Ex() {
  const [editorData, setEditorData] = useState<OutputData | undefined>(undefined);

  const handleChange = async (data: OutputData) => {
    setEditorData(data);
    console.log('Editor content:', data);
  };

  return (
    <main className="min-h-screen" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1>Editor.js with Mermaid</h1>
      <Editor
        data={editorData}
        onChange={handleChange}
        placeholder="Start writing..."
        readOnly={false}
      />
      <button
        onClick={() => console.log('Content:', editorData)}
        style={{ marginTop: '20px', padding: '8px 16px' }}
      >
        Log Content
      </button>
    </main>
  );
}
