/**
 * Crea administradores de forma interactiva:  npm run create-admin
 *
 * Pide teléfono y contraseña (oculta) por la terminal. La contraseña no se escribe en ningún
 * fichero ni queda en el historial: solo se guarda su hash (bcrypt) en la base de datos.
 * Permite crear varios seguidos.
 */
import { createInterface } from "readline";
import { stdin, stdout } from "process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MR_PHONE_REGEX, normalizePhone } from "../src/lib/phone";
import { passwordSchema } from "../src/lib/validation";

const prisma = new PrismaClient();
const tty = !!stdin.isTTY;
const rl = createInterface({ input: stdin, output: stdout, terminal: tty });

// Cola de líneas: no se pierde ninguna aunque lleguen antes de preguntar (p. ej. entrada redirigida).
const lines: string[] = [];
const waiting: Array<(line: string | null) => void> = [];
let closed = false;
rl.on("line", (l) => (waiting.length ? waiting.shift()!(l) : lines.push(l)));
rl.on("close", () => {
  closed = true;
  while (waiting.length) waiting.shift()!(null);
});

// Con la salida "silenciada" no se muestran los caracteres que se teclean (contraseñas).
let muted = false;
const rlOut = rl as unknown as { _writeToOutput: (s: string) => void };
const writeOriginal = rlOut._writeToOutput?.bind(rl);
rlOut._writeToOutput = (s: string) => {
  if (!muted) writeOriginal?.(s);
};

async function ask(prompt: string, hidden = false): Promise<string> {
  stdout.write(prompt);
  muted = hidden && tty;
  const line = lines.length ? lines.shift()! : closed ? null : await new Promise<string | null>((r) => waiting.push(r));
  muted = false;
  if (hidden && tty) stdout.write("\n");
  else if (!tty) stdout.write(hidden ? "********\n" : `${line ?? ""}\n`);
  if (line === null) throw new Error("Entrada terminada");
  return line;
}

async function askPhone(): Promise<string> {
  for (;;) {
    const phone = normalizePhone((await ask("Teléfono del admin (+222 y 8 dígitos): ")).trim());
    if (MR_PHONE_REGEX.test(phone)) return phone;
    console.log("  ✗ Número no válido. Ejemplos: 22334455, +222 22 33 44 55");
  }
}

async function askPassword(): Promise<string> {
  for (;;) {
    const pw = await ask("Contraseña: ", true);
    if (!passwordSchema.safeParse(pw).success) {
      console.log("  ✗ Mínimo 8 caracteres.");
      continue;
    }
    if ((await ask("Repite la contraseña: ", true)) === pw) return pw;
    console.log("  ✗ No coinciden. Vuelve a intentarlo.");
  }
}

/** Email opcional: permite usar «Mot de passe oublié». Enter deja el actual (o ninguno). */
async function askEmail(userId: string | undefined, current: string | null): Promise<string | null> {
  for (;;) {
    const hint = current ? ` [${current}]` : " (opcional, para recuperar la contraseña)";
    const raw = (await ask(`Email${hint}: `)).trim().toLowerCase();
    if (!raw) return current;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      console.log("  ✗ Email no válido.");
      continue;
    }
    const taken = await prisma.user.findFirst({ where: { email: raw, NOT: userId ? { id: userId } : undefined } });
    if (!taken) return raw;
    console.log("  ✗ Ese email ya lo usa otra cuenta.");
  }
}

async function yes(question: string): Promise<boolean> {
  return ["s", "si", "sí", "y"].includes((await ask(`${question} (s/n): `)).trim().toLowerCase());
}

async function createOne(): Promise<void> {
  const phone = await askPhone();
  const existing = await prisma.user.findUnique({ where: { phone }, include: { professional: true } });

  if (existing?.professional) {
    console.log(`  ✗ ${phone} ya es un profesional registrado. Usa otro número.`);
    return;
  }
  if (existing?.role === "ADMIN" && !(await yes(`  ${phone} ya es admin. ¿Cambiar su contraseña?`))) {
    console.log("  Sin cambios.");
    return;
  }

  const passwordHash = await bcrypt.hash(await askPassword(), 10);
  const email = await askEmail(existing?.id, existing?.email ?? null);
  await prisma.user.upsert({
    where: { phone },
    update: { role: "ADMIN", passwordHash, email },
    create: { role: "ADMIN", phone, passwordHash, email },
  });
  console.log(existing ? `  ✓ Contraseña actualizada para ${phone}` : `  ✓ Admin creado: ${phone}`);
}

async function main() {
  console.log("Crear administradores de ALLO TABIB\n");
  do {
    await createOne();
    console.log("");
  } while (await yes("¿Crear otro admin?"));
  console.log("Listo.");
}

main()
  .catch((e) => {
    if (!(e instanceof Error && e.message === "Entrada terminada")) {
      console.error("\nError:", e instanceof Error ? e.message : e);
      process.exitCode = 1;
    }
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
