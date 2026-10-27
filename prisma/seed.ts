/**
 * Seed idempotente: zonas, especialidades, admin y 30 profesionales ficticios.
 * Volver a ejecutarlo refresca las posiciones de demo (solo afecta a los perfiles de ejemplo).
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { FeatureCollection, Polygon } from "geojson";
import { SPECIALTIES, PROFESSIONALS, BIOS } from "./seed/data";

const prisma = new PrismaClient();

// Generador pseudoaleatorio determinista (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(222);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

function centroid(poly: Polygon): { lat: number; lng: number } {
  // Centroide por área (fórmula del polígono)
  const ring = poly.coordinates[0];
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a /= 2;
  return { lng: cx / (6 * a), lat: cy / (6 * a) };
}

function randomPointIn(poly: Polygon) {
  const ring = poly.coordinates[0];
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  const [minLng, maxLng, minLat, maxLat] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  for (let i = 0; i < 200; i++) {
    const lng = minLng + rand() * (maxLng - minLng);
    const lat = minLat + rand() * (maxLat - minLat);
    if (booleanPointInPolygon([lng, lat], poly)) return { lat, lng };
  }
  return centroid(poly);
}

/** Avatar genérico (silueta + iniciales), sin fotos de personas reales. */
async function makeAvatar(file: string, initials: string, type: "DOCTOR" | "NURSE", hue: number) {
  const accent = type === "DOCTOR" ? "#7A9483" : "#6B7F99";
  const bg = `hsl(${hue}, 18%, 86%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#ECE9E3"/></linearGradient></defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <circle cx="300" cy="235" r="105" fill="${accent}" fill-opacity="0.55"/>
    <path d="M110 600 C 120 440, 210 375, 300 375 C 390 375, 480 440, 490 600 Z" fill="${accent}" fill-opacity="0.55"/>
    <text x="300" y="262" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="600" fill="#F4F2EE">${initials}</text>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).resize(600, 600).webp({ quality: 82 }).toBuffer();
  await writeFile(file, buf);
}

async function main() {
  // --- Zonas ---
  const geo = JSON.parse(
    await readFile(path.join(__dirname, "seed", "zones.geojson"), "utf8"),
  ) as FeatureCollection<Polygon, { nameFr: string; nameAr: string }>;

  const zoneByName = new Map<string, { id: number; poly: Polygon; center: { lat: number; lng: number } }>();
  for (const f of geo.features) {
    const c = centroid(f.geometry);
    const data = {
      nameFr: f.properties.nameFr,
      nameAr: f.properties.nameAr,
      centerLat: +c.lat.toFixed(5),
      centerLng: +c.lng.toFixed(5),
      polygon: f.geometry as unknown as Prisma.InputJsonValue,
    };
    const z = await prisma.zone.upsert({ where: { nameFr: data.nameFr }, update: data, create: data });
    zoneByName.set(z.nameFr, { id: z.id, poly: f.geometry, center: c });
  }
  console.log(`✓ ${zoneByName.size} zonas`);

  // --- Especialidades ---
  const specialtyIds: Record<"DOCTOR" | "NURSE", number[]> = { DOCTOR: [], NURSE: [] };
  for (const type of ["DOCTOR", "NURSE"] as const) {
    for (const s of SPECIALTIES[type]) {
      const row = await prisma.specialty.upsert({
        where: { type_nameFr: { type, nameFr: s.fr } },
        update: { nameAr: s.ar },
        create: { type, nameFr: s.fr, nameAr: s.ar },
      });
      specialtyIds[type].push(row.id);
    }
  }
  console.log(`✓ ${specialtyIds.DOCTOR.length + specialtyIds.NURSE.length} especialidades`);

  // --- Admin ---
  const adminPhone = process.env.SEED_ADMIN_PHONE || "+22200000000";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin1234";
  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 10) },
    create: { role: "ADMIN", phone: adminPhone, passwordHash: await bcrypt.hash(adminPassword, 10) },
  });
  console.log(`✓ admin ${adminPhone} / ${adminPassword}`);

  // --- Profesionales de ejemplo ---
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const demoHash = await bcrypt.hash("demo1234", 10);
  const now = Date.now();

  // 15 disponibles: 12 con posición en vivo, 2 obsoletas y 1 sin posición (permiso denegado)
  const available = new Set([0, 1, 2, 3, 4, 6, 8, 9, 11, 13, 17, 20, 21, 23, 28]);
  const stale = new Set([9, 23]);
  const noPosition = new Set([28]);

  for (let i = 0; i < PROFESSIONALS.length; i++) {
    const p = PROFESSIONALS[i];
    const n = String(i + 1).padStart(2, "0");
    const phone = `+2224${(6100000 + i * 731).toString().slice(0, 7)}`;
    const email = i % 3 === 0 ? `demo${n}@allotabib.mr` : null;
    const nni = String(1200000000 + i * 3571917).padStart(10, "0").slice(0, 10);
    const zone = zoneByName.get(p.zone)!;
    const fileName = `seed-${n}.webp`;
    await makeAvatar(path.join(uploadDir, fileName), `${p.first[0]}${p.last.replace(/^(Ould|Mint) /, "")[0]}`, p.type, (i * 37) % 360);

    const isAvailable = available.has(i);
    let pos: { lat: number; lng: number } | null = null;
    let locationUpdatedAt: Date | null = null;
    if (isAvailable && !noPosition.has(i)) {
      // Algunos se colocan en una zona distinta a la habitual para que haya variedad
      const zoneForPos = i % 4 === 0 ? pick([...zoneByName.values()]) : zone;
      pos = randomPointIn(zoneForPos.poly);
      locationUpdatedAt = new Date(now - (stale.has(i) ? 14 * 60_000 + i * 1000 : Math.floor(rand() * 50_000)));
    }
    let currentZoneId: number | null = null;
    if (pos) {
      for (const z of zoneByName.values()) {
        if (booleanPointInPolygon([pos.lng, pos.lat], z.poly)) currentZoneId = z.id;
      }
    }
    const birthYear = 1965 + Math.floor(rand() * 30);
    const professionalData = {
      type: p.type,
      firstName: p.first,
      lastName: p.last,
      birthDate: new Date(Date.UTC(birthYear, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))),
      sex: p.sex,
      nni,
      photoUrl: `/api/files/${fileName}`,
      whatsapp: i % 5 === 4 ? null : phone,
      specialtyId: specialtyIds[p.type][i % specialtyIds[p.type].length],
      yearsExperience: Math.max(1, Math.min(35, 2025 - birthYear - 27)),
      workplace: p.workplace,
      languages: p.langs,
      bio: BIOS[i % BIOS.length],
      homeZoneId: zone.id,
      hasVehicle: i % 3 !== 2,
      isAvailable,
      availableSince: isAvailable ? new Date(now - (20 + i * 4) * 60_000) : null,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
      locationUpdatedAt,
      currentZoneId,
      createdAt: new Date(now - (60 - i) * 24 * 3600_000),
    };

    await prisma.user.upsert({
      where: { phone },
      update: { email, passwordHash: demoHash, professional: { upsert: { create: professionalData, update: professionalData } } },
      create: { role: "PROFESSIONAL", phone, email, passwordHash: demoHash, professional: { create: professionalData } },
    });
  }
  console.log(`✓ ${PROFESSIONALS.length} profesionales (${available.size} disponibles)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
