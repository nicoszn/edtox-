import type { OutputData } from "@editorjs/editorjs";

export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
}

export interface ScribeDocument extends DocumentMeta {
  content: OutputData;
}

export const EMPTY_CONTENT: OutputData = {
  time: 0,
  blocks: [],
  version: "2.30.8",
};

import type { OutputData } from "@editorjs/editorjs";

export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  pageCount: number;
}

export interface ScribeDocument extends DocumentMeta {
  content: OutputData;
}

export const EMPTY_CONTENT: OutputData = {
  time: 0,
  blocks: [],
  version: "2.30.8",
};

/**
 * A binary asset (image, attachment) referenced by id from inside a block's
 * data. Stored separately from document JSON so the document itself stays
 * small and fast to read/write; only the asset id is embedded in blocks.
 */
export interface ScribeAsset {
  id: string;
  documentId: string;
  name: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
}
