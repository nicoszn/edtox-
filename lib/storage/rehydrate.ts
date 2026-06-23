import type { OutputData } from "@editorjs/editorjs";
import { getAssetUrl } from "@/lib/storage/assets";

interface FileFieldData {
  file?: { url?: string; assetId?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * blob: object URLs are only valid for the lifetime of the page that
 * created them — they go dead across reloads/navigations. Any block whose
 * data carries an `assetId` (image, attaches) needs its `url` field
 * refreshed against IndexedDB before the editor mounts, or the asset will
 * render broken.
 */
export async function rehydrateAssetUrls(data: OutputData): Promise<OutputData> {
  const blocks = await Promise.all(
    data.blocks.map(async (block) => {
      if (block.type !== "image" && block.type !== "attaches") return block;
      const d = block.data as FileFieldData;
      const assetId = d.file?.assetId as string | undefined;
      if (!assetId) return block;

      const freshUrl = await getAssetUrl(assetId);
      if (!freshUrl) return block;

      return {
        ...block,
        data: {
          ...d,
          file: { ...d.file, url: freshUrl },
        },
      };
    })
  );

  return { ...data, blocks };
}
