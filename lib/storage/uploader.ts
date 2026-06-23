import { putAsset, getAssetUrl } from "@/lib/storage/assets";

/**
 * Editor.js's Image/Attaches tools expect a `url` they can point an <img>
 * or <a> at. We hand back a blob: object URL backed by IndexedDB instead of
 * a server-hosted file — same contract, no network required. The asset's
 * real id rides along as `assetId` so export pipelines can re-fetch the
 * original Blob later (object URLs don't survive a page reload).
 */
export function createIndexedDbUploader(documentId: string) {
  return {
    async uploadByFile(file: File) {
      const asset = await putAsset(documentId, file);
      const url = await getAssetUrl(asset.id);
      return {
        success: 1,
        file: {
          url,
          assetId: asset.id,
          name: asset.name,
          size: asset.size,
        },
      };
    },
  };
}

/**
 * Attaches tool only supports uploadByFile, and expects the response file
 * object to include extension/name/size/url per its backend-response spec.
 */
export function createAttachesUploader(documentId: string) {
  return {
    async uploadByFile(file: File) {
      const asset = await putAsset(documentId, file);
      const url = await getAssetUrl(asset.id);
      const extension = file.name.split(".").pop() ?? "";
      return {
        success: 1,
        file: {
          url,
          assetId: asset.id,
          name: asset.name,
          size: asset.size,
          extension,
        },
      };
    },
  };
}
