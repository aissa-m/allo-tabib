import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/api";
import { MAX_PHOTO_BYTES, deleteStoredPhoto, saveProfilePhoto } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const r = await requireRole("PROFESSIONAL");
  if (r.error) return r.error;

  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File) || photo.size === 0 || !photo.type.startsWith("image/")) {
    return jsonError(422, "validation", { photo: ["photo"] });
  }
  if (photo.size > MAX_PHOTO_BYTES) return jsonError(422, "validation", { photo: ["photoSize"] });

  const pro = await prisma.professional.findUnique({ where: { userId: r.session.user.id } });
  if (!pro) return jsonError(404, "notFound");

  let photoUrl: string;
  try {
    photoUrl = await saveProfilePhoto(Buffer.from(await photo.arrayBuffer()));
  } catch {
    return jsonError(422, "validation", { photo: ["photo"] });
  }
  await prisma.professional.update({ where: { id: pro.id }, data: { photoUrl } });
  await deleteStoredPhoto(pro.photoUrl);
  return NextResponse.json({ photoUrl });
}
