"use client";

import { useEffect, useRef } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { EditorOrchestrator } from "@/lib/orchestrator";
export default function EditorCanvas({
  holderId,
  documentId,
  initialData,
  onChange,
}: {
  holderId: string;
  documentId: string;
  initialData: OutputData;
  onChange: (data: OutputData) => void;
}) {
  const orchestratorRef = useRef<EditorOrchestrator | null>(null);
  const initialDataRef = useRef(initialData);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const orchestrator = new EditorOrchestrator({
      holderId,
      documentId,
      initialData: initialDataRef.current,
      onChange: (data) => onChangeRef.current(data),
      placeholder: "Start writing…",
    });
    orchestratorRef.current = orchestrator;
    orchestrator.init();

    return () => {
      orchestrator.destroy();
      orchestratorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holderId, documentId]);

  return (
    <div
      id={holderId}
      className="min-h-[500px] h-full w-full text-left indent-2 px-4 pt-6 pb-32 sm:px-6 sm:pt-8 max-w-3xl mx-auto prose print:px-0 print:pb-0 print:max-w-none"
    />
  );
}
