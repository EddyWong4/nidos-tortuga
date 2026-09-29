# Nidos de Tortuga

PWA *offline-first* para registrar nidos de tortuga marina en campo. Funciona 100% sin internet en Android e iOS. Los datos se juntan con archivos en el modo coordinador o, opcionalmente, con un servidor propio.

- **App:** https://eddywong4.github.io/nidos-tortuga/
- **Guía para observadores:** [docs/GUIA_INSTALACION.md](docs/GUIA_INSTALACION.md)
- **Plan del piloto:** [docs/PILOTO.md](docs/PILOTO.md)
- **Servidor opcional:** [server/README.md](server/README.md)
- **Plan del proyecto:** https://claude.ai/code/artifact/e7b67c7b-d382-4ccd-b060-474737fed811

## Cómo viajan los datos

```
Observador ──"Entregar datos"──► archivo .txt por WhatsApp/correo ──► Coordinador (importa, consolida, Excel)
     │
     └──(opcional, con señal)──► Servidor (API + PostgreSQL) — mismas reglas de consolidación
```

## Requisitos

- Node.js 20 o superior (desarrollado con Node 24)
- npm

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm test` | Pruebas unitarias (fórmulas, validaciones, base local) |
| `npm run typecheck` | Revisión de tipos |
| `npm run build` | Compila la PWA en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la PWA compilada (service worker incluido) |

El service worker solo se activa en la versión compilada (`build` + `preview`), no en `dev`.

## Probar en un teléfono

El GPS, la instalación y el modo sin conexión exigen HTTPS (salvo en `localhost`). Para probar en un teléfono real, publica `dist/` en un hosting con HTTPS (Cloudflare Pages o GitHub Pages).

En iPhone la app **debe instalarse** con Safari → Compartir → *Agregar a pantalla de inicio*. Si se abre en una pestaña, Safari puede borrar los datos tras 7 días sin uso; por eso la app bloquea la captura en ese caso.

## Publicación en GitHub Pages

Cada `push` a `main` corre `.github/workflows/deploy.yml`: revisa tipos, corre las pruebas, compila con la ruta `/<repositorio>/` y publica en `https://<usuario>.github.io/<repositorio>/`.

Configuración única en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Para probar localmente la versión de GitHub Pages (en Git Bash, `MSYS_NO_PATHCONV=1` evita que la ruta se convierta a ruta de Windows):

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/nidos-tortuga/ npx vite build
MSYS_NO_PATHCONV=1 BASE_PATH=/nidos-tortuga/ npx vite preview
```

## Estructura

```
src/
  domain/        Reglas del negocio sin interfaz: esquemas Zod, fórmulas, folio, catálogos, consolidación
  db/            Base local Dexie (IndexedDB) y repositorio con la cola outbox
  sync/          Paquetes, entrega por archivo, importación, respaldos, reportes, cliente del servidor
  composables/   Instalación PWA, GPS, borradores, almacenamiento persistente, consultas en vivo
  components/    Componentes de formulario, tarjetas, pasos y avisos
  views/         Pantallas (Ionic)
  theme/         Tema claro de alto contraste
server/          API opcional (Fastify + PostgreSQL); usa src/domain y src/sync/paquete.ts
docs/            Guía de instalación y plan del piloto
```

## Decisiones clave

- **La interfaz nunca habla con internet.** Lee y escribe la base local; cada cambio se anota en la `outbox`.
- **Llave interna UUID, folio legible `B07-0012`.** El código de dispositivo evita choques entre 100 teléfonos sin conexión.
- **Fechas en ISO (`AAAA-MM-DD`)** para no depender del idioma del teléfono.
- **Los campos calculados no se capturan:** se obtienen en `src/domain/formulas.ts`.
- **Borrado lógico:** ningún registro se pierde; el borrado viaja como un cambio más.
- **Cambios de esquema** = nueva `version()` en `src/db/database.ts`, nunca editar una versión publicada.

## Estado

- [x] Fase 1 · Base: proyecto, PWA instalable, base local, fórmulas y validaciones con pruebas, CI
- [x] Fase 2 · Captura (MVP): perfil del teléfono, formulario de 3 pasos con GPS y borradores, lista con búsqueda y filtros, detalle, edición, análisis y borrado lógico
- [x] Fase 3 · Modo coordinador: entrega por archivo, importación y consolidación, conflictos (incluido "conservar los dos"), reportes Excel/CSV, respaldos diarios y restauración
- [x] Fase 4 · Despliegue: GitHub Pages con CI, guía de instalación en la app y en `docs/`, QR para compartir
- [ ] Fase 5 · Piloto: plan listo en [docs/PILOTO.md](docs/PILOTO.md); falta hacerlo en campo
- [x] Fase 6 · Servidor y sincronización: API, migraciones, tokens por teléfono, envío automático desde la app (apagado por defecto). Falta instalarlo en un servidor con HTTPS
