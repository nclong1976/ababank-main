// URL cac anh duoc luu tren Vercel Blob (ababank-assets - Public store)
// Base: https://gek9ahkmbgqvi3a1.public.blob.vercel-storage.com

const BLOB_BASE = 'https://gek9ahkmbgqvi3a1.public.blob.vercel-storage.com';

export const BLOB_IMAGES = {
  // Icon scan QR - dung trong App.tsx header
  scanQrIcon: `${BLOB_BASE}/images/regenerated_image_1781188262145.png`,

  // Cac anh khac chua su dung (san sang de dung)
  image1: `${BLOB_BASE}/images/regenerated_image_1781076270907.png`,
  image2: `${BLOB_BASE}/images/regenerated_image_1781076349758.png`,
  image3: `${BLOB_BASE}/images/regenerated_image_1781076351185.png`,
  image4: `${BLOB_BASE}/images/regenerated_image_1781076471454.png`,
  image5: `${BLOB_BASE}/images/regenerated_image_1781076472059.png`,
} as const;

export type BlobImageKey = keyof typeof BLOB_IMAGES;
