-- Opción B: dejar de materializar miembros_liga_fantasy.puntos_total.
-- El total de cada miembro se calcula EN VIVO como la suma de sus filas en
-- puntuaciones_fantasy. Así "calcular jornada" solo hace un upsert en bloque
-- (sin bucle ni función) y nunca hay un total desincronizado o duplicado.

BEGIN;

-- 1. La vista pasa a sumar puntuaciones_fantasy en lugar de leer la columna.
--    Mantiene las MISMAS columnas de salida (puntos_total int, posicion int),
--    así que el frontend y los schemas no cambian.
CREATE OR REPLACE VIEW clasificacion_fantasy AS
SELECT
  m.liga_id,
  m.id                              AS miembro_id,
  m.usuario_id,
  m.nombre_equipo,
  COALESCE(SUM(pf.puntos), 0)::int  AS puntos_total,
  m.presupuesto,
  RANK() OVER (
    PARTITION BY m.liga_id
    ORDER BY COALESCE(SUM(pf.puntos), 0) DESC
  )::int                            AS posicion
FROM   miembros_liga_fantasy m
LEFT   JOIN puntuaciones_fantasy pf ON pf.miembro_id = m.id
GROUP  BY m.id, m.liga_id, m.usuario_id, m.nombre_equipo, m.presupuesto
ORDER  BY m.liga_id, puntos_total DESC;

-- 2. Ya nadie lee la columna materializada: se elimina.
ALTER TABLE miembros_liga_fantasy DROP COLUMN puntos_total;

COMMIT;
