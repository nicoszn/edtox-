"use client";

import { useEffect, useState } from "react";
import type { DocumentMeta } from "@/types/document";
import { listDocuments } from "@/lib/storage/documents";
import DocumentCard from "@/components/home/DocumentCard";
import NewDocumentButton from "@/components/home/NewDocumentButton";

export default function HomePage() {
  const [docs, setDocs] = useState<DocumentMeta[] | null>(null);

  useEffect(() => {
    listDocuments().then(setDocs);
  }, []);

  function handleDeleted(id: string) {
    setDocs((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12 max-w-2xl mx-auto">
      <header className="flex items-end justify-between mb-8 sm:mb-10">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--color-ink)]">
            Scribe
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Your documents, kept on this device.
          </p>
        </div>
      </header>

      <div className="mb-6">
        <NewDocumentButton />
      </div>

      {docs === null && (
        <p className="text-sm text-[var(--color-ink-soft)] font-[family-name:var(--font-mono)]">
          Loading…
        </p>
      )}

      {docs !== null && docs.length === 0 && (
        <div className="border border-dashed border-[var(--color-rule)] rounded-lg px-5 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">
            Nothing here yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Start a new document to begin writing.
          </p>
        </div>
      )}

      {docs !== null && docs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocumentCard doc={doc} onDeleted={handleDeleted} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
