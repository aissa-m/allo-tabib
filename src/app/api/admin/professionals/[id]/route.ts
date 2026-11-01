import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, zodError } from "@/lib/api";
import { reviewSchema } from "@/lib/validation";
import { expireStaleAvailability, professionalInclude, toDetailDTO } from "@/lib/professionals";

export const runtime = "nodejs";

const ID_RE = /^[a-z0-9]{10,40}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;
  const { id } = await params;
  if (!ID_RE.test(id)) return jsonError(400, "invalidId");

  await expireStaleAvailability();
  const pro = await prisma.professional.findUnique({ where: { id }, include: professionalInclude });
  if (!pro) return jsonError(404, "notFound");
  return NextResponse.json(toDetailDTO(pro));
}

/**
 * Valida o rechaza el alta. Solo se rechaza a quien está pendiente: quitar a alguien ya validado
 * es otra cosa (desactivar la cuenta y cerrar sus sesiones abiertas).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;
  const { id } = await params;
  if (!ID_RE.test(id)) return jsonError(400, "invalidId");

  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);
  const { status } = parsed.data;

  const current = await prisma.professional.findUnique({ where: { id }, select: { status: true } });
  if (!current) return jsonError(404, "notFound");
  if (status === "REJECTED" && current.status !== "PENDING") return jsonError(409, "conflict");

  const pro = await prisma.professional.update({
    where: { id },
    data: { status, reviewedAt: new Date() },
    include: professionalInclude,
  });
  return NextResponse.json(toDetailDTO(pro));
}
