import "server-only";

/**
 * Envío de correos con Resend (API HTTP, sin dependencias): RESEND_API_KEY + EMAIL_FROM.
 * Sin RESEND_API_KEY: en desarrollo el correo se escribe en la consola del servidor;
 * en producción se considera un error de configuración.
 */
export type Mail = { to: string; subject: string; html: string; text: string };

export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY no configurada");
    console.info(`\n[mail] Para: ${mail.to}\n[mail] Asunto: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "ALLO TABIB <onboarding@resend.dev>",
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text().catch(() => "")}`);
}

/** URL pública de la web para los enlaces de los correos (nunca la cabecera Host de la petición). */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Correo de restablecimiento, en francés y árabe (no se sabe el idioma de quien lo abrirá). */
export function passwordResetMail(to: string, link: string, minutes: number): Mail {
  const url = escape(link);
  const button = (label: string) =>
    `<a href="${url}" style="display:inline-block;background:#226192;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px">${label}</a>`;
  const html = `<!doctype html><html><body style="margin:0;background:#EAE6DE;font-family:Arial,Helvetica,sans-serif;color:#232A33">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <div style="background:#ffffff;border-radius:20px;padding:28px">
    <p style="margin:0 0 4px;font-size:20px;font-weight:700">ALLO <span style="color:#226192">TABIB</span></p>
    <h1 style="font-size:18px;margin:20px 0 8px">Réinitialiser votre mot de passe</h1>
    <p style="margin:0 0 18px;line-height:1.5">Vous avez demandé un nouveau mot de passe. Ce lien est valable ${minutes} minutes et ne peut servir qu'une fois.</p>
    ${button("Choisir un nouveau mot de passe")}
    <hr style="border:none;border-top:1px solid #e5e1d8;margin:28px 0">
    <div dir="rtl" lang="ar" style="text-align:right">
      <h1 style="font-size:18px;margin:0 0 8px">إعادة تعيين كلمة المرور</h1>
      <p style="margin:0 0 18px;line-height:1.7">طلبت كلمة مرور جديدة. هذا الرابط صالح لمدة ${minutes} دقيقة ولا يُستخدم إلا مرة واحدة.</p>
      ${button("اختيار كلمة مرور جديدة")}
    </div>
    <p style="margin:28px 0 0;font-size:13px;color:#5F646B;line-height:1.5">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe ne change pas.<br><span dir="rtl" lang="ar">إذا لم تطلب ذلك، تجاهل هذه الرسالة: كلمة مرورك لن تتغير.</span></p>
  </div>
</div></body></html>`;
  const text = `ALLO TABIB — Réinitialiser votre mot de passe / إعادة تعيين كلمة المرور

${link}

Lien valable ${minutes} minutes, une seule fois. / الرابط صالح لمدة ${minutes} دقيقة، لمرة واحدة.
Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;
  return { to, subject: "Réinitialiser votre mot de passe · إعادة تعيين كلمة المرور", html, text };
}
