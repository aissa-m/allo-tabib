import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { MAX_PHOTO_BYTES, saveProfilePhoto, deleteStoredPhoto } from "@/lib/storage";
import { jsonError, zodError } from "@/lib/api";

export const runtime = "nodejs";

/** Registro de profesional. multipart/form-data con "data" (JSON) y "photo" (imagen). */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "invalidBody");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? ""));
  } catch {
    return jsonError(400, "invalidBody");
  }
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return zodError(parsed.error);
  const d = parsed.data;

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return jsonError(422, "validation", { photo: ["photo"] });
  if (photo.size > MAX_PHOTO_BYTES) return jsonError(422, "validation", { photo: ["photoSize"] });
  if (!photo.type.startsWith("image/")) return jsonError(422, "validation", { photo: ["photo"] });

  // Unicidad con errores por campo
  const [phoneTaken, emailTaken, nniTaken] = await Promise.all([
    prisma.user.findUnique({ where: { phone: d.phone } }),
    d.email ? prisma.user.findUnique({ where: { email: d.email } }) : null,
    prisma.professional.findUnique({ where: { nni: d.nni } }),
  ]);
  const conflicts: Record<string, string[]> = {};
  if (phoneTaken) conflicts.phone = ["phoneTaken"];
  if (emailTaken) conflicts.email = ["emailTaken"];
  if (nniTaken) conflicts.nni = ["nniTaken"];
  if (Object.keys(conflicts).length) return jsonError(409, "conflict", conflicts);

  const [specialty, zone] = await Promise.all([
    prisma.specialty.findUnique({ where: { id: d.specialtyId } }),
    prisma.zone.findUnique({ where: { id: d.homeZoneId } }),
  ]);
  if (!specialty || specialty.type !== d.type) return jsonError(422, "validation", { specialtyId: ["required"] });
  if (!zone) return jsonError(422, "validation", { homeZoneId: ["required"] });

  let photoUrl: string;
  try {
    photoUrl = await saveProfilePhoto(Buffer.from(await photo.arrayBuffer()));
  } catch {
    return jsonError(422, "validation", { photo: ["photo"] });
  }

  try {
    const passwordHash = await bcrypt.hash(d.password, 10);
    const user = await prisma.user.create({
      data: {
        role: "PROFESSIONAL",
        phone: d.phone,
        email: d.email || null,
        passwordHash,
        professional: {
          create: {
            type: d.type,
            firstName: d.firstName,
            lastName: d.lastName,
            birthDate: new Date(d.birthDate),
            sex: d.sex,
            nni: d.nni,
            photoUrl,
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
    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch (e) {
    await deleteStoredPhoto(photoUrl);
    console.error(e);
    return jsonError(500, "server");
  }
}
