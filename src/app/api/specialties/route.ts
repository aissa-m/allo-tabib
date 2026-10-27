import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { zodError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ type: z.enum(["DOCTOR", "NURSE"]).optional() });

export async function GET(req: Request) {
  const parsed = querySchema.safeParse({ type: new URL(req.url).searchParams.get("type") || undefined });
  if (!parsed.success) return zodError(parsed.error);
  const specialties = await prisma.specialty.findMany({
    where: parsed.data.type ? { type: parsed.data.type } : undefined,
    orderBy: { id: "asc" },
  });
  return NextResponse.json(specialties, { headers: { "Cache-Control": "public, max-age=300" } });
}
