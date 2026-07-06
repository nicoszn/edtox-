"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { DocumentMeta } from "@/types/document"
import { listDocuments, createDocument } from "@/lib/storage/documents"
import DocumentCard from "@/components/DocumentCard"

export default function HomePage() {
  const router = useRouter()
  const [docs, setDocs] = useState<DocumentMeta[] | null>(null)

  useEffect(() => { listDocuments().then(setDocs) }, [])

  async function handleCreate(target: "editor" | "slate") {
    const doc = await createDocument()
    router.push(`/${target}/${doc.id}`)
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12 max-w-2xl mx-auto">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--color-ink)]">Scribe</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Your documents, kept on this device.</p>
      </header>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => handleCreate("editor")}
          className="px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium hover:bg-[var(--color-umber)] transition-colors"
        >
          + New (Editor.js)
        </button>
        <button
          onClick={() => handleCreate("slate")}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-ink)] text-[var(--color-ink)] text-sm font-medium hover:bg-[var(--color-rule)] transition-colors"
        >
          + New (Slate)
        </button>
      </div>

      {docs === null && (
        <p className="text-sm text-[var(--color-ink-soft)] font-[family-name:var(--font-mono)]">Loading…</p>
      )}

      {docs?.length === 0 && (
        <div className="border border-dashed border-[var(--color-rule)] rounded-lg px-5 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-ink)]">Nothing here yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Choose an editor above to start writing.</p>
        </div>
      )}

      {docs && docs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocumentCard doc={doc} onDeleted={(id) => setDocs((p) => p?.filter((d) => d.id !== id) ?? null)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
