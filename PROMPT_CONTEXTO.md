# Contexto del proyecto: ALLO TABIB (الو طبيب)

Eres mi asistente en el desarrollo de **ALLO TABIB**, una aplicación web que ya existe y funciona. Este documento te da todo el contexto. Léelo entero antes de responder y úsalo como referencia durante toda la conversación. Si algo de lo que te pida contradice lo que pone aquí, avísame antes de seguir.

---

## 1. Qué es y para quién

ALLO TABIB ("Allo, doctor" en árabe dialectal) es la web de una empresa de **Nuakchot (Mauritania)** que coordina **médicos y enfermeros que hacen visitas a domicilio** fuera de su horario laboral.

Funcionamiento del negocio:

1. Un **paciente** llama por teléfono o escribe por WhatsApp al número del centro de llamadas. **El paciente no usa la web**: no tiene cuenta ni app.
2. Un **administrador** (operador del centro de llamadas) atiende la llamada y abre la web. Ve un **mapa de Nuakchot** con los profesionales y su ubicación en tiempo real. Busca por barrio (moughataa), filtra por tipo, especialidad, idioma y vehículo, abre la ficha del profesional y lo **llama (`tel:`) o le escribe por WhatsApp** para proponerle la visita.
3. El **profesional** (médico o enfermero) se registra en la web, tiene un perfil con foto y un botón **Disponible / No disponible**. Mientras está disponible, la web comparte su ubicación (GPS o manual). Cuando le llaman, acepta o rechaza la visita por teléfono.

**Fuera del alcance (no existe, no lo añadas salvo que te lo pida):** cuentas de paciente, asignación de avisos dentro de la web, chat, pagos, valoraciones, historial de posiciones, aprobación de cuentas (las cuentas quedan activas al registrarse).

Roles: `PROFESSIONAL` y `ADMIN`. No hay más.

Idiomas de la interfaz: **francés (por defecto)** y **árabe (RTL completo)**. El español se eliminó a propósito. Los comentarios del código y la documentación interna (README, TODO) están **en español**.

---

## 2. Stack y versiones (fijadas a propósito)

| Pieza | Versión / detalle |
|---|---|
| Framework | **Next.js 15.5** (App Router), React 19.1, TypeScript estricto |
| Estilos | **Tailwind CSS 3.4** con `tailwind.config.ts` (NO Tailwind 4) |
| BD | **PostgreSQL 16** (Docker, puerto **5433**) + **Prisma 6.19** (NO Prisma 7) |
| Auth | **Auth.js v5** (`next-auth@5.0.0-beta`), proveedor Credentials, sesión JWT (30 días), bcryptjs |
| Mapas | **MapLibre GL 5** vía `react-map-gl/maplibre`, estilos vectoriales CARTO (sin API key), supercluster, `@turf/boolean-point-in-polygon` |
| Formularios | react-hook-form + **zod 3** (NO zod 4) + `@hookform/resolvers` |
| i18n | **next-intl 4**, idioma por **cookie** `NEXT_LOCALE` (sin prefijo en la URL) |
| Datos en cliente | SWR |
| UI | lucide-react (iconos), framer-motion (animaciones), sonner (toasts), react-easy-crop (recorte de foto) |
| Imágenes | sharp (servidor) |

Las majors más recientes (Prisma 7, Tailwind 4, zod 4…) cambian APIs: **no propongas actualizar** salvo que te lo pida.

Scripts de `package.json`:

```
dev, build, start, lint (next lint), typecheck (tsc --noEmit),
seed (tsx prisma/seed.ts), create-admin (tsx scripts/create-admin.ts), postinstall (prisma generate)
```

Puesta en marcha:

```bash
cp .env.example .env          # cambiar AUTH_SECRET (npx auth secret)
docker compose up -d          # PostgreSQL en localhost:5433 (contenedor homemed_db)
npm install
npx prisma migrate dev
npm run seed                  # zonas, especialidades, admin y 30 profesionales ficticios
npm run dev                   # http://localhost:3000
```

Entorno de desarrollo: **Windows 11**, VS Code. La carpeta del proyecto, la BD y el contenedor se llaman todavía `homemed` (nombre antiguo; no se ve en la web).

---

## 3. Estructura de carpetas

```
prisma/
  schema.prisma
  migrations/            20261012231241_init, 20261013120000_remove_es_add_manual_location
  seed.ts                seed idempotente
  seed/data.ts           especialidades, 30 profesionales ficticios, bios
  seed/zones.geojson     9 moughataas (polígonos aproximados) con nombre fr/ar
messages/
  fr.json, ar.json       namespaces: common, types, sex, languages, locales, time, location,
                         status, errors, home, login, register, fields, pro, profile, admin,
                         detail, list, map
public/
  logo.svg, map-styles/*.webp (miniaturas del selector de mapa),
  uploads/ (fotos .webp), vendor/mapbox-gl-rtl-text-0.3.0.js (plugin RTL del mapa)
scripts/create-admin.ts  creación interactiva de admins
src/
  auth.ts                NextAuth + Credentials (Prisma, bcrypt) — solo Node
  auth.config.ts         config compatible con Edge (callbacks jwt/session con id y role)
  middleware.ts          protección por rol de /pro/* y /admin/*
  global.d.ts, types/next-auth.d.ts
  i18n/request.ts        locale desde cookie (o accept-language "ar"), timeZone Africa/Nouakchott
  i18n/actions.ts        server action setLocale()
  lib/
    constants.ts         configuración central (ver §7)
    types.ts             DTOs compartidos API ↔ cliente
    validation.ts        TODOS los esquemas zod (cliente y servidor)
    professionals.ts     include de Prisma, caducidad, mapeo a DTOs (server-only)
    geo.ts               haversine, point-in-polygon, bbox
    phone.ts             normalización de teléfonos +222
    storage.ts           capa de almacenamiento de fotos (driver local)
    api.ts               jsonError, zodError, requireRole (server-only)
    hooks.ts             useZones, useSpecialties, useNow, useTimeAgo, useErrorText
    mapStyles.ts         estilos de mapa seleccionables
    prisma.ts, utils.ts  (cn, localized, zoneName, fullName, initials, formatDistance, fetcher)
  app/
    layout.tsx           fuentes Inter + IBM Plex Sans Arabic, dir rtl/ltr, providers
    page.tsx             portada pública (redirige a /admin o /pro si hay sesión)
    login/, register/
    pro/page.tsx         panel del profesional
    pro/profile/page.tsx edición del perfil
    admin/page.tsx       mapa del admin
    admin/professionals/ directorio de profesionales
    api/...              ver §6
  components/
    ui/           GlassCard, Button/IconButton, Input, Chip, Modal, BottomSheet, Skeleton, Toast,
                  Switch, Avatar, EmptyState, Logo/LogoMark, LocaleSwitcher, ThemeToggle,
                  ThemeProvider, Backdrop, PublicHeader, LogoutButton
    map/          BaseMap, ZonesLayer, ProfessionalMarker, ClusterMarker, PulseDot, ProMap,
                  ZonePickerMap, MapStyleProvider, MapStyleSwitcher, useAnimatedPosition,
                  index.tsx (exporta los mapas con dynamic(..., { ssr: false }))
    professional/ RegisterWizard, ProDashboard, AvailabilityToggle, ProfileEditor, ProfileFields,
                  ProfessionalCard, ProfessionalDetail, ContactActions, PhotoPicker,
                  PasswordStrength, useLocationSharing, useWakeLock
    admin/        AdminMapView, AdminMap, SearchBar, ProfessionalsDirectory, AdminNav, Popover
```

---

## 4. Modelo de datos (Prisma)

```prisma
enum Role { PROFESSIONAL ADMIN }
enum ProfessionalType { DOCTOR NURSE }
enum Sex { MALE FEMALE }

model User {
  id           String  @id @default(cuid())
  role         Role    @default(PROFESSIONAL)
  phone        String  @unique          // formato +222XXXXXXXX
  email        String? @unique
  passwordHash String
  createdAt    DateTime @default(now())
  professional Professional?
}

model Professional {
  id, userId (@unique, onDelete: Cascade)
  type ProfessionalType
  firstName, lastName, birthDate, sex
  nni String @unique                     // Número Nacional de Identificación, 10 dígitos
  photoUrl String                        // /api/files/<uuid>.webp
  whatsapp String?                       // null → se usa el teléfono principal
  specialtyId Int → Specialty
  yearsExperience Int, workplace String, languages String[], bio String @default("")
  homeZoneId Int → Zone ("HomeZone")     // zona habitual elegida al registrarse
  hasVehicle Boolean
  isAvailable Boolean @default(false)
  availableSince DateTime?
  lat Float?, lng Float?, locationUpdatedAt DateTime?   // SOLO la última posición
  locationManual Boolean @default(false) // la posición la puso a mano (no GPS)
  currentZoneId Int? → Zone ("CurrentZone")  // calculada por point-in-polygon
  createdAt, updatedAt
  @@index([isAvailable]) @@index([currentZoneId]) @@index([type]) @@index([specialtyId])
}

model Specialty { id Int autoincrement, type ProfessionalType, nameFr, nameAr, @@unique([type, nameFr]) }
model Zone { id Int autoincrement, nameFr @unique, nameAr, centerLat, centerLng, polygon Json }
```

Los admins son solo un `User` con `role = ADMIN` (sin `Professional`).

**Especialidades (17):**
- DOCTOR: Médecine générale, Pédiatrie, Gynécologie, Cardiologie, Dermatologie, Gériatrie, Médecine interne, Urgences, Neurologie, Pneumologie.
- NURSE: Soins généraux, Soins à domicile, Pédiatrie, Gériatrie, Perfusions et injections, Pansements, Soins palliatifs.

**Zonas (9 moughataas):** Tevragh Zeina, Ksar, Teyarett, Toujounine, Dar Naim, Arafat, El Mina, Sebkha, Riyad. Polígonos **aproximados** (no oficiales) en `prisma/seed/zones.geojson`; el centro se recalcula (centroide) en el seed.

**Idiomas hablados** (`LANGUAGES`): `ar` (árabe), `hassaniya`, `fr`, `wo` (wolof), `ff` (pulaar), `snk` (soninké), `en`.

---

## 5. Lógica de negocio clave

### Disponibilidad y ubicación
- Al activar **Disponible**: `isAvailable = true`, `availableSince = now`.
- Al desactivar: se borran `lat`, `lng`, `locationUpdatedAt`, `currentZoneId`, `locationManual` (**no se guarda historial**).
- **Estado de la posición** (`LocationStatus`): `live` (< 5 min), `stale` ("position obsolète", > 5 min), `none` (sin posición).
- **Caducidad sin cron** (`expireStaleAvailability()` en `lib/professionals.ts`): se ejecuta antes de cada consulta relevante. Pasa a no disponible a quien lleva **6 h** sin actividad (la más reciente entre `availableSince` y `locationUpdatedAt`).
- En **desarrollo** (`NODE_ENV !== "production"`) los perfiles del seed disponibles (foto `/api/files/seed-*`) se renuevan solos: no caducan y su posición sigue "en vivo".
- Quien no tiene posición se muestra cerca del centro de su **zona habitual** con un desplazamiento estable por hash del id (120–450 m), para que no se apilen.
- La zona efectiva de un profesional es `currentZone` si tiene posición, si no `homeZone`.

### Compartir ubicación (`useLocationSharing`)
- **Modo automático (GPS):** `watchPosition` de alta precisión. Envía como máximo cada **20 s**, y solo si se ha movido **> 20 m** o han pasado **60 s**.
- **Modo manual:** el profesional toca el mapa o arrastra el marcador; se envía al instante y se reenvía cada 60 s. El modo se recuerda en `localStorage` (`allotabib.locationMode`). Si el GPS falla (sin permiso, fuera de Nuakchot, impreciso) aparece "Indiquer ma position manuellement".
- Estados: `idle | waiting | sharing | denied | unsupported | outside | inaccurate | manualUnset | error`.
- El servidor rechaza posiciones **fuera de Nuakchot** (`NKC_BOUNDS`) y, solo en GPS, con precisión peor de **500 m**.
- Sin permiso de ubicación el profesional sigue disponible (aparece en su zona habitual) con un aviso explicativo.
- **Wake Lock API** para que no se apague la pantalla, con interruptor.
- La geolocalización requiere **HTTPS** en producción (en `localhost` funciona). Para probar desde fuera de Mauritania hay que usar el modo manual.

### Teléfonos
- Formato canónico `+222` + 8 dígitos (`MR_PHONE_REGEX = /^\+222\d{8}$/`). `normalizePhone` acepta "22 33 44 55", "22222334455", "+222 22334455". `formatPhone` → `+222 22 33 44 55`. WhatsApp con `https://wa.me/<dígitos>`.
- Login con teléfono (con o sin +222, con espacios) **o** email.

### Fotos
- `sharp`: rotación EXIF, recorte cuadrado, máx. 600×600, WebP calidad 80, máx. 8 MB de entrada. Se guardan en `public/uploads/<uuid>.webp` y se sirven por **`/api/files/[name]` solo con sesión** (los datos de profesionales no son públicos; además `next start` no sirve ficheros añadidos a `public/` tras el build).
- Toda la E/S pasa por `StorageDriver` en `lib/storage.ts` (solo driver `local`; S3 es un punto de extensión pendiente).

### Validación
- Todos los esquemas zod están en `lib/validation.ts` y se comparten entre cliente y servidor.
- **Los mensajes de error de zod son claves de traducción** dentro del namespace `errors` (p. ej. `"phone"`, `"passwordMin"`, `"nniTaken"`), y `useErrorText()` las traduce.
- Reglas: nombre/apellido 2–60; edad 21–90; NNI 10 dígitos; contraseña ≥ 8 con letra y dígito; bio ≤ 300; experiencia 0–60; al menos 1 idioma.
- El registro es un **wizard de 6 pasos**: `type → personal → contact → professional → zone → access`, más la foto (obligatoria).

---

## 6. API (todas validan con zod, `runtime = "nodejs"`)

| Método y ruta | Acceso | Notas |
|---|---|---|
| `POST /api/register` | público | multipart: `data` (JSON) + `photo`. Errores por campo 409 (`phoneTaken`, `emailTaken`, `nniTaken`) |
| `GET /api/me` | PROFESSIONAL | devuelve `MeDTO` |
| `PATCH /api/me` | PROFESSIONAL | si el cuerpo trae `newPassword` cambia contraseña; si no, actualiza el perfil |
| `POST /api/me/photo` | PROFESSIONAL | cambia la foto y borra la anterior |
| `POST /api/me/availability` | PROFESSIONAL | `{ available: boolean }` |
| `POST /api/me/location` | PROFESSIONAL | `{ lat, lng, accuracy, manual }` → errores `outside`, `inaccurate`, `notAvailable` |
| `GET /api/admin/available` | ADMIN | `?zone&type&specialty(csv)&lang&vehicle&bbox&all` → `{ items: ProfessionalCardDTO[], updatedAt }` |
| `GET /api/admin/professionals` | ADMIN | `?q&type&specialty&zone&available&page&sort(name|recent|availability)` → paginado (12 por página) |
| `GET /api/admin/professionals/[id]` | ADMIN | `ProfessionalDetailDTO` |
| `GET /api/zones`, `GET /api/specialties?type=` | público | cache 5 min |
| `GET /api/files/[name]` | con sesión | fotos WebP |
| `/api/auth/[...nextauth]` | — | Auth.js |

Convenciones: errores con `jsonError(status, code, details)` → `{ error, details }`; validación → 422 `{ error: "validation", details: fieldErrors }`; `requireRole(role)` devuelve `{ session }` o `{ error }` listo para devolver. Los datos y el teléfono de los profesionales solo se devuelven al admin (y a cada profesional los suyos).

**DTOs** (`lib/types.ts`): `ProfessionalCardDTO` (tarjeta del mapa: datos básicos, posición mostrada, `locationStatus`, `locationManual`, zona efectiva), `ProfessionalDetailDTO` (+ birthDate, sex, nni, email, workplace, bio, homeZone, availableSince, createdAt), `MeDTO` (+ `realLat`, `realLng`, `currentZoneId`), `ZoneDTO`, `SpecialtyDTO`, `ProfessionalsPage`.

---

## 7. Constantes (`src/lib/constants.ts`)

- `CONTACT_PHONE = "+22249060000"` (número real del centro de llamadas)
- `NKC_CENTER = { lat: 18.0858, lng: -15.9785 }`, `NKC_ZOOM = 12`
- `NKC_BOUNDS` (área aceptada para posiciones) `[[-16.12, 17.9], [-15.75, 18.26]]`; `NKC_MAX_BOUNDS` (límites del mapa) algo más amplios
- `LOCATION_STALE_MS = 5 min`, `AVAILABILITY_TIMEOUT_MS = 6 h`
- `LOCATION_MIN_INTERVAL_MS = 20 s`, `LOCATION_MIN_DISTANCE_M = 20`, `LOCATION_MAX_SILENCE_MS = 60 s`, `LOCATION_MAX_ACCURACY_M = 500`
- `ADMIN_REFRESH_MS = 20 s`, `PAGE_SIZE = 12`
- `LOCALES = ["fr", "ar"]`, `DEFAULT_LOCALE = "fr"`, `LOCALE_COOKIE = "NEXT_LOCALE"`
- `MAP_RTL_PLUGIN_URL = "/vendor/mapbox-gl-rtl-text-0.3.0.js"`

---

## 8. Autenticación y rutas

- `auth.config.ts` es **Edge-compatible** (sin Prisma ni bcrypt) y lo usa el middleware; `auth.ts` añade el proveedor Credentials. El JWT y la sesión llevan `id` y `role`.
- `middleware.ts` (matcher `/admin/:path*`, `/pro/:path*`, `/login`, `/register`): `/admin/*` solo ADMIN, `/pro/*` solo PROFESSIONAL; sin sesión → `/login?callbackUrl=...`; rol equivocado → a su panel; con sesión en login/registro → a su panel. **Las API comprueban el rol por su cuenta** (no confían en el middleware).
- Login: formulario con `method="post"` y botón desactivado hasta hidratar (la contraseña nunca puede acabar en la URL).
- Admins: `npm run create-admin` (interactivo, contraseña oculta, solo se guarda el hash; si el número ya es admin ofrece cambiar la contraseña; rechaza números de profesionales).

**Credenciales de demo (seed):** admin `+22200000000` / `admin1234`; todos los profesionales del seed usan `demo1234` (p. ej. `+22246100000`, Mohamed Ould Abdallahi, también entra con `demo01@allotabib.mr`). El seed deja 15 disponibles: 12 con posición en vivo, 2 obsoletas, 1 sin posición. Es idempotente y solo toca los perfiles de ejemplo.

---

## 9. Pantallas

### Portada `/` (pública)
Número del centro de llamadas en grande en un bloque **coral** con botones Appeler / WhatsApp; sección **pacientes** (3 pasos: llamas → buscamos al profesional → viene a casa) y banda azul con el número; sección **sanitarios** en 5 pasos (registro → verificación → activar disponibilidad → te llamamos y aceptas o no, con un ejemplo de llamada → cuantas más aceptas, más te llamamos); pie con el número y acceso al espacio de administración. Si hay sesión redirige a `/admin` o `/pro`.

### Registro `/register`
Wizard de 6 pasos con animaciones (framer-motion, dirección según RTL), validación por paso, selector de foto con recorte (react-easy-crop), indicador de fuerza de contraseña, selector de zona en mapa (`ZonePickerMap`). Tras registrarse inicia sesión automáticamente.

### Panel del profesional `/pro`
Interruptor grande de disponibilidad (verde de estado), mapa propio (`ProMap`) con su posición, selector Automatique (GPS) / Manuelle, estado de la ubicación con "hace X s", zona actual, avisos de permisos, interruptor de Wake Lock, enlace a "Mon profil".

### Mi perfil `/pro/profile`
Edición de todos los campos (salvo tipo), cambio de foto, vista previa de la tarjeta tal como la ve el admin y cambio de contraseña.

### Mapa del admin `/admin` (pantalla principal, estilo Airbnb)
- Lista ↔ mapa sincronizados: hover en una tarjeta resalta el marcador y viceversa; clic en el marcador abre una tarjeta flotante (popup de cristal).
- Muestra a **todos** los profesionales (`all=true`): disponibles en **verde**, no disponibles en **rojo**, más tenues y por debajo. Filtro "Disponibles uniquement".
- Marcadores con foto, borde y punto de estado; `PulseDot` para posiciones en vivo; posiciones animadas (`useAnimatedPosition`).
- **Clusters** (supercluster, radio 56, maxZoom 15) con anillo tipo tarta verde/rojo según la proporción de disponibles e insignia con el número de disponibles.
- Barra de búsqueda: moughataa (centra el mapa y ordena la lista por distancia al centro de la zona), tipo, especialidades (multi), idioma, vehículo, nombre (filtro en cliente, sin acentos).
- "Mettre à jour en déplaçant la carte" (por defecto activado): la lista se filtra por el área visible; si se desactiva, aparece "Rechercher dans cette zone".
- Orden de la lista: disponibles primero, luego `live > stale > none`, luego distancia. Contador "N professionnels · M disponibles".
- Refresco cada 20 s (SWR, `keepPreviousData`).
- Ficha completa (`ProfessionalDetail`) con Appeler / WhatsApp / copiar número y marca "Position manuelle".
- En móvil: **bottom sheet** con la lista (peek de 84 px) y navegación inferior de 64 px.
- Filtros tipo/especialidad/idioma/vehículo se aplican en el servidor; nombre y área visible en el cliente (para no recargar al mover el mapa).

### Directorio `/admin/professionals`
Todos los registrados, vista rejilla/tabla, búsqueda (cada palabra en nombre o apellido, o teléfono/NNI si hay ≥ 3 dígitos), filtros (tipo, especialidad, zona, disponibilidad), orden (disponibilidad / nombre / recientes) y paginación de 12.

---

## 10. Mapas

- `BaseMap` común; todos los mapas se cargan solo en cliente con `dynamic(..., { ssr: false })`, con `maxBounds` alrededor de Nuakchot y la atribución OSM/CARTO siempre visible.
- **Selector de tipo de mapa** (como Google Maps), compartido por todos los mapas y recordado en el dispositivo (`MapStyleProvider`): `auto` (Positron o Dark Matter según el tema), `light` (Positron), `voyager` ("Couleurs"), `dark` (Dark Matter), `satellite` (Esri World Imagery + **solo las capas de símbolos** de Voyager con texto claro y halo oscuro, cargado de forma asíncrona con `loadHybridSatelliteStyle`). En escritorio: miniatura "Calques" abajo a la izquierda; en móvil: botón de capas. Miniaturas estáticas en `public/map-styles/`.
- Las teselas **raster** de CARTO ahora piden API key: solo se usan sus estilos **vectoriales**.
- **Plugin RTL de MapLibre** servido localmente: sin él las etiquetas árabes salen con las letras sueltas y al revés.
- `ZonesLayer` dibuja los polígonos de las moughataas; contornos claros sobre fondos oscuros (dark, satellite).

---

## 11. Diseño visual

- Estilo **"glass"** (cristal esmerilado): clases `.glass` y `.glass-strong` (bordes blancos translúcidos, `backdrop-blur-xl`, sombra `shadow-glass`), `rounded-2xl`, sombra `shadow-lift` para elementos elevados. Clases `.field` (inputs de 48 px) y `.label`.
- **Paleta marfil / azul / coral** definida como variables CSS RGB en `globals.css` y expuesta como tokens Tailwind (`rgb(var(--x) / <alpha-value>)`). **Los nombres de los tokens son históricos**:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg` | #EAE6DE (Warm Ivory) | #121A22 | fondo |
| `bg-soft` | #DFDACF | #1A2530 | fondo secundario |
| `ink` | #232A33 | marfil | texto |
| `muted` | #5F646B | #9AA3AD | texto secundario |
| `sage` | **#226192 Deep Editorial Blue** | #6FA8DC | color principal (¡es azul, no verde!) |
| `slate` | #1B6E73 verde azulado | #5FB3B8 | secundario / enfermeros / foco |
| `terra` | #A8461F coral oscurecido | #EF8557 | avisos y errores (legible) |
| `coral` | #EF8557 Coral Orange | igual | acentos y logo; **texto oscuro #121A22 encima** (el blanco no da contraste) |
| `online` | #15703B | #4CC27A | disponible |
| `offline` | #C62828 | #E5484D | no disponible |
| `line` | ink | blanco | bordes con opacidad (`border-line/10`) |

- Todo el texto cumple contraste ≥ 4,5:1 en claro y oscuro.
- Modo claro/oscuro con `darkMode: "class"`, preferencia `light | dark | system` en `localStorage("theme")` y un script inline en `<head>` para evitar parpadeo.
- Fuentes: **Inter** (latín) e **IBM Plex Sans Arabic** (árabe, automática con `html[lang="ar"]`). Títulos peso 600 con `letter-spacing: -0.01em` (0 en árabe).
- RTL: usar propiedades lógicas y variantes `rtl:`; los números de teléfono van con `dir="ltr"`.
- Animaciones: framer-motion, keyframes `pulse-ring` y `shimmer` (skeletons); respeta `prefers-reduced-motion`.
- Logo: maletín médico marfil sobre degradado azul con cruz coral en un círculo (`public/logo.svg`, `src/app/icon.svg`, componente `LogoMark` / `Logo`). Nombre: **ALLO TABIB** en francés, **الو طبيب** en árabe.
- Móvil primero: probado a 375 px; en Safari iOS el `input[type="date"]` tiene un arreglo específico en `globals.css`.

---

## 12. Variables de entorno

```
DATABASE_URL="postgresql://homemed:homemed@127.0.0.1:5433/homemed?schema=public&connect_timeout=20"
AUTH_SECRET=...                      # obligatorio (npx auth secret)
AUTH_TRUST_HOST=true
NEXT_PUBLIC_MAP_STYLE_LIGHT / _DARK / _VOYAGER   # URLs de estilos (CARTO por defecto)
NEXT_PUBLIC_MAP_SATELLITE_TILES      # Esri World Imagery por defecto
STORAGE_DRIVER="local"
SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD
```

`next.config.ts`: plugin de next-intl, `serverExternalPackages: ["sharp", "bcryptjs"]`, `serverActions.bodySizeLimit: "8mb"`.

---

## 13. Problemas conocidos y trampas

1. **Caché de Tailwind:** los cambios en `tailwind.config.ts` (p. ej. un color nuevo) no llegan a `next dev` aunque se reinicie; hay que tocar `globals.css` (o borrar `.next/cache`).
2. **No arrancar un segundo `next dev`**: yo suelo tener uno en :3000 y dos servidores comparten `.next` y se rompen. Para verificar usa `npm run typecheck` y `npm run lint`, o pídeme que mire el navegador.
3. **Error de hidratación intermitente (React #418)** solo en producción, en el layout, 0–7 de cada 30 cargas. React lo corrige y no se nota. Sin resolver (probado sin éxito: `htmlLimitedBots`).
4. Docker Desktop a veces se cae (error 500) y el disco C: está casi lleno.
5. `package.json#prisma` está obsoleto en Prisma 6 (aviso); falta migrar a `prisma.config.ts`.

---

## 14. Pendiente (TODO)

1. Probar en el navegador el selector de mapas y el mapa con todos los profesionales.
2. Despliegue con **HTTPS** (obligatorio para la geolocalización).
3. Polígonos **oficiales** de las moughataas.
4. Satélite en producción: Esri requiere cuenta ArcGIS para uso comercial → MapTiler o Mapbox.
5. Fotos en **S3** (nuevo `StorageDriver`) si hay varias instancias o no hay disco persistente.
6. Mover los tests E2E (API + Playwright, se ejecutaron fuera del repo) a `tests/` con `npm test`.
7. Migrar a `prisma.config.ts`.
8. Renombrar internamente "homemed" → "allotabib" (requiere migrar datos).
9. **Verificación de profesionales**: la portada dice que verificamos a cada profesional, pero no hay campo "verificado" ni pantalla de aprobación; un recién registrado ya sale en el mapa.
10. Número de contacto real en `CONTACT_PHONE`.

Ideas no pedidas: estilo de mapa propio con la paleta de la app (Maputnik); PWA para el profesional; aviso antes de la desconexión automática de las 6 h.

---

## 15. Cómo quiero que trabajes

- Responde en **español**. Los textos de la interfaz van siempre en **francés y árabe** (añade las claves en `messages/fr.json` **y** `messages/ar.json`; nunca texto fijo en los componentes).
- Sigue las convenciones existentes: comentarios breves en español, esquemas en `lib/validation.ts`, errores como claves de `errors`, DTOs en `lib/types.ts`, constantes en `lib/constants.ts`, `requireRole` en cada ruta de API, `server-only` en los módulos de servidor, `cn()` para clases, componentes de `components/ui` en lugar de HTML suelto.
- Usa los tokens de color de la paleta (no colores sueltos), respeta el modo oscuro y el RTL en todo lo que hagas.
- Privacidad: los datos de los profesionales no son públicos; no expongas teléfonos, NNI ni fotos sin sesión; no guardes historial de posiciones.
- No añadas dependencias ni cambies versiones mayores sin preguntarme.
- Cuando me des código, indica el archivo exacto y da el archivo completo o un cambio claramente delimitado.
- Si algo no está claro o falta información de un archivo concreto, pídemelo en vez de inventarlo.
