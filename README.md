# ALLO TABIB (الو طبيب) — Atención a domicilio en Nuakchot

<img src="public/logo.svg" width="72" alt="ALLO TABIB">

Web para una empresa de Nuakchot (Mauritania) que coordina médicos y enfermeros que hacen visitas a domicilio fuera de su horario.

- **Profesionales** (médicos y enfermeros): se registran, tienen perfil con foto y un botón **Disponible / No disponible**. Mientras están disponibles, la web comparte su ubicación.
- **Admin**: recibe las llamadas de pacientes por teléfono (fuera de la web) y en la web ve un **mapa de Nuakchot** con los profesionales disponibles. Puede buscar por barrio (moughataa), filtrar por tipo, especialidad, idioma y vehículo, ver la ficha completa y llamar (`tel:`) o escribir por WhatsApp.

No hay pacientes, asignación de avisos, pagos ni aprobación de cuentas: las cuentas quedan activas al registrarse.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind CSS 3 · Prisma 6 + PostgreSQL 16 · Auth.js v5 (Credentials, JWT, bcrypt) · MapLibre GL vía `react-map-gl/maplibre` + estilos vectoriales CARTO · supercluster · `@turf/boolean-point-in-polygon` · lucide-react · framer-motion · zod + react-hook-form · next-intl (fr / ar con RTL) · sharp · SWR.

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- Docker (para PostgreSQL) o un PostgreSQL 14+ propio

## Puesta en marcha

```bash
cp .env.example .env          # y cambia AUTH_SECRET (npx auth secret)
docker compose up -d          # PostgreSQL en localhost:5433
npm install
npx prisma migrate dev        # crea las tablas
npm run seed                  # zonas, especialidades, admin y 30 profesionales de ejemplo
npm run dev                   # http://localhost:3000
```

Producción: `npm run build && npm start`.

> El `docker-compose.yml` expone PostgreSQL en el puerto **5433** (no 5432), para no chocar con un PostgreSQL local ya instalado.

## Credenciales de prueba

| Rol | Nombre | Teléfono | Contraseña | Notas |
|---|---|---|---|---|
| **Admin** | — | `+22200000000` | `admin1234` | |
| Médico | Mohamed Ould Abdallahi | `+22246100000` | `demo1234` | Médecine générale · Tevragh Zeina · disponible · email `demo01@allotabib.mr` |
| Médico | Mariem Mint Ahmed | `+22246100731` | `demo1234` | Pédiatrie · Ksar · disponible |
| Médico | Sidi Ould Cheikh | `+22246101462` | `demo1234` | Gynécologie · Teyarett · disponible |
| Médico | Mamadou Ba | `+22246102193` | `demo1234` | Cardiologie · Sebkha · disponible · email `demo04@allotabib.mr` |
| Médico | Cheikh Ould Brahim | `+22246103655` | `demo1234` | Gériatrie · Dar Naim · **no disponible** |
| Enfermera | Vatimetou Mint Brahim | `+22246114620` | `demo1234` | Soins palliatifs · Tevragh Zeina · disponible |

Todos los profesionales del seed usan la contraseña `demo1234`.

### Crear más administradores

```bash
npm run create-admin
```

Pide teléfono y contraseña por la terminal (la contraseña no se ve al escribir) y permite crear varios seguidos. La contraseña no se guarda en ningún fichero ni en el historial, solo su hash en la base de datos. Si el número ya es admin, ofrece cambiarle la contraseña; si es de un profesional, lo rechaza.

Al iniciar sesión, el teléfono puede escribirse con o sin `+222` y con espacios. Los profesionales con email también pueden entrar con él (p. ej. `demo01@allotabib.mr`).

Los datos de ejemplo están pensados para probar todos los estados: 15 disponibles, de los que 12 tienen posición en vivo, 2 tienen la posición **obsoleta** y 1 **no tiene posición** (permiso denegado → aparece en el centro de su zona habitual). Las posiciones "en vivo" se vuelven obsoletas a los 5 min y los profesionales pasan a no disponibles a las 6 h. **Vuelve a ejecutar `npm run seed` para refrescar la demo**: es idempotente y solo modifica los perfiles de ejemplo (no borra los profesionales registrados).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL. |
| `AUTH_SECRET` | Secreto de Auth.js (`npx auth secret`). Obligatorio. |
| `AUTH_TRUST_HOST` | `true` detrás de un proxy o en producción. |
| `NEXT_PUBLIC_MAP_STYLE_LIGHT` / `NEXT_PUBLIC_MAP_STYLE_DARK` | URL del estilo de mapa claro / oscuro (por defecto CARTO Positron / Dark Matter, sin API key). Se pueden cambiar a MapTiler o Stadia sin tocar código. |
| `NEXT_PUBLIC_MAP_STYLE_VOYAGER` | Estilo «Couleurs» del selector de mapa (por defecto CARTO Voyager). |
| `NEXT_PUBLIC_MAP_SATELLITE_TILES` | Teselas de la vista «Satellite» (por defecto Esri World Imagery). Para uso comercial, mejor MapTiler o Mapbox con clave. |
| `STORAGE_DRIVER` | `local` (único implementado). |
| `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | Credenciales del admin que crea el seed. |

## Zonas (moughataas)

`prisma/seed/zones.geojson` contiene las 9 moughataas (Tevragh Zeina, Ksar, Teyarett, Toujounine, Dar Naim, Arafat, El Mina, Sebkha, Riyad) con su nombre en francés y en árabe.

> ⚠️ **Los polígonos son aproximados y simplificados**: sirven para calcular la zona de un profesional, no son límites administrativos oficiales. Para corregirlos, edita las coordenadas (`[lng, lat]`) en `prisma/seed/zones.geojson` (por ejemplo con [geojson.io](https://geojson.io)) y vuelve a ejecutar `npm run seed`. El centro de cada zona se recalcula automáticamente (centroide).

La zona de un profesional disponible se calcula con point-in-polygon a partir de su posición. Si no hay posición, se usa la zona que eligió al registrarse.

## Geolocalización

- Al activar **Disponible** se pide permiso de ubicación (`watchPosition`, alta precisión). La posición se envía como máximo cada 20 s, y solo si se ha movido más de 20 m o han pasado 60 s.
- El servidor rechaza posiciones fuera de Nuakchot o con una precisión peor de 500 m. Solo se guarda la última posición, nunca el historial.
- Sin permiso, el profesional sigue disponible y aparece en el centro de su zona habitual, con un aviso que explica cómo activar la ubicación.
- **Modo manual**: en su panel, el profesional elige **Automatique (GPS)** o **Manuelle**. En manual toca el mapa o arrastra el marcador para indicar dónde está. La posición se envía al momento y se reenvía cada 60 s mientras siga disponible, para que no se marque como obsoleta. También debe estar dentro de Nuakchott, pero no se comprueba la precisión. El modo se recuerda en el dispositivo. Si el GPS falla (fuera de Nuakchott, sin permiso o impreciso), aparece el botón «Indiquer ma position manuellement». El admin ve la marca «Position manuelle» en la tarjeta y en la ficha (campo `locationManual`).
- Wake Lock API (si el navegador la soporta) para que no se apague la pantalla, con un interruptor para desactivarla.
- Caducidad sin cron: en cada consulta se compara la fecha. Sin posición en 5 min → "position obsolète". Sin actividad en 6 h → no disponible.
- En desarrollo (`NODE_ENV` distinto de `production`), los perfiles del seed que están disponibles se renuevan solos: no caducan y su posición sigue «en vivo».

> 🧪 **Para probar desde fuera de Mauritania**, usa el modo **Manuelle**: con el GPS real la posición se rechaza por estar fuera de Nuakchott.

> 🔒 **La geolocalización del navegador requiere HTTPS en producción.** En local funciona en `http://localhost`. Para probarla desde un móvil en la red local, usa un túnel HTTPS (p. ej. `ngrok http 3000` o `cloudflared`).

## Estructura

```
prisma/            schema.prisma, migraciones, seed.ts, seed/zones.geojson, seed/data.ts
messages/          fr.json (por defecto), ar.json
src/
  auth.ts, auth.config.ts, middleware.ts   Auth.js + protección de /pro/* y /admin/*
  i18n/            configuración de next-intl (idioma por cookie)
  lib/             prisma, storage, geo, validation (zod), professionals, phone, hooks…
  app/             páginas (/, /login, /register, /pro, /pro/profile, /admin, /admin/professionals) y API
  components/
    ui/            GlassCard, Button, Input, Chip, Modal, BottomSheet, Skeleton, Toast, Switch…
    map/           BaseMap, ZonesLayer, ProfessionalMarker, ClusterMarker, PulseDot, ProMap, ZonePickerMap
    professional/  RegisterWizard, ProDashboard, AvailabilityToggle, ProfileEditor, ProfessionalCard…
    admin/         AdminMapView, AdminMap, SearchBar, ProfessionalsDirectory, AdminNav
```

### API

| Método y ruta | Acceso |
|---|---|
| `POST /api/register` (multipart: `data` JSON + `photo`) | público |
| `GET` / `PATCH /api/me` (el PATCH con `newPassword` cambia la contraseña) | PROFESSIONAL |
| `POST /api/me/photo`, `POST /api/me/availability`, `POST /api/me/location` | PROFESSIONAL |
| `GET /api/admin/available?zone=&type=&specialty=&lang=&vehicle=&bbox=` | ADMIN |
| `GET /api/admin/professionals?q=&type=&specialty=&zone=&available=&page=&sort=` | ADMIN |
| `GET /api/admin/professionals/[id]` | ADMIN |
| `GET /api/zones`, `GET /api/specialties?type=` | público |
| `GET /api/files/[name]` (fotos) | con sesión |

Todas las rutas validan con zod. Los datos y el teléfono de los profesionales solo se devuelven al admin (y a cada profesional los suyos).

## Decisiones tomadas

- **Idioma por cookie** (`NEXT_LOCALE`) en lugar de prefijo en la URL: así las rutas `/pro` y `/admin` y el middleware de roles son más simples. Francés por defecto y árabe con `dir="rtl"` completo.
- **Versiones fijadas**: Next 15.5, Prisma 6, Tailwind 3.4 (con `tailwind.config.ts`, como se pidió), MapLibre 5 y zod 3. Las majors más recientes (Prisma 7, Tailwind 4, etc.) cambian APIs.
- **Fotos**: `sharp` las recorta en cuadrado, las reduce a un máximo de 600×600 y las guarda en WebP en `public/uploads/`. Se sirven por `/api/files/[name]` con sesión obligatoria (no son públicas, y así también funcionan con `next start`, que no sirve ficheros añadidos a `public/` después del build). Toda la E/S pasa por `src/lib/storage.ts`: para usar S3, implementa otro `StorageDriver`.
- **Avatares del seed**: generados (silueta + iniciales), sin fotos de personas reales.
- **WhatsApp**: si el profesional no indicó un número de WhatsApp, el botón usa su teléfono principal.
- **Lista ↔ mapa (estilo Airbnb)**: por defecto la lista se actualiza al mover el mapa. Si se desactiva "Mettre à jour en déplaçant la carte", aparece el botón **"Rechercher dans cette zone"**. Al buscar una moughataa, la lista muestra los profesionales de esa zona, ordenados por distancia a su centro.
- **Filtros**: tipo, especialidad, idioma y vehículo se aplican en el servidor. El nombre y el área visible se filtran en el cliente, para que el mapa no se recargue con cada movimiento (la API también acepta `bbox` y `zone`).
- **"Sin actividad" (6 h)**: se toma la fecha más reciente entre la activación de la disponibilidad y la última posición recibida.
- **Tipos de mapa (como Google Maps)**: *Par défaut* (claro u oscuro según el tema), *Clair*, *Couleurs*, *Sombre* y *Satellite* (imagen de Esri + etiquetas vectoriales de Voyager, con el árabe bien escrito). El selector está abajo a la izquierda en escritorio y es un botón de capas en móvil. La elección se recuerda en el dispositivo. Las miniaturas son imágenes estáticas en `public/map-styles/`. Las teselas **raster** de CARTO ahora requieren API key, así que solo se usan sus estilos vectoriales.
- **Árabe en el mapa**: se usa el plugin RTL de MapLibre (`public/vendor/mapbox-gl-rtl-text-0.3.0.js`, servido localmente). Sin él, las etiquetas árabes salen con las letras sueltas y al revés.
- **Mapas** cargados solo en cliente (`dynamic(..., { ssr: false })`), con `maxBounds` alrededor de Nuakchot y la atribución OSM/CARTO siempre visible.

## Calidad

```bash
npm run typecheck   # TypeScript estricto
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm run build
```