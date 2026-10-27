# TODO — ALLO TABIB (الو طبيب)

Registro de lo hecho y lo pendiente. Los puntos están numerados para poder referirse a ellos (p. ej. «P3» o «H2.4»).

## Pendiente

1. [ ] **Probar el selector de mapas dentro de la app**: el código compila y los estilos se han comprobado fuera de la app (miniaturas y satélite híbrido sin errores). Falta la prueba completa en el navegador, que no se pudo hacer porque Docker se cayó (ver P2).
2. [ ] **Docker Desktop caído y disco casi lleno**: el motor de Docker responde con error 500, así que PostgreSQL no está accesible. El disco C: está al 98 % (11 GB libres). Liberar espacio y reiniciar Docker Desktop.
3. [ ] **Error de hidratación intermitente (React #418)**: solo en producción, en la parte común a todas las páginas (layout), entre 0 y 7 de cada 30 cargas. React lo corrige solo y no se nota nada. No aparece en desarrollo. Probado sin éxito: metadatos bloqueantes (`htmlLimitedBots`).
4. [ ] **Despliegue con HTTPS**: obligatorio para la geolocalización en producción.
5. [ ] **Polígonos oficiales de las moughataas**: los actuales son aproximados (`prisma/seed/zones.geojson`).
6. [ ] **Imagen de satélite en producción**: Esri World Imagery es gratuita con atribución, pero su uso comercial requiere una cuenta de ArcGIS. Alternativas: MapTiler Satellite o Mapbox (con clave). Se cambia con `NEXT_PUBLIC_MAP_SATELLITE_TILES`.
7. [ ] **Fotos en S3**: implementar otro `StorageDriver` en `src/lib/storage.ts` si se despliega en varias instancias o sin disco persistente.
8. [ ] **Tests en el repositorio**: los tests E2E (API + Playwright) se han ejecutado fuera del proyecto; conviene moverlos a `tests/` con un script `npm test`.
9. [ ] **Configuración de Prisma**: `package.json#prisma` está obsoleto (aviso de Prisma 6); migrar a `prisma.config.ts`.
10. [ ] **Nombres internos**: la base de datos, el contenedor (`homemed_db`) y la carpeta del proyecto siguen llamándose «homemed». No se ve en la web; se puede cambiar más adelante (requiere migrar los datos).
11. [ ] **Probar en el navegador el mapa con todos los profesionales** (H6): compila y pasa el lint, pero falta verlo en la app con datos (Docker, ver P2).
12. [ ] **Verificación de profesionales en la app**: la portada explica que verificamos a cada profesional (persona real, médico/enfermero), pero la app no tiene ese paso: no hay campo «verificado» ni pantalla para aprobar en el admin, y un profesional recién registrado ya aparece en el mapa.
13. [ ] **Número de contacto real**: la portada usa `+222 22 33 44 11` (`CONTACT_PHONE` en `src/lib/constants.ts`); cambiarlo por el definitivo.

## Ideas (no pedidas)

1. Estilo de mapa propio con la paleta de la app (salvia / pizarra / arena), editado con Maputnik.
2. PWA (instalable en el móvil del profesional) para que el panel funcione como una app.
3. Aviso al profesional cuando lleve muchas horas disponible (antes de la desconexión automática de las 6 h).

## Hecho

### H8 — 2026-10-17 — Portada nueva
1. [x] Portada con el número de contacto en grande (bloque coral con Appeler / WhatsApp), sección **pacientes** (3 pasos: llamas → buscamos al profesional → viene a casa, y banda azul con el número) y sección **sanitarios** con nuestra forma de trabajar en 5 pasos: registro → verificación → activar disponibilidad (solo se contacta a los disponibles) → te llamamos y propones sí/no (con ejemplo de llamada) → cuantas más visitas aceptas, más te llamamos.
2. [x] Pie con el número y el acceso al espacio de administración. Textos en francés y árabe.
3. [x] El coral se usa como color de acento (con texto oscuro encima, porque el blanco no llega al contraste mínimo).

### H7 — 2026-10-17 — Paleta marfil / azul / coral
1. [x] Nueva paleta en toda la web: fondo **Warm Ivory** #EAE6DE, principal **Deep Editorial Blue** #226192 y acento **Coral Orange** #EF8557. Los tokens conservan sus nombres (`sage` = azul principal, `slate` = verde azulado de enfermeros, `terra` = avisos en coral oscurecido #A8461F para que el texto se lea; `coral` = coral puro).
2. [x] Modo oscuro adaptado: fondo azul noche #121A22, texto marfil, azul aclarado #6FA8DC.
3. [x] Estados: verde #15703B y rojo carmesí #C62828 (distinto del coral). El interruptor de disponibilidad del profesional pasa al verde de estado.
4. [x] **Logo nuevo: maletín médico** (a partir de una imagen generada con ChatGPT, redibujada como SVG): fondo azul en degradado, maletín marfil con asa clara y cruz coral en un círculo. En `public/logo.svg`, `src/app/icon.svg` y `LogoMark`. Sustituye al bocadillo de llamada de H4.2.
5. [x] Contraste comprobado: todos los textos ≥ 4,5:1 sobre su fondo, en claro y oscuro.

### H6 — 2026-10-17 — Todos los profesionales en el mapa
1. [x] El mapa del admin muestra a **todo el mundo**, no solo a los disponibles (`/api/admin/available?all=true`).
2. [x] No disponibles marcados en gris: foto en escala de grises, borde y punto de estado grises, más tenues y por debajo de los disponibles. En la tarjeta, etiqueta «Non disponible» y «Dans sa zone habituelle».
3. [x] Clusters con insignia verde con el número de disponibles del grupo; atenuados si no hay ninguno.
4. [x] Lista: primero los disponibles; contador «N professionnels · M disponibles».
5. [x] Filtro «Disponibles uniquement» para volver a la vista anterior.
6. [x] Quien no tiene posición se coloca cerca del centro de su zona habitual con un desplazamiento estable (120–450 m), para que no se apilen todos en el mismo punto.
7. [x] Estado en **verde** (disponible) / **rojo** (no disponible), colores nuevos `online` / `offline` en la paleta: borde y punto del marcador, barra lateral, aro de la foto y etiqueta en las tarjetas y en la ficha; los clusters llevan un anillo repartido en verde y rojo según la proporción de disponibles (como un gráfico de tarta). Tras cambiar `tailwind.config.ts` hay que reiniciar `next dev`. Sustituye al gris del punto 2.

### H5 — 2026-10-13 — Crear administradores
1. [x] Comando `npm run create-admin` (`scripts/create-admin.ts`): interactivo, contraseña oculta, sin guardarla en ficheros ni historial (solo el hash en la BD); crea varios seguidos; si el número ya es admin ofrece cambiar la contraseña; rechaza números de profesionales.

### H4 — 2026-10-13 — Nombre, logo y estilos de mapa
1. [x] Nombre de la web: **ALLO TABIB** en francés y **الو طبيب** en árabe, en la cabecera, los textos y el título de la pestaña. Claves internas (`allotabib.*`), emails de demo (`@allotabib.mr`) y nombre del paquete actualizados.
2. [x] **Logo SVG**: bocadillo de llamada («Allo») con cruz médica («Tabib») y ondas de señal, con el degradado salvia → pizarra. En `public/logo.svg`, como icono de la pestaña (`src/app/icon.svg`) y como componente (`LogoMark` / `Logo`, con «TABIB» / «طبيب» en verde salvia).
3. [x] **Selector de tipo de mapa** como en Google Maps: *Par défaut* (sigue el tema), *Clair*, *Couleurs* (CARTO Voyager), *Sombre* y *Satellite* (Esri + etiquetas vectoriales, árabe incluido). En escritorio, miniatura «Calques» abajo a la izquierda; en móvil, botón de capas. También en el mapa del profesional (útil para la posición manual). Se recuerda en el dispositivo y lo comparten todos los mapas.
4. [x] Miniaturas del selector generadas a partir del propio mapa (`public/map-styles/*.webp`), sin depender de servicios externos.
5. [x] Contornos de las zonas en claro sobre fondos oscuros (Sombre, Satellite).
6. [x] Descubierto: las teselas **raster** de CARTO ahora requieren API key. Se evitan; solo se usan sus estilos vectoriales, que siguen siendo gratuitos.

### H3 — 2026-10-13 — Árabe en el mapa
1. [x] Etiquetas árabes del mapa con las letras sueltas y al revés → registrado el plugin RTL de MapLibre (`@mapbox/mapbox-gl-rtl-text` 0.3.0), servido localmente en `public/vendor/`. Afecta a todos los mapas.

### H2 — 2026-10-13 — Español fuera + posición manual
1. [x] Eliminado el español: `messages/es.json`, el idioma en el selector, la columna `Specialty.nameEs` (migración `remove_es_add_manual_location`) y los textos del seed. Quien tuviera la cookie `es` pasa a francés.
2. [x] **Posición manual** para el profesional: selector *Automatique (GPS) / Manuelle*; tocar el mapa o arrastrar el marcador; envío inmediato y reenvío cada 60 s; el modo se recuerda; botón «Indiquer ma position manuellement» cuando el GPS falla.
3. [x] Campo `locationManual` y marca «Position manuelle» en la tarjeta y la ficha del admin.
4. [x] Corregido: un cambio manual hecho durante un envío en curso se perdía.
5. [x] Login: botón desactivado hasta que la página carga del todo y `method="post"` (la contraseña nunca puede acabar en la URL).

### H1 — 2026-10-12 — Primera versión completa
1. [x] Proyecto Next.js 15 + TypeScript + Tailwind, Prisma + PostgreSQL (docker-compose, puerto 5433), Auth.js v5 (teléfono o email + contraseña, roles PROFESSIONAL / ADMIN).
2. [x] Modelo de datos, migración inicial y seed: 9 moughataas, 17 especialidades, admin y 30 profesionales ficticios con avatares generados.
3. [x] Registro por pasos con foto (recorte cuadrado; WebP 600×600), validación zod en cliente y servidor.
4. [x] Panel del profesional: disponibilidad, posición GPS (cada 20 s como máximo; 20 m / 60 s), Wake Lock, mapa propio, caducidad sin cron (5 min / 6 h).
5. [x] Mi perfil: edición, cambio de foto, vista previa de la tarjeta y cambio de contraseña.
6. [x] Mapa del admin estilo Airbnb: lista ↔ mapa, marcadores con foto, clusters, búsqueda por moughataa, filtros, «Rechercher dans cette zone», refresco cada 20 s, bottom sheet en móvil.
7. [x] Ficha completa con Appeler / WhatsApp / copiar número; lista de profesionales con rejilla/tabla, búsqueda, filtros, orden y paginación.
8. [x] Francés y árabe (RTL completo), modo claro/oscuro, diseño de cristal con paleta apagada.
9. [x] Pruebas E2E de API (32 checks) y de interfaz en Chrome (móvil 375 px, escritorio, árabe, oscuro).
10. [x] Correcciones durante las pruebas: recentrado del mapa del profesional, desplegable de zonas tapado por los filtros, filtros que no pasaban de línea, contador «Aucun disponible» mientras cargaba, doble margen en campos con prefijo.

