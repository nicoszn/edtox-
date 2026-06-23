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
