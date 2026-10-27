/**
 * Borra los datos de demo que crea el seed:  npm run remove-demo
 *
 * - Los 30 profesionales ficticios (por su teléfono, generado por el seed, o por su foto "seed-*").
 * - Sus fotos en la BD (StoredFile "seed-*").
 * - El admin de prueba (SEED_ADMIN_PHONE, por defecto +22200000000), si existe.
 * No toca los profesionales registrados de verdad, los admins reales, las zonas ni las especialidades.
 * Pide confirmación escribiendo BORRAR.
 */
import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";
import { PrismaClient } from "@prisma/client";
import { PROFESSIONALS } from "../prisma/seed/data";

const prisma = new PrismaClient();

/** Mismos teléfonos que genera prisma/seed.ts */
const demoPhones = PROFESSIONALS.map((_, i) => `+2224${(6100000 + i * 731).toString().slice(0, 7)}`);
const demoAdminPhone = process.env.SEED_ADMIN_PHONE || "+22200000000";

async function main() {
  const demoUsers = await prisma.user.findMany({
    where: {
      role: "PROFESSIONAL",
      OR: [{ phone: { in: demoPhones } }, { professional: { photoUrl: { startsWith: "/api/files/seed-" } } }],
    },
    select: { id: true },
  });
  const demoAdmin = await prisma.user.findFirst({ where: { phone: demoAdminPhone, role: "ADMIN" }, select: { id: true } });
  const seedFiles = await prisma.storedFile.count({ where: { name: { startsWith: "seed-" } } });

  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Base de datos: ${host}`);
  console.log(`Se borrarán ${demoUsers.length} profesionales de demo, ${seedFiles} fotos de demo${demoAdmin ? ` y el admin de prueba ${demoAdminPhone}` : ""}.`);
  if (!demoUsers.length && !seedFiles && !demoAdmin) return console.log("Nada que borrar.");

  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question("Escribe BORRAR para confirmar: ")).trim();
  rl.close();
  if (answer !== "BORRAR") return console.log("Cancelado.");

  const ids = [...demoUsers.map((u) => u.id), ...(demoAdmin ? [demoAdmin.id] : [])];
  // Professional y PasswordResetToken se borran en cascada con el usuario.
  const [users, files] = await prisma.$transaction([
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
    prisma.storedFile.deleteMany({ where: { name: { startsWith: "seed-" } } }),
  ]);
  console.log(`✓ Borrados ${users.count} usuarios y ${files.count} fotos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
