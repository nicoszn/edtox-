"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { OutputData } from "@editorjs/editorjs";
import { getDocument, saveDocument } from "@/lib/storage/documents";
import { countWords } from "@/lib/wordcount";
import { countPages } from "@/lib/pages";
import { EMPTY_CONTENT } from "@/types/document";
import TitleBar from "@/components/TitleBar";
import EditorCanvas from "@/components/EditorCanvas";
import Toolbar from "@/components/Toolbar";

const SAVE_DEBOUNCE_MS = 600;

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [initialData, setInitialData] = useState<OutputData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const latestContentRef = useRef<OutputData>(EMPTY_CONTENT);
  const latestTitleRef = useRef("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDocument(id).then((doc) => {
      if (cancelled) return;
      if (!doc) {
        setNotFound(true);
        return;
      }
      setTitle(doc.title);
      latestTitleRef.current = doc.title;
      latestContentRef.current = doc.content;
      setWordCount(doc.wordCount);
      setPageCount(doc.pageCount);
      setInitialData(doc.content);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function scheduleSave() {
    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDocument(id, latestTitleRef.current, latestContentRef.current).then(() => {
        setSaveState("saved");
      });
    }, SAVE_DEBOUNCE_MS);
  }

  function handleContentChange(data: OutputData) {
    latestContentRef.current = data;
    setWordCount(countWords(data));
    setPageCount(countPages(data));
    scheduleSave();
  }

  function handleTitleChange(next: string) {
    setTitle(next);
    latestTitleRef.current = next;
    scheduleSave();
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveDocument(id, latestTitleRef.current, latestContentRef.current);
      }
    };
  }, [id]);

  async function getContent(): Promise<OutputData | null> {
    return latestContentRef.current;
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)]">
            Document not found
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-3 text-sm text-[var(--color-umber)] hover:underline"
          >
            Back to documents
          </button>
        </div>
      </main>
    );
  }

  if (!initialData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TitleBar
        title={title}
        wordCount={wordCount}
        pageCount={pageCount}
        saveState={saveState}
        onTitleChange={handleTitleChange}
      />
      <EditorCanvas
        holderId={`editorjs-${id}`}
        documentId={id}
        initialData={initialData}
        onChange={handleContentChange}
      />
      <Toolbar documentId={id} title={title} getContent={getContent} />
    </main>
  );
}
