-- Esquema inicial del servidor de Nidos de Tortuga.
-- El nido completo se guarda en `datos` (JSON, igual que en el teléfono); las columnas sueltas son para consultar y filtrar.

CREATE TABLE IF NOT EXISTS dispositivos (
  codigo        text PRIMARY KEY,               -- B07
  observador    text NOT NULL,
  token_sha256  text NOT NULL UNIQUE,           -- nunca se guarda el token, solo su huella
  activo        boolean NOT NULL DEFAULT true,
  creado        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nidos (
  id              uuid PRIMARY KEY,
  folio           text NOT NULL UNIQUE,
  campamento_id   text NOT NULL,
  device_id       text NOT NULL,
  version         integer NOT NULL,
  fecha_muestreo  date NOT NULL,
  especie         text NOT NULL,
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  eliminado       boolean NOT NULL DEFAULT false,
  datos           jsonb NOT NULL,
  actualizado     timestamptz NOT NULL,
  recibido        timestamptz NOT NULL DEFAULT now(),
  recibido_de     text NOT NULL
);
CREATE INDEX IF NOT EXISTS nidos_fecha_idx ON nidos (fecha_muestreo);
CREATE INDEX IF NOT EXISTS nidos_especie_idx ON nidos (especie);

-- Versiones reemplazadas: nada se pierde.
CREATE TABLE IF NOT EXISTS nidos_historial (
  id        bigserial PRIMARY KEY,
  nido_id   uuid NOT NULL,
  version   integer NOT NULL,
  datos     jsonb NOT NULL,
  motivo    text NOT NULL,
  fecha     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS historial_nido_idx ON nidos_historial (nido_id);

-- Lo que no se pudo decidir solo; lo resuelve una persona.
CREATE TABLE IF NOT EXISTS conflictos (
  id           bigserial PRIMARY KEY,
  motivo       text NOT NULL,
  folio        text NOT NULL,
  actual       jsonb NOT NULL,
  entrante     jsonb NOT NULL,
  recibido_de  text NOT NULL,
  resuelto     boolean NOT NULL DEFAULT false,
  fecha        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalogos (
  id      text PRIMARY KEY,
  tipo    text NOT NULL,
  valor   text NOT NULL,
  orden   integer NOT NULL,
  activo  smallint NOT NULL DEFAULT 1
);
