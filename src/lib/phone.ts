/** Utilidades para números mauritanos: +222 seguido de 8 dígitos. */

export const MR_PHONE_REGEX = /^\+222\d{8}$/;

/** Normaliza entradas como "22 33 44 55", "22222334455" o "+222 22334455". */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 8) return `+222${digits}`;
  if (digits.length === 11 && digits.startsWith("222")) return `+${digits}`;
  return input.trim();
}

export function formatPhone(phone: string): string {
  const m = phone.match(/^\+222(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+222 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}
