import JSZip from "jszip";
import type { OutputData } from "@editorjs/editorjs";
import { toMarkdown } from "@/lib/export/markdown";
import { toPlainText } from "@/lib/export/plaintext";
import { toDocx } from "@/lib/export/docx";
import { getAssetsForDocument } from "@/lib/storage/assets";

function safeName(title: string): string {
  return (title || "untitled").trim().replace(/\s+/g, "-").toLowerCase();
}

/**
 * Bundles every export format plus the document's original asset files
 * (images/attachments at full quality) into a single .zip, for cases where
 * a school submission wants "everything" rather than one format.
 */
export async function toZipBundle(
  documentId: string,
  title: string,
  data: OutputData
): Promise<Blob> {
  const zip = new JSZip();
  const base = safeName(title);

  zip.file(`${base}.md`, toMarkdown(title, data));
  zip.file(`${base}.txt`, toPlainText(title, data));

  const docxBlob = await toDocx(title, data);
  zip.file(`${base}.docx`, docxBlob);

  const assets = await getAssetsForDocument(documentId);
  if (assets.length) {
    const assetsFolder = zip.folder("assets");
    for (const asset of assets) {
      assetsFolder?.file(asset.name, asset.blob);
    }
  }

  return zip.generateAsync({ type: "blob" });
}
