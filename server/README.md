# Servidor de sincronización

API opcional para que los teléfonos envíen los nidos solos cuando hay señal. **La app funciona igual sin servidor**: mientras no exista, los datos se juntan con archivos en el modo coordinador.

- **Tecnología:** Node.js + Fastify + PostgreSQL (PostGIS opcional). Todo con licencias libres.
- **Reglas compartidas:** usa las mismas reglas de consolidación que el modo coordinador (`src/domain/consolidacion.ts`), así que un nido se trata igual venga por archivo o por el servidor.
- **Seguridad:** cada teléfono tiene su propio token. En la base solo se guarda su huella SHA-256, y un teléfono solo puede enviar a nombre de su propio código.
- **Nada se pierde:** las versiones reemplazadas van a `nidos_historial` y los casos dudosos a `conflictos`.

## Probar sin instalar nada

```bash
cd server
npm install
npm run demo
```

Arranca en http://localhost:3000 con PostgreSQL en memoria (PGlite) y un teléfono de prueba `B07` con el token `demo-B07`. Los datos se pierden al cerrarlo.

## Instalar en un servidor (Docker)

Necesitas un servidor Linux con Docker.

```bash
cd server
cp .env.ejemplo .env        # cambia POSTGRES_PASSWORD
docker compose up -d --build
```

Dar de alta cada teléfono. El token se muestra **una sola vez**; se escribe en la app, en *Ajustes → Servidor de sincronización*:

```bash
docker compose exec api node_modules/.bin/tsx server/src/crearDispositivo.ts B07 "Ana López"
```

Volver a ejecutarlo con el mismo código genera un token nuevo y anula el anterior (por ejemplo, si se pierde un teléfono).

### HTTPS es obligatorio

La app está publicada en `https://`, y los navegadores no dejan que una página `https://` llame a un servidor `http://`. Pon la API detrás de un proxy con certificado gratuito, por ejemplo [Caddy](https://caddyserver.com/) (Apache 2.0):

```
# /etc/caddy/Caddyfile
nidos.tu-dominio.org {
    reverse_proxy localhost:3000
}
```

Caddy obtiene y renueva el certificado de Let's Encrypt solo. En la app se usa la dirección `https://nidos.tu-dominio.org`.

## Sin Docker

Con PostgreSQL 14 o superior ya instalado:

```bash
cd server
npm install
DATABASE_URL=postgres://usuario:clave@localhost:5432/nidos npm start
```

| Variable | Qué hace | Valor por defecto |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a PostgreSQL | (obligatoria) |
| `PORT` | Puerto de la API | `3000` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma | `https://eddywong4.github.io` |
| `POSTGIS` | `1` agrega la columna geográfica `ubicacion` (requiere PostGIS) | apagado |

Las migraciones (`migraciones/*.sql`) se aplican solas al arrancar.

## API

| Método | Ruta | Token | Qué hace |
| --- | --- | --- | --- |
| GET | `/api/salud` | No | Comprueba que el servidor responde |
| POST | `/api/sync/push` | Sí | Recibe un paquete de nidos (mismo formato que el archivo de entrega) |
| GET | `/api/sync/catalogos` | Sí | Catálogos (especies, municipios…) |

Respuesta de `push`: `{ aceptados: [{id, version}], conflictos: [{id, folio, motivo}], rechazados: [{folio, motivo}] }`.

## Consultas útiles

```sql
-- Nidos por especie
SELECT especie, count(*) FROM nidos WHERE NOT eliminado GROUP BY especie;

-- Éxito de eclosión promedio (el nido completo está en la columna JSON `datos`)
SELECT especie,
       round(avg((datos->'analisis'->>'huevosEclosionados')::numeric * 100 /
         nullif((datos->'analisis'->>'huevosEclosionados')::numeric
              + (datos->'analisis'->>'huevosSinDesarrollo')::numeric
              + (datos->'analisis'->>'huevosConDesarrolloAparente')::numeric, 0)), 1) AS exito
FROM nidos WHERE NOT eliminado GROUP BY especie;

-- Conflictos por revisar
SELECT id, motivo, folio, recibido_de, fecha FROM conflictos WHERE NOT resuelto;
```

## Pruebas

```bash
npm test          # API completa contra PostgreSQL en memoria
npm run typecheck
```
