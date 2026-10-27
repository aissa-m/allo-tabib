import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

/** Sirve las fotos subidas. Requiere sesión: los datos de profesionales no son públicos. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session?.user) return jsonError(401, "unauthorized");
  const { name } = await params;
  const file = await readStoredFile(name);
  if (!file) return jsonError(404, "notFound");
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
