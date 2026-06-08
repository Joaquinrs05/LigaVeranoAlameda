-- =============================================
-- Liga Verano Alameda — Migración Fase 1
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- La tabla `perfiles` ya existe — no se toca aquí.
-- =============================================


-- =============================================
-- 1. TABLAS — LIGA REAL
-- =============================================

CREATE TABLE IF NOT EXISTS equipos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  abrev      text        NOT NULL CHECK (char_length(abrev) BETWEEN 2 AND 4),
  color      text        NOT NULL DEFAULT '#888888',
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


-- =============================================
-- 2. TABLAS — FANTASY
-- =============================================

CREATE TABLE IF NOT EXISTS ligas_fantasy (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            text        NOT NULL,
  codigo_invitacion text        UNIQUE NOT NULL,
  creador_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jornada_inicio    int         NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS miembros_liga_fantasy (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id       uuid        NOT NULL REFERENCES ligas_fantasy(id) ON DELETE CASCADE,
  usuario_id    uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  nombre_equipo text        NOT NULL,
  presupuesto   numeric     NOT NULL DEFAULT 100.0,
  puntos_total  int         NOT NULL DEFAULT 0,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liga_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS plantilla_fantasy (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id    uuid        NOT NULL REFERENCES miembros_liga_fantasy(id) ON DELETE CASCADE,
  jugador_id    uuid        NOT NULL REFERENCES jugadores(id)             ON DELETE CASCADE,
  es_titular    bool        NOT NULL DEFAULT true,
  es_capitan    bool        NOT NULL DEFAULT false,
  precio_compra numeric     NOT NULL,
  fichado_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (miembro_id, jugador_id)
);

CREATE TABLE IF NOT EXISTS puntuaciones_fantasy (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id     uuid        NOT NULL REFERENCES miembros_liga_fantasy(id) ON DELETE CASCADE,
  jornada_numero int         NOT NULL,
  puntos         int         NOT NULL DEFAULT 0,
  calculado_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (miembro_id, jornada_numero)
);


-- =============================================
-- 3. ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_jugadores_equipo      ON jugadores(equipo_id);
CREATE INDEX IF NOT EXISTS idx_partidos_jornada      ON partidos(jornada_id);
CREATE INDEX IF NOT EXISTS idx_partidos_equipos      ON partidos(equipo_local_id, equipo_visitante_id);
CREATE INDEX IF NOT EXISTS idx_stats_partido         ON estadisticas_jugador(partido_id);
CREATE INDEX IF NOT EXISTS idx_stats_jugador         ON estadisticas_jugador(jugador_id);
CREATE INDEX IF NOT EXISTS idx_miembros_liga         ON miembros_liga_fantasy(liga_id);
CREATE INDEX IF NOT EXISTS idx_miembros_usuario      ON miembros_liga_fantasy(usuario_id);
CREATE INDEX IF NOT EXISTS idx_plantilla_miembro     ON plantilla_fantasy(miembro_id);
CREATE INDEX IF NOT EXISTS idx_puntuaciones_miembro  ON puntuaciones_fantasy(miembro_id);


-- =============================================
-- 4. RLS
-- =============================================

ALTER TABLE equipos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE jornadas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE estadisticas_jugador  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruces                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligas_fantasy         ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_liga_fantasy ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantilla_fantasy     ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntuaciones_fantasy  ENABLE ROW LEVEL SECURITY;

-- Lectura pública — liga real
CREATE POLICY "public read" ON equipos              FOR SELECT USING (true);
CREATE POLICY "public read" ON jugadores            FOR SELECT USING (true);
CREATE POLICY "public read" ON jornadas             FOR SELECT USING (true);
CREATE POLICY "public read" ON partidos             FOR SELECT USING (true);
CREATE POLICY "public read" ON estadisticas_jugador FOR SELECT USING (true);
CREATE POLICY "public read" ON cruces               FOR SELECT USING (true);

-- ligas_fantasy
CREATE POLICY "auth read"      ON ligas_fantasy FOR SELECT TO authenticated USING (true);
CREATE POLICY "creator insert" ON ligas_fantasy FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creador_id);
CREATE POLICY "creator update" ON ligas_fantasy FOR UPDATE TO authenticated
  USING (auth.uid() = creador_id);
CREATE POLICY "creator delete" ON ligas_fantasy FOR DELETE TO authenticated
  USING (auth.uid() = creador_id);

-- Función auxiliar para evitar recursión en políticas de miembros
CREATE OR REPLACE FUNCTION es_miembro_liga(p_liga_id uuid)
RETURNS bool LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM miembros_liga_fantasy
    WHERE liga_id = p_liga_id AND usuario_id = auth.uid()
  );
$$;

-- miembros_liga_fantasy
CREATE POLICY "league read" ON miembros_liga_fantasy FOR SELECT TO authenticated
  USING (es_miembro_liga(liga_id));
CREATE POLICY "self insert"  ON miembros_liga_fantasy FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "self update"  ON miembros_liga_fantasy FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id);
CREATE POLICY "self delete"  ON miembros_liga_fantasy FOR DELETE TO authenticated
  USING (auth.uid() = usuario_id);

-- plantilla_fantasy
CREATE POLICY "league read" ON plantilla_fantasy FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM miembros_liga_fantasy m
      WHERE m.id = plantilla_fantasy.miembro_id AND es_miembro_liga(m.liga_id)
    )
  );
CREATE POLICY "self insert" ON plantilla_fantasy FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM miembros_liga_fantasy m
      WHERE m.id = miembro_id AND m.usuario_id = auth.uid()
    )
  );
CREATE POLICY "self update" ON plantilla_fantasy FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM miembros_liga_fantasy m
      WHERE m.id = plantilla_fantasy.miembro_id AND m.usuario_id = auth.uid()
    )
  );
CREATE POLICY "self delete" ON plantilla_fantasy FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM miembros_liga_fantasy m
      WHERE m.id = plantilla_fantasy.miembro_id AND m.usuario_id = auth.uid()
    )
  );

-- puntuaciones_fantasy (solo lectura para usuarios; escritura solo service_role)
CREATE POLICY "league read" ON puntuaciones_fantasy FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM miembros_liga_fantasy m
      WHERE m.id = puntuaciones_fantasy.miembro_id AND es_miembro_liga(m.liga_id)
    )
  );


-- =============================================
-- 5. VISTAS
-- =============================================

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

CREATE OR REPLACE VIEW clasificacion_fantasy AS
SELECT
  m.liga_id,
  m.id            AS miembro_id,
  m.usuario_id,
  m.nombre_equipo,
  m.puntos_total,
  m.presupuesto,
  RANK() OVER (PARTITION BY m.liga_id ORDER BY m.puntos_total DESC)::int AS posicion
FROM   miembros_liga_fantasy m
ORDER  BY m.liga_id, m.puntos_total DESC;


-- =============================================
-- 6. SEED DATA
-- =============================================

-- Equipos (6 equipos)
INSERT INTO equipos (id, nombre, abrev, color) VALUES
  ('00000001-0000-0000-0000-000000000001', 'FC Alameda',      'FCA', '#C0552A'),
  ('00000001-0000-0000-0000-000000000002', 'Los Cañoneros',   'CAN', '#1A4A2E'),
  ('00000001-0000-0000-0000-000000000003', 'Barrio United',   'BRU', '#1E3A5F'),
  ('00000001-0000-0000-0000-000000000004', 'Los Piratas',     'PIR', '#2C2C2C'),
  ('00000001-0000-0000-0000-000000000005', 'Atlético Verano', 'ATV', '#E63946'),
  ('00000001-0000-0000-0000-000000000006', 'El Molino FC',    'MOL', '#6B4226')
ON CONFLICT (id) DO NOTHING;

-- Jugadores (6 por equipo: 1 POR, 1 DEF, 2 MC, 2 DEL)
INSERT INTO jugadores (id, equipo_id, nombre, dorsal, posicion, precio_fantasy) VALUES
  -- FC Alameda
  ('00000002-0000-0000-0000-000000000101','00000001-0000-0000-0000-000000000001','Sánchez',    1, 'portero',        6.0),
  ('00000002-0000-0000-0000-000000000102','00000001-0000-0000-0000-000000000001','Ruiz',        3, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000103','00000001-0000-0000-0000-000000000001','García',      7, 'centrocampista', 7.0),
  ('00000002-0000-0000-0000-000000000104','00000001-0000-0000-0000-000000000001','Torres',      8, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000105','00000001-0000-0000-0000-000000000001','Martínez',    9, 'delantero',      9.0),
  ('00000002-0000-0000-0000-000000000106','00000001-0000-0000-0000-000000000001','López',      11, 'delantero',      7.5),
  -- Los Cañoneros
  ('00000002-0000-0000-0000-000000000201','00000001-0000-0000-0000-000000000002','Moreno',      1, 'portero',        5.5),
  ('00000002-0000-0000-0000-000000000202','00000001-0000-0000-0000-000000000002','Jiménez',     4, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000203','00000001-0000-0000-0000-000000000002','Hernández',   6, 'centrocampista', 7.5),
  ('00000002-0000-0000-0000-000000000204','00000001-0000-0000-0000-000000000002','Díaz',         8, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000205','00000001-0000-0000-0000-000000000002','Fernández',  10, 'delantero',     10.0),
  ('00000002-0000-0000-0000-000000000206','00000001-0000-0000-0000-000000000002','Pérez',       11, 'delantero',      8.0),
  -- Barrio United
  ('00000002-0000-0000-0000-000000000301','00000001-0000-0000-0000-000000000003','Alonso',      1, 'portero',        5.0),
  ('00000002-0000-0000-0000-000000000302','00000001-0000-0000-0000-000000000003','Vega',         5, 'defensa',        5.5),
  ('00000002-0000-0000-0000-000000000303','00000001-0000-0000-0000-000000000003','Molina',       7, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000304','00000001-0000-0000-0000-000000000003','Castillo',     8, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000305','00000001-0000-0000-0000-000000000003','Romero',       9, 'delantero',      8.5),
  ('00000002-0000-0000-0000-000000000306','00000001-0000-0000-0000-000000000003','Navarro',     11, 'delantero',      7.0),
  -- Los Piratas
  ('00000002-0000-0000-0000-000000000401','00000001-0000-0000-0000-000000000004','Domínguez',   1, 'portero',        6.5),
  ('00000002-0000-0000-0000-000000000402','00000001-0000-0000-0000-000000000004','Vargas',       3, 'defensa',        5.5),
  ('00000002-0000-0000-0000-000000000403','00000001-0000-0000-0000-000000000004','Iglesias',     6, 'centrocampista', 7.0),
  ('00000002-0000-0000-0000-000000000404','00000001-0000-0000-0000-000000000004','Serrano',      8, 'centrocampista', 5.5),
  ('00000002-0000-0000-0000-000000000405','00000001-0000-0000-0000-000000000004','Blanco',       9, 'delantero',      9.5),
  ('00000002-0000-0000-0000-000000000406','00000001-0000-0000-0000-000000000004','Núñez',       10, 'delantero',      8.0),
  -- Atlético Verano
  ('00000002-0000-0000-0000-000000000501','00000001-0000-0000-0000-000000000005','Ramos',        1, 'portero',        7.0),
  ('00000002-0000-0000-0000-000000000502','00000001-0000-0000-0000-000000000005','Suárez',       2, 'defensa',        6.0),
  ('00000002-0000-0000-0000-000000000503','00000001-0000-0000-0000-000000000005','Reyes',        7, 'centrocampista', 7.5),
  ('00000002-0000-0000-0000-000000000504','00000001-0000-0000-0000-000000000005','Cruz',          8, 'centrocampista', 6.5),
  ('00000002-0000-0000-0000-000000000505','00000001-0000-0000-0000-000000000005','Ortiz',         9, 'delantero',     11.0),
  ('00000002-0000-0000-0000-000000000506','00000001-0000-0000-0000-000000000005','Guerrero',     11, 'delantero',      8.5),
  -- El Molino FC
  ('00000002-0000-0000-0000-000000000601','00000001-0000-0000-0000-000000000006','Medina',        1, 'portero',        5.0),
  ('00000002-0000-0000-0000-000000000602','00000001-0000-0000-0000-000000000006','Aguilar',       4, 'defensa',        5.0),
  ('00000002-0000-0000-0000-000000000603','00000001-0000-0000-0000-000000000006','Campos',        6, 'centrocampista', 6.0),
  ('00000002-0000-0000-0000-000000000604','00000001-0000-0000-0000-000000000006','Fuentes',       8, 'centrocampista', 5.5),
  ('00000002-0000-0000-0000-000000000605','00000001-0000-0000-0000-000000000006','Delgado',       9, 'delantero',      7.5),
  ('00000002-0000-0000-0000-000000000606','00000001-0000-0000-0000-000000000006','Castro',       11, 'delantero',      6.5)
ON CONFLICT (id) DO NOTHING;

-- Jornadas
INSERT INTO jornadas (id, numero, fecha_inicio, fecha_fin, estado, mercado_activo) VALUES
  ('00000003-0000-0000-0000-000000000001', 1, '2026-06-01', '2026-06-07', 'finalizada', false),
  ('00000003-0000-0000-0000-000000000002', 2, '2026-06-08', '2026-06-14', 'en_curso',   true),
  ('00000003-0000-0000-0000-000000000003', 3, '2026-06-15', '2026-06-21', 'pendiente',  true)
ON CONFLICT (id) DO NOTHING;

-- Partidos — Jornada 1 (todos finished)
INSERT INTO partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado, hora_inicio) VALUES
  ('00000004-0000-0000-0000-000000000001','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000001','00000001-0000-0000-0000-000000000002',
   3, 1, 'finished', '2026-06-04 19:00:00+02'),
  ('00000004-0000-0000-0000-000000000002','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000003','00000001-0000-0000-0000-000000000004',
   2, 2, 'finished', '2026-06-04 20:00:00+02'),
  ('00000004-0000-0000-0000-000000000003','00000003-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000005','00000001-0000-0000-0000-000000000006',
   4, 1, 'finished', '2026-06-04 21:00:00+02')
ON CONFLICT (id) DO NOTHING;

-- Partidos — Jornada 2 (dos finished, uno upcoming)
INSERT INTO partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, goles_local, goles_visitante, estado, hora_inicio) VALUES
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
   'upcoming', '2026-06-14 20:00:00+02')
ON CONFLICT (id) DO NOTHING;

-- Partidos — Jornada 3 (todos upcoming)
INSERT INTO partidos (id, jornada_id, equipo_local_id, equipo_visitante_id, estado, hora_inicio) VALUES
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

-- Estadísticas — J1 P1: FCA 3-1 CAN
INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, tarjeta_amarilla, tarjeta_roja, minutos_jugados, portero_sin_goles)
VALUES
  ('00000002-0000-0000-0000-000000000101','00000004-0000-0000-0000-000000000001', 0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000102','00000004-0000-0000-0000-000000000001', 0,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000103','00000004-0000-0000-0000-000000000001', 1,1,false,false,60,false),
  ('00000002-0000-0000-0000-000000000104','00000004-0000-0000-0000-000000000001', 0,0,true, false,60,false),
  ('00000002-0000-0000-0000-000000000105','00000004-0000-0000-0000-000000000001', 2,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000201','00000004-0000-0000-0000-000000000001', 0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000202','00000004-0000-0000-0000-000000000001', 0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000203','00000004-0000-0000-0000-000000000001', 0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000204','00000004-0000-0000-0000-000000000001', 0,0,false,false,60,false),
  ('00000002-0000-0000-0000-000000000205','00000004-0000-0000-0000-000000000001', 1,0,false,false,60,false)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;

-- Estadísticas — J1 P2: BRU 2-2 PIR
INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, minutos_jugados)
VALUES
  ('00000002-0000-0000-0000-000000000301','00000004-0000-0000-0000-000000000002', 0,0,60),
  ('00000002-0000-0000-0000-000000000302','00000004-0000-0000-0000-000000000002', 0,0,60),
  ('00000002-0000-0000-0000-000000000303','00000004-0000-0000-0000-000000000002', 1,1,60),
  ('00000002-0000-0000-0000-000000000304','00000004-0000-0000-0000-000000000002', 0,0,60),
  ('00000002-0000-0000-0000-000000000305','00000004-0000-0000-0000-000000000002', 1,0,60),
  ('00000002-0000-0000-0000-000000000401','00000004-0000-0000-0000-000000000002', 0,0,60),
  ('00000002-0000-0000-0000-000000000402','00000004-0000-0000-0000-000000000002', 0,0,60),
  ('00000002-0000-0000-0000-000000000403','00000004-0000-0000-0000-000000000002', 1,0,60),
  ('00000002-0000-0000-0000-000000000404','00000004-0000-0000-0000-000000000002', 0,1,60),
  ('00000002-0000-0000-0000-000000000405','00000004-0000-0000-0000-000000000002', 1,0,60)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;

-- Estadísticas — J1 P3: ATV 4-1 MOL
INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, minutos_jugados, portero_sin_goles)
VALUES
  ('00000002-0000-0000-0000-000000000501','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000502','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000503','00000004-0000-0000-0000-000000000003', 2,1,60,false),
  ('00000002-0000-0000-0000-000000000504','00000004-0000-0000-0000-000000000003', 0,1,60,false),
  ('00000002-0000-0000-0000-000000000505','00000004-0000-0000-0000-000000000003', 2,0,60,false),
  ('00000002-0000-0000-0000-000000000601','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000602','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000603','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000604','00000004-0000-0000-0000-000000000003', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000605','00000004-0000-0000-0000-000000000003', 1,0,60,false)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;

-- Estadísticas — J2 P4: CAN 1-2 ATV
INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, minutos_jugados, portero_sin_goles)
VALUES
  ('00000002-0000-0000-0000-000000000201','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000202','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000203','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000204','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000205','00000004-0000-0000-0000-000000000004', 1,0,60,false),
  ('00000002-0000-0000-0000-000000000501','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000502','00000004-0000-0000-0000-000000000004', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000503','00000004-0000-0000-0000-000000000004', 0,1,60,false),
  ('00000002-0000-0000-0000-000000000505','00000004-0000-0000-0000-000000000004', 1,0,60,false),
  ('00000002-0000-0000-0000-000000000506','00000004-0000-0000-0000-000000000004', 1,0,60,false)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;

-- Estadísticas — J2 P5: PIR 0-1 FCA
INSERT INTO estadisticas_jugador
  (jugador_id, partido_id, goles, asistencias, minutos_jugados, portero_sin_goles)
VALUES
  ('00000002-0000-0000-0000-000000000401','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000402','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000403','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000404','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000405','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000101','00000004-0000-0000-0000-000000000005', 0,0,60,true),
  ('00000002-0000-0000-0000-000000000102','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000103','00000004-0000-0000-0000-000000000005', 0,1,60,false),
  ('00000002-0000-0000-0000-000000000104','00000004-0000-0000-0000-000000000005', 0,0,60,false),
  ('00000002-0000-0000-0000-000000000105','00000004-0000-0000-0000-000000000005', 1,0,60,false)
ON CONFLICT (jugador_id, partido_id) DO NOTHING;
