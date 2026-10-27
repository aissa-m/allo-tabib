import { NextResponse, after } from "next/server";
import { zodError } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation";
import { prepareResetMail } from "@/lib/passwordReset";

export const runtime = "nodejs";

/**
 * Pide un enlace de restablecimiento. Responde siempre { ok: true } (exista o no el email)
 * y envía el correo después de responder, para que el tiempo de respuesta no lo delate.
 */
export async function POST(req: Request) {
  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return zodError(parsed.error);

  const send = await prepareResetMail(parsed.data.email);
  if (send) {
    after(async () => {
      try {
        await send();
      } catch (e) {
        console.error("[password/forgot] no se pudo enviar el correo", e);
      }
    });
  }
  return NextResponse.json({ ok: true });
}
