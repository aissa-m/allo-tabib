import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * Capa mínima de almacenamiento de fotos.
 * Driver "local": guarda en /public/uploads y las sirve a través de /api/files/[name]
 * (solo con sesión). Para S3, implementa otro StorageDriver y devuélvelo en driver().
 */
export interface StorageDriver {
  put(name: string, data: Buffer, contentType: string): Promise<string>;
  get(name: string): Promise<Buffer | null>;
  remove(name: string): Promise<void>;
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const SAFE_NAME = /^[a-zA-Z0-9_-]+\.webp$/;

const localDriver: StorageDriver = {
  async put(name, data) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), data);
    return `/api/files/${name}`;
  },
  async get(name) {
    if (!SAFE_NAME.test(name)) return null;
    try {
      return await readFile(path.join(UPLOAD_DIR, name));
    } catch {
      return null;
    }
  },
  async remove(name) {
    if (!SAFE_NAME.test(name)) return;
    await unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined);
  },
};

function driver(): StorageDriver {
  // Punto de extensión: if (process.env.STORAGE_DRIVER === "s3") return s3Driver;
  return localDriver;
}

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Recorta en cuadrado, redimensiona (máx. 600×600), comprime a WebP y guarda. Devuelve la URL. */
export async function saveProfilePhoto(input: Buffer): Promise<string> {
  const webp = await sharp(input)
    .rotate()
    .resize(600, 600, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return driver().put(`${randomUUID()}.webp`, webp, "image/webp");
}

export async function readStoredFile(name: string) {
  return driver().get(name);
}

export async function deleteStoredPhoto(url: string | null | undefined) {
  if (!url?.startsWith("/api/files/")) return;
  await driver().remove(url.replace("/api/files/", ""));
}
