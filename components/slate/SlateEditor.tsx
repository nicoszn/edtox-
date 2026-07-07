"use client"

import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { Slate, Editable } from "slate-react"
import type { RenderElementProps, RenderLeafProps } from "slate-react"
import type { Descendant } from "slate"
import { useRouter } from "next/navigation"
import { createSlateEditor, INITIAL_VALUE } from "@/lib/slate/editor"
import { buildPageIndex, type PageIndex } from "@/lib/slate/pageMap"
import { renderElement } from "@/components/slate/elements"
import { renderLeaf } from "@/components/slate/leaves"
import { SlateToolbar } from "@/components/slate/Toolbar"
import { getDocument, saveDocument } from "@/lib/storage/documents"

const SAVE_DEBOUNCE = 600

async function resolveDocument(id: string): Promise<string> {
  for (let i = 0; i < 15; i++) {
    const doc = await getDocument(id)
    if (doc) return doc.title
    await new Promise((r) => setTimeout(r, 80))
  }
  return "Untitled"
}

export default function SlateEditor({ documentId }: { documentId: string }) {
  const editor = useMemo(() => createSlateEditor(), [])
  const router = useRouter()

  const [ready, setReady] = useState(false)
  const [title, setTitle] = useState("Untitled")
  const [preview, setPreview] = useState(false)
  const [value, setValue] = useState<Descendant[]>(INITIAL_VALUE)

  const titleRef = useRef(title)
  titleRef.current = title
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    resolveDocument(documentId).then((t) => {
      setTitle(t)
      setReady(true)
    })
  }, [documentId])

  const pageIndex = useMemo<PageIndex>(
    () => buildPageIndex(editor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  const scheduleSave = useCallback((id: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveDocument(id, titleRef.current, { time: Date.now(), blocks: [], version: "slate" })
    }, SAVE_DEBOUNCE)
  }, [])

  const onValueChange = useCallback((v: Descendant[]) => {
    setValue(v)
    scheduleSave(documentId)
  }, [documentId, scheduleSave])

  function handleTitleChange(t: string) {
    setTitle(t)
    titleRef.current = t
    scheduleSave(documentId)
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveDocument(documentId, titleRef.current, { time: Date.now(), blocks: [], version: "slate" })
      }
    }
  }, [documentId])

  const renderEl = useCallback(
    (props: RenderElementProps) => renderElement(props, pageIndex),
    [pageIndex]
  )
  const renderLf = useCallback((props: RenderLeafProps) => renderLeaf(props), [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Slate editor={editor} initialValue={INITIAL_VALUE} onValueChange={onValueChange}>
        <div className="sticky top-0 z-10 bg-[var(--color-paper)]/95 backdrop-blur-sm border-b border-[var(--color-rule)] px-4 py-3 sm:px-6 flex items-center gap-3 print:hidden">
          <button
            onClick={() => router.push("/")}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] transition-colors text-lg"
          >
            ←
          </button>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-ink)] outline-none"
          />
        </div>

        <div className="print:hidden">
          <SlateToolbar preview={preview} onTogglePreview={() => setPreview((v) => !v)} />
        </div>

        <div className="slate-a4-root">
          <Editable
            readOnly={preview}
            renderElement={renderEl}
            renderLeaf={renderLf}
            placeholder="Start writing…"
            className="slate-a4-editable outline-none"
            spellCheck
          />
        </div>
      </Slate>
    </div>
  )
}
