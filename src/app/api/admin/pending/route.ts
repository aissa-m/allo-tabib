import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api";

export const runtime = "nodejs";

/** Número de altas pendientes de validar (insignia del menú). Solo ADMIN. */
export async function GET() {
  const r = await requireRole("ADMIN");
  if (r.error) return r.error;
  const count = await prisma.professional.count({ where: { status: "PENDING" } });
  return NextResponse.json({ count });
}
