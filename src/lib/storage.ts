import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "./prisma";

/**
 * Capa mínima de almacenamiento de fotos. Las fotos se sirven por /api/files/[name] (solo con sesión).
 * - "local": guarda en /public/uploads (desarrollo o servidor con disco persistente).
 * - "db": guarda en PostgreSQL (tabla StoredFile). Necesario en Vercel, donde el disco no persiste.
 * Por defecto: "db" en Vercel y "local" en el resto. Se fuerza con STORAGE_DRIVER.
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

const dbDriver: StorageDriver = {
  async put(name, data, contentType) {
    await prisma.storedFile.create({ data: { name, data: new Uint8Array(data), contentType } });
    return `/api/files/${name}`;
  },
  async get(name) {
    if (!SAFE_NAME.test(name)) return null;
    const row = await prisma.storedFile.findUnique({ where: { name }, select: { data: true } });
    return row ? Buffer.from(row.data) : null;
  },
  async remove(name) {
    if (!SAFE_NAME.test(name)) return;
    await prisma.storedFile.deleteMany({ where: { name } });
  },
};

function driver(): StorageDriver {
  const name = process.env.STORAGE_DRIVER || (process.env.VERCEL ? "db" : "local");
  return name === "db" ? dbDriver : localDriver;
}

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Recorta en cuadrado, redimensiona (máx. 600×600), comprime a WebP y guarda. Devuelve la URL. */
export async function saveProfilePhoto(input: Buffer): Promise<string> {
  const webp = await sharp(input, { limitInputPixels: 50_000_000 })
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
