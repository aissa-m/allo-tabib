import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole } from "@/lib/api";
import { expireStaleAvailability, professionalInclude, toDetailDTO } from "@/lib/professionals";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return jsonError(400, "invalidId");

  await expireStaleAvailability();
  const pro = await prisma.professional.findUnique({ where: { id }, include: professionalInclude });
  if (!pro) return jsonError(404, "notFound");
  return NextResponse.json(toDetailDTO(pro));
}
