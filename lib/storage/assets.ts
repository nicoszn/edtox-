import type { ScribeAsset } from "@/types/document";
import { openDB, tx, reqToPromise, STORE_ASSETS } from "@/lib/storage/db";

export async function putAsset(
  documentId: string,
  file: File
): Promise<ScribeAsset> {
  const db = await openDB();
  const asset: ScribeAsset = {
    id: crypto.randomUUID(),
    documentId,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    blob: file,
    createdAt: Date.now(),
  };
  await reqToPromise(tx(db, STORE_ASSETS, "readwrite").put(asset));
  return asset;
}

export async function getAsset(id: string): Promise<ScribeAsset | null> {
  const db = await openDB();
  const asset = await reqToPromise(tx(db, STORE_ASSETS, "readonly").get(id));
  return (asset as ScribeAsset) ?? null;
}

/**
 * Returns a blob: URL for an asset, for use as an <img src> or download
 * link. Caller is responsible for revoking it (e.g. on unmount) since
 * object URLs otherwise leak for the lifetime of the document.
 */
export async function getAssetUrl(id: string): Promise<string | null> {
  const asset = await getAsset(id);
  if (!asset) return null;
  return URL.createObjectURL(asset.blob);
}

export async function deleteAssetsForDocument(documentId: string): Promise<void> {
  const db = await openDB();
  const store = tx(db, STORE_ASSETS, "readwrite");
  const index = store.index("documentId");
  const keys = await reqToPromise(index.getAllKeys(documentId));
  await Promise.all(keys.map((key) => reqToPromise(store.delete(key))));
}

export async function getAssetsForDocument(documentId: string): Promise<ScribeAsset[]> {
  const db = await openDB();
  const store = tx(db, STORE_ASSETS, "readonly");
  const index = store.index("documentId");
  const assets = await reqToPromise(index.getAll(documentId));
  return assets as ScribeAsset[];
}
