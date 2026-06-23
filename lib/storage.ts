import type { OutputData } from "@editorjs/editorjs";
import { EMPTY_CONTENT, type DocumentMeta, type ScribeDocument } from "@/types/document";
import { countWords } from "@/lib/wordcount";

const INDEX_KEY = "scribe:index";
const DOC_KEY = (id: string) => `scribe:doc:${id}`;

function readIndex(): DocumentMeta[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DocumentMeta[];
  } catch {
    return [];
  }
}

function writeIndex(index: DocumentMeta[]) {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function listDocuments(): DocumentMeta[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDocument(id: string): ScribeDocument | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DOC_KEY(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScribeDocument;
  } catch {
    return null;
  }
}

export function createDocument(title = "Untitled document"): ScribeDocument {
  const now = Date.now();
  const id = crypto.randomUUID();
  const doc: ScribeDocument = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    wordCount: 0,
    content: EMPTY_CONTENT,
  };
  window.localStorage.setItem(DOC_KEY(id), JSON.stringify(doc));
  const index = readIndex();
  index.push({ id, title, createdAt: now, updatedAt: now, wordCount: 0 });
  writeIndex(index);
  return doc;
}

export function saveDocument(id: string, title: string, content: OutputData) {
  const existing = getDocument(id);
  const now = Date.now();
  const wordCount = countWords(content);
  const doc: ScribeDocument = {
    id,
    title,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    wordCount,
    content,
  };
  window.localStorage.setItem(DOC_KEY(id), JSON.stringify(doc));

  const index = readIndex();
  const i = index.findIndex((d) => d.id === id);
  const meta: DocumentMeta = { id, title, createdAt: doc.createdAt, updatedAt: now, wordCount };
  if (i === -1) index.push(meta);
  else index[i] = meta;
  writeIndex(index);
}

export function deleteDocument(id: string) {
  window.localStorage.removeItem(DOC_KEY(id));
  writeIndex(readIndex().filter((d) => d.id !== id));
}
