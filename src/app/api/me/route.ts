import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, requireRole, zodError } from "@/lib/api";
import { getProfessionalByUserId, toMeDTO } from "@/lib/professionals";
import { passwordChangeSchema, profileUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const r = await requireRole("PROFESSIONAL");
  if (r.error) return r.error;
  const pro = await getProfessionalByUserId(r.session.user.id);
  if (!pro) return jsonError(404, "notFound");
  return NextResponse.json(toMeDTO(pro));
}

/**
 * Actualiza el perfil. Si el cuerpo trae "newPassword", cambia la contraseña;
 * en otro caso, actualiza los datos del perfil.
 */
export async function PATCH(req: Request) {
  const r = await requireRole("PROFESSIONAL");
  if (r.error) return r.error;
  const userId = r.session.user.id;

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError(400, "invalidBody");

  if ("newPassword" in body) {
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      return jsonError(422, "validation", { currentPassword: ["passwordWrong"] });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const d = parsed.data;

  const pro = await prisma.professional.findUnique({ where: { userId } });
  if (!pro) return jsonError(404, "notFound");

  const [phoneTaken, emailTaken, nniTaken, specialty, zone] = await Promise.all([
    prisma.user.findFirst({ where: { phone: d.phone, NOT: { id: userId } } }),
    d.email ? prisma.user.findFirst({ where: { email: d.email, NOT: { id: userId } } }) : null,
    prisma.professional.findFirst({ where: { nni: d.nni, NOT: { id: pro.id } } }),
    prisma.specialty.findUnique({ where: { id: d.specialtyId } }),
    prisma.zone.findUnique({ where: { id: d.homeZoneId } }),
  ]);
  const conflicts: Record<string, string[]> = {};
  if (phoneTaken) conflicts.phone = ["phoneTaken"];
  if (emailTaken) conflicts.email = ["emailTaken"];
  if (nniTaken) conflicts.nni = ["nniTaken"];
  if (Object.keys(conflicts).length) return jsonError(409, "conflict", conflicts);
  if (!specialty || specialty.type !== pro.type) return jsonError(422, "validation", { specialtyId: ["required"] });
  if (!zone) return jsonError(422, "validation", { homeZoneId: ["required"] });

  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: d.phone,
      email: d.email || null,
      professional: {
        update: {
          firstName: d.firstName,
          lastName: d.lastName,
          birthDate: new Date(d.birthDate),
          sex: d.sex,
          nni: d.nni,
          whatsapp: d.whatsappSame ? d.phone : d.whatsapp || null,
          specialtyId: d.specialtyId,
          yearsExperience: d.yearsExperience,
          workplace: d.workplace,
          languages: d.languages,
          bio: d.bio,
          homeZoneId: d.homeZoneId,
          hasVehicle: d.hasVehicle,
        },
      },
    },
  });

  const updated = await getProfessionalByUserId(userId);
  return NextResponse.json(updated ? toMeDTO(updated) : null);
}
