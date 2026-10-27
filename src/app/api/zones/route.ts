import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ZoneDTO } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await prisma.zone.findMany({ orderBy: { nameFr: "asc" } });
  return NextResponse.json(zones as unknown as ZoneDTO[], {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
