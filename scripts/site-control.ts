/**
 * Panel oculto de bloqueo de la web, desde la terminal:
 *
 *   npm run site-control -- status    Muestra si la web está bloqueada
 *   npm run site-control -- lock      Bloquea la web
 *   npm run site-control -- unlock    Desbloquea la web
 *
 * lock/unlock/status usan DATABASE_URL: para producción, apúntalo a la BD de producción.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setLocked(locked: boolean) {
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: { locked },
    create: { id: 1, locked },
  });
  console.log(locked ? "✓ Web bloqueada." : "✓ Web desbloqueada.");
}

async function status() {
  const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  console.log(row?.locked ? "Web BLOQUEADA." : "Web activa.");
}

const commands: Record<string, () => Promise<void>> = {
  status,
  lock: () => setLocked(true),
  unlock: () => setLocked(false),
};

const command = commands[process.argv[2] ?? ""];
if (!command) {
  console.log("Uso: npm run site-control -- <status | lock | unlock>");
  process.exitCode = 1;
} else {
  command()
    .catch((e) => {
      console.error("Error:", e instanceof Error ? e.message : e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
