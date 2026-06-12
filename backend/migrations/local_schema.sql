-- Schema para el PostgreSQL local del VPS (caché de liga real).
-- Sin RLS, sin auth.users — solo tablas de liga real + vista clasificacion.
-- Se carga automáticamente vía docker-entrypoint-initdb.d al primer arranque.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS equipos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  abrev      text        NOT NULL CHECK (char_length(abrev) BETWEEN 2 AND 4),
  color      text        NOT NULL DEFAULT '#888888',
  foto_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jugadores (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id      uuid    NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre         text    NOT NULL,
  dorsal         int,
  posicion       text    NOT NULL CHECK (posicion IN ('portero','defensa','centrocampista','delantero')),
  precio_fantasy numeric NOT NULL DEFAULT 5.0,
  estado_fantasy text    NOT NULL DEFAULT 'disponible'
                         CHECK (estado_fantasy IN ('disponible','lesionado','sancionado')),
  activo         bool    NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS jornadas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero         int  UNIQUE NOT NULL,
  fecha_inicio   date NOT NULL,
  fecha_fin      date NOT NULL,
  estado         text NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','en_curso','finalizada')),
  mercado_activo bool NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS partidos (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_id          uuid        NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
  equipo_local_id     uuid        NOT NULL REFERENCES equipos(id),
  equipo_visitante_id uuid        NOT NULL REFERENCES equipos(id),
  goles_local         int,
  goles_visitante     int,
  estado              text        NOT NULL DEFAULT 'upcoming'
                                  CHECK (estado IN ('upcoming','live','finished')),
  hora_inicio         timestamptz NOT NULL,
  minuto              text,
  CHECK (equipo_local_id <> equipo_visitante_id)
);

CREATE TABLE IF NOT EXISTS estadisticas_jugador (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id        uuid NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  partido_id        uuid NOT NULL REFERENCES partidos(id)  ON DELETE CASCADE,
  goles             int  NOT NULL DEFAULT 0,
  asistencias       int  NOT NULL DEFAULT 0,
  tarjeta_amarilla  bool NOT NULL DEFAULT false,
  tarjeta_roja      bool NOT NULL DEFAULT false,
  minutos_jugados   int  NOT NULL DEFAULT 0,
  portero_sin_goles bool NOT NULL DEFAULT false,
  puntos_fantasy    int  NOT NULL DEFAULT 0,
  UNIQUE (jugador_id, partido_id)
);

CREATE TABLE IF NOT EXISTS cruces (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fase                text NOT NULL CHECK (fase IN ('cuartos','semis','final')),
  equipo_local_id     uuid REFERENCES equipos(id),
  equipo_visitante_id uuid REFERENCES equipos(id),
  goles_local         int,
  goles_visitante     int,
  estado              text NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente','live','finished'))
);

CREATE INDEX IF NOT EXISTS idx_jugadores_equipo  ON jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS idx_partidos_jornada  ON partidos(jornada_id);
CREATE INDEX IF NOT EXISTS idx_partidos_equipos  ON partidos(equipo_local_id, equipo_visitante_id);
CREATE INDEX IF NOT EXISTS idx_stats_partido     ON estadisticas_jugador(partido_id);
CREATE INDEX IF NOT EXISTS idx_stats_jugador     ON estadisticas_jugador(jugador_id);

CREATE OR REPLACE VIEW clasificacion AS
WITH resultados AS (
  SELECT equipo_local_id      AS equipo_id,
         goles_local          AS gf,
         goles_visitante      AS gc,
         CASE WHEN goles_local > goles_visitante THEN 'W'
              WHEN goles_local = goles_visitante THEN 'D'
              ELSE 'L' END     AS res
  FROM   partidos WHERE estado = 'finished'
  UNION ALL
  SELECT equipo_visitante_id,
         goles_visitante,
         goles_local,
         CASE WHEN goles_visitante > goles_local THEN 'W'
              WHEN goles_visitante = goles_local THEN 'D'
              ELSE 'L' END
  FROM   partidos WHERE estado = 'finished'
)
SELECT
  e.id                                                              AS equipo_id,
  e.nombre,
  e.abrev,
  e.color,
  COUNT(r.equipo_id)::int                                          AS pj,
  COUNT(r.equipo_id) FILTER (WHERE r.res = 'W')::int              AS pg,
  COUNT(r.equipo_id) FILTER (WHERE r.res = 'D')::int              AS pe,
  COUNT(r.equipo_id) FILTER (WHERE r.res = 'L')::int              AS pp,
  COALESCE(SUM(r.gf), 0)::int                                     AS gf,
  COALESCE(SUM(r.gc), 0)::int                                     AS gc,
  COALESCE(
    COUNT(r.equipo_id) FILTER (WHERE r.res = 'W') * 3 +
    COUNT(r.equipo_id) FILTER (WHERE r.res = 'D'),
    0
  )::int                                                           AS puntos
FROM   equipos e
LEFT   JOIN resultados r ON r.equipo_id = e.id
GROUP  BY e.id, e.nombre, e.abrev, e.color
ORDER  BY puntos DESC,
          (COALESCE(SUM(r.gf), 0) - COALESCE(SUM(r.gc), 0)) DESC,
          COALESCE(SUM(r.gf), 0) DESC;

-- ── Seed data (mismos IDs que en Supabase para que el sync sea idempotente) ──

INSERT INTO equipos (id, nombre, abrev, color) VALUES
  ('00000001-0000-0000-0000-000000000001', 'FC Alameda',      'FCA', '#C0552A'),
  ('00000001-0000-0000-0000-000000000002', 'Los Cañoneros',   'CAN', '#1A4A2E'),
  ('00000001-0000-0000-0000-000000000003', 'Barrio United',   'BRU', '#1E3A5F'),
  ('00000001-0000-0000-0000-000000000004', 'Los Piratas',     'PIR', '#2C2C2C'),
  ('00000001-0000-0000-0000-000000000005', 'Atlético Verano', 'ATV', '#E63946'),
  ('00000001-0000-0000-0000-000000000006', 'El Molino FC',    'MOL', '#6B4226')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jugadores (id, equipo_id, nombre, dorsal, posicion, precio_fantasy) VALUES
  ('00000002-0000-0000-0000-000000000101','00000001-0000-0000-0000-000000000001','Sánchez',    1, 'portero',        6.0),
  ('00000002-0000-0000-0000-000000000102','00000001-0000-0000-0000-000000000001','Ruiz',        3, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000103','00000001-0000-0000-0000-000000000001','García',      7, 'centrocampista', 7.0),
  ('00000002-0000-0000-0000-000000000104','00000001-0000-0000-0000-000000000001','Torres',      8, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000105','00000001-0000-0000-0000-000000000001','Martínez',    9, 'delantero',      9.0),
  ('00000002-0000-0000-0000-000000000106','00000001-0000-0000-0000-000000000001','López',      11, 'delantero',      7.5),
  ('00000002-0000-0000-0000-000000000201','00000001-0000-0000-0000-000000000002','Moreno',      1, 'portero',        5.5),
  ('00000002-0000-0000-0000-000000000202','00000001-0000-0000-0000-000000000002','Jiménez',     4, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000203','00000001-0000-0000-0000-000000000002','Hernández',   6, 'centrocampista', 7.5),
  ('00000002-0000-0000-0000-000000000204','00000001-0000-0000-0000-000000000002','Díaz',         8, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000205','00000001-0000-0000-0000-000000000002','Fernández',  10, 'delantero',     10.0),
  ('00000002-0000-0000-0000-000000000206','00000001-0000-0000-0000-000000000002','Pérez',       11, 'delantero',      8.0),
  ('00000002-0000-0000-0000-000000000301','00000001-0000-0000-0000-000000000003','Alonso',      1, 'portero',        5.0),
  ('00000002-0000-0000-0000-000000000302','00000001-0000-0000-0000-000000000003','Vega',         5, 'defensa',        5.5),
  ('00000002-0000-0000-0000-000000000303','00000001-0000-0000-0000-000000000003','Molina',       7, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000304','00000001-0000-0000-0000-000000000003','Castillo',     8, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000305','00000001-0000-0000-0000-000000000003','Romero',       9, 'delantero',      8.5),
  ('00000002-0000-0000-0000-000000000306','00000001-0000-0000-0000-000000000003','Navarro',     11, 'delantero',      7.0),
  ('00000002-0000-0000-0000-000000000401','00000001-0000-0000-0000-000000000004','Domínguez',   1, 'portero',        6.5),
  ('00000002-0000-0000-0000-000000000402','00000001-0000-0000-0000-000000000004','Vargas',       3, 'defensa',        5.5),
  ('00000002-0000-0000-0000-000000000403','00000001-0000-0000-0000-000000000004','Iglesias',     6, 'centrocampista', 7.0),
  ('00000002-0000-0000-0000-000000000404','00000001-0000-0000-0000-000000000004','Serrano',      8, 'centrocampista', 5.5),
  ('00000002-0000-0000-0000-000000000405','00000001-0000-0000-0000-000000000004','Blanco',       9, 'delantero',      9.5),
  ('00000002-0000-0000-0000-000000000406','00000001-0000-0000-0000-000000000004','Núñez',       10, 'delantero',      8.0),
  ('00000002-0000-0000-0000-000000000501','00000001-0000-0000-0000-000000000005','Ramos',        1, 'portero',        7.0),
  ('00000002-0000-0000-0000-000000000502','00000001-0000-0000-0000-000000000005','Suárez',       2, 'defensa',        6.0),
  ('00000002-0000-0000-0000-000000000503','00000001-0000-0000-0000-000000000005','Reyes',        7, 'centrocampista', 7.5),
  ('00000002-0000-0000-0000-000000000504','00000001-0000-0000-0000-000000000005','Cruz',          8, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000505','00000001-0000-0000-0000-000000000005','Ortiz',         9, 'delantero',     11.0),
  ('00000002-0000-0000-0000-000000000506','00000001-0000-0000-0000-000000000005','Guerrero',     11, 'delantero',      8.5),
  ('00000002-0000-0000-0000-000000000601','00000001-0000-0000-0000-000000000006','Medina',        1, 'portero',        5.0),
  ('00000002-0000-0000-0000-000000000602','00000001-0000-0000-0000-000000000006','Aguilar',       4, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000603','00000001-0000-0000-0000-000000000006','Campos',        6, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000604','00000001-0000-0000-0000-000000000006','Fuentes',       8, 'centrocampista', 5.5),
  ('00000002-0000-0000-0000-000000000605','00000001-0000-0000-0000-000000000006','Delgado',       9, 'delantero',      7.5),
  ('00000002-0000-0000-0000-000000000606','00000001-0000-0000-0000-000000000006','Castro',       11, 'delantero',      6.5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO jornadas (id, numero, fecha_inicio, fecha_fin, estado, mercado_activo) VALUES
  ('00000003-0000-0000-0000-000000000001', 1, '2026-06-01', '2026-06-07', 'finalizada', false),
  ('00000003-0000-0000-0000-000000000002', 2, '2026-06-08', '2026-06-14', 'en_curso',   true),
  ('00000003-0000-0000-0000-000000000003', 3, '2026-06-15', '2026-06-21', 'pendiente',  true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado, hora_inicio) VALUES
  ('00000004-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000001','00000001-0000-0000-0000-000000000002',
   3, 1, 'finished', '2026-06-04 19:00:00+02'),
  ('00000004-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000003','00000001-0000-0000-0000-000000000004',
   2, 2, 'finished', '2026-06-04 20:00:00+02'),
  ('00000004-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000005','00000001-0000-0000-0000-000000000006',
   4, 1, 'finished', '2026-06-04 21:00:00+02'),
  ('00000004-0000-0000-0000-000000000004','00000003-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000002','00000001-0000-0000-0000-000000000005',
   1, 2, 'finished', '2026-06-11 19:00:00+02'),
  ('00000004-0000-0000-0000-000000000005','00000003-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000004','00000001-0000-0000-0000-000000000001',
   0, 1, 'finished', '2026-06-11 20:00:00+02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, estado, hora_inicio) VALUES
  ('00000004-0000-0000-0000-000000000006','00000003-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000006','00000001-0000-0000-0000-000000000003',
   'upcoming', '2026-06-14 20:00:00+02'),
  ('00000004-0000-0000-0000-000000000007','00000003-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000001','00000001-0000-0000-0000-000000000006',
   'upcoming', '2026-06-18 19:00:00+02'),
  ('00000004-0000-0000-0000-000000000008','00000003-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000003','00000001-0000-0000-0000-000000000005',
   'upcoming', '2026-06-18 20:00:00+02'),
  ('00000004-0000-0000-0000-000000000009','00000003-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000004','00000001-0000-0000-0000-000000000002',
   'upcoming', '2026-06-18 21:00:00+02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, tarjeta_amarilla, tarjeta_roja, minutos_jugados, portero_sin_goles)
VALUES
  ('00000002-0000-0000-0000-000000000101','00000004-0000-0000-0000-000000000001',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000102','00000004-0000-0000-0000-000000000001',0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000103','00000004-0000-0000-0000-000000000001',1,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000104','00000004-0000-0000-0000-000000000001',0,0,true, false,60,false),
  ('00000002-0000-0000-0000-000000000105','00000004-0000-0000-0000-000000000001',2,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000201','00000004-0000-0000-0000-000000000001',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000202','00000004-0000-0000-0000-000000000001',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000203','00000004-0000-0000-0000-000000000001',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000204','00000004-0000-0000-0000-000000000001',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000205','00000004-0000-0000-0000-000000000001',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000301','00000004-0000-0000-0000-000000000002',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000302','00000004-0000-0000-0000-000000000002',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000303','00000004-0000-0000-0000-000000000002',1,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000304','00000004-0000-0000-0000-000000000002',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000305','00000004-0000-0000-0000-000000000002',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000401','00000004-0000-0000-0000-000000000002',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000402','00000004-0000-0000-0000-000000000002',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000403','00000004-0000-0000-0000-000000000002',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000404','00000004-0000-0000-0000-000000000002',0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000405','00000004-0000-0000-0000-000000000002',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000501','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000502','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000503','00000004-0000-0000-0000-000000000003',2,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000504','00000004-0000-0000-0000-000000000003',0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000505','00000004-0000-0000-0000-000000000003',2,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000601','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000602','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000603','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000604','00000004-0000-0000-0000-000000000003',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000605','00000004-0000-0000-0000-000000000003',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000201','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000202','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000203','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000204','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000205','00000004-0000-0000-0000-000000000004',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000501','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000502','00000004-0000-0000-0000-000000000004',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000503','00000004-0000-0000-0000-000000000004',0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000505','00000004-0000-0000-0000-000000000004',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000506','00000004-0000-0000-0000-000000000004',1,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000401','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000402','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000403','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000404','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000405','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000101','00000004-0000-0000-0000-000000000005',0,0,false,false,60,true),
  ('00000002-0000-0000-0000-000000000102','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000103','00000004-0000-0000-0000-000000000005',0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000104','00000004-0000-0000-0000-000000000005',0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000105','00000004-0000-0000-0000-000000000005',1,0,false,false,60,false)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;
