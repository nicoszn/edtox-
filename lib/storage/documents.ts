import type { OutputData } from "@editorjs/editorjs";
import { EMPTY_CONTENT, type DocumentMeta, type ScribeDocument } from "@/types/document";
import { countWords } from "@/lib/wordcount";
import { countPages } from "@/lib/pages";
import { openDB, tx, reqToPromise, STORE_DOCS } from "@/lib/storage/db";
import { deleteAssetsForDocument } from "@/lib/storage/assets";

export async function listDocuments(): Promise<DocumentMeta[]> {
  const db = await openDB();
  const all = await reqToPromise(tx(db, STORE_DOCS, "readonly").getAll());
  return (all as ScribeDocument[])
    .map(({ content, ...meta }) => meta)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDocument(id: string): Promise<ScribeDocument | null> {
  const db = await openDB();
  const doc = await reqToPromise(tx(db, STORE_DOCS, "readonly").get(id));
  return (doc as ScribeDocument) ?? null;
}

export async function createDocument(title = "Untitled document"): Promise<ScribeDocument> {
  const db = await openDB();
  const now = Date.now();
  const doc: ScribeDocument = {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    wordCount: 0,
    pageCount: 1,
    content: EMPTY_CONTENT,
  };
  await reqToPromise(tx(db, STORE_DOCS, "readwrite").put(doc));
  return doc;
}

export async function saveDocument(
  id: string,
  title: string,
  content: OutputData
): Promise<void> {
  const db = await openDB();
  const existing = await getDocument(id);
  const now = Date.now();

  const doc: ScribeDocument = {
    id,
    title,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    wordCount: countWords(content),
    pageCount: countPages(content),
    content,
  };

  await reqToPromise(tx(db, STORE_DOCS, "readwrite").put(doc));
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDB();
  await reqToPromise(tx(db, STORE_DOCS, "readwrite").delete(id));
  await deleteAssetsForDocument(id);
}
