"use client";

import { useEffect, useRef } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { EditorOrchestrator } from "@/lib/orchestrator";

export default function EditorCanvas({
  holderId,
  initialData,
  onChange,
}: {
  holderId: string;
  initialData: OutputData;
  onChange: (data: OutputData) => void;
}) {
  const orchestratorRef = useRef<EditorOrchestrator | null>(null);
  // initialData/onChange are read once at mount; the orchestrator owns the
  // instance after that, so we intentionally don't re-run this effect on
  // every change (that would tear down and reinit the editor on each save).
  const initialDataRef = useRef(initialData);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const orchestrator = new EditorOrchestrator({
      holderId,
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
  }, [holderId]);

  return <div id={holderId} className="px-4 pt-6 pb-32 sm:px-6 sm:pt-8 max-w-3xl mx-auto" />;
}
