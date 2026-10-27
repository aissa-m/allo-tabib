import { NextResponse } from "next/server";
import { jsonError, zodError } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { resetPassword } from "@/lib/passwordReset";

export const runtime = "nodejs";

/** Cambia la contraseña con el token del correo. */
export async function POST(req: Request) {
  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);
  const ok = await resetPassword(parsed.data.token, parsed.data.password);
  if (!ok) return jsonError(410, "resetInvalid");
  return NextResponse.json({ ok: true });
}
