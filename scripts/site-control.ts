/**
 * Panel oculto de bloqueo de la web, desde la terminal:
 *
 *   npm run site-control -- hash      Pide una contraseña (oculta) e imprime SITE_CONTROL_PASSWORD_HASH
 *   npm run site-control -- status    Muestra si la web está bloqueada
 *   npm run site-control -- lock      Bloquea la web
 *   npm run site-control -- unlock    Desbloquea la web y reinicia el límite de intentos del panel
 *
 * lock/unlock/status usan DATABASE_URL: para producción, apúntalo a la BD de producción.
 */
import { createInterface } from "readline";
import { stdin, stdout } from "process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/siteControl/password";

const prisma = new PrismaClient();

/** Lee una línea sin mostrar lo que se teclea. */
function askHidden(prompt: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: !!stdin.isTTY });
  const out = rl as unknown as { _writeToOutput: (s: string) => void };
  stdout.write(prompt);
  out._writeToOutput = () => {};
  return new Promise((resolve) =>
    rl.question("", (answer) => {
      rl.close();
      stdout.write("\n");
      resolve(answer);
    }),
  );
}

async function hash() {
  const pw = await askHidden("Contraseña del panel (mín. 6 caracteres): ");
  if (pw.length < 6) throw new Error("Demasiado corta.");
  if ((await askHidden("Repite la contraseña: ")) !== pw) throw new Error("No coinciden.");
  console.log(`\nSITE_CONTROL_PASSWORD_HASH=${await hashPassword(pw)}`);
  console.log("\nPégalo en .env y en las variables de entorno de Vercel (y vuelve a desplegar).");
}

async function setLocked(locked: boolean) {
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: locked ? { locked } : { locked, failedLogins: 0, loginBlockedUntil: null },
    create: { id: 1, locked },
  });
  console.log(locked ? "✓ Web bloqueada." : "✓ Web desbloqueada.");
}

async function status() {
  const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  console.log(row?.locked ? "Web BLOQUEADA." : "Web activa.");
  if (row?.loginBlockedUntil && row.loginBlockedUntil > new Date()) {
    console.log(`Login del panel bloqueado hasta ${row.loginBlockedUntil.toLocaleString()} (unlock lo reinicia).`);
  }
}

const commands: Record<string, () => Promise<void>> = {
  hash,
  status,
  lock: () => setLocked(true),
  unlock: () => setLocked(false),
};

const command = commands[process.argv[2] ?? ""];
if (!command) {
  console.log("Uso: npm run site-control -- <hash | status | lock | unlock>");
  process.exitCode = 1;
} else {
  command()
    .catch((e) => {
      console.error("Error:", e instanceof Error ? e.message : e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
