-- Opcional: consultas geográficas con PostGIS (distancias, nidos dentro de una zona, mapas en QGIS).
-- Se aplica solo si el servidor arranca con POSTGIS=1 y la base tiene PostGIS instalado.

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE nidos
  ADD COLUMN IF NOT EXISTS ubicacion geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX IF NOT EXISTS nidos_ubicacion_idx ON nidos USING gist (ubicacion);
