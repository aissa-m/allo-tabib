import "server-only";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { auth } from "@/auth";

type Role = "PROFESSIONAL" | "ADMIN";

export function jsonError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

export function zodError(err: ZodError) {
  return jsonError(422, "validation", err.flatten().fieldErrors);
}

/** Devuelve la sesión si el rol coincide; si no, una respuesta 401/403 lista para devolver. */
export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user) return { error: jsonError(401, "unauthorized") } as const;
  if (session.user.role !== role) return { error: jsonError(403, "forbidden") } as const;
  return { session } as const;
}
