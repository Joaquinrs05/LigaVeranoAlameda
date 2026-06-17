-- Garantiza que un jugador solo pueda estar fichado por un único equipo dentro
-- de cada liga. La propiedad es por-liga, pero plantilla_fantasy solo guardaba
-- miembro_id, así que la BD no podía imponer la restricción.
--
-- Solución: desnormalizamos liga_id en plantilla_fantasy (autorrellenado por un
-- trigger desde miembro_id, sin tocar el backend) y añadimos una UNIQUE
-- (liga_id, jugador_id) que hace imposible el doble fichaje, incluso con
-- peticiones concurrentes.
--
-- Como el bug ya pudo dejar duplicados, esta migración los limpia antes de
-- crear la constraint: por cada (liga_id, jugador_id) repetido conserva el
-- fichaje más antiguo y elimina el resto, devolviendo el precio pagado al
-- presupuesto del miembro que pierde al jugador.

BEGIN;

-- 1. Columna liga_id
ALTER TABLE plantilla_fantasy
  ADD COLUMN IF NOT EXISTS liga_id uuid REFERENCES ligas_fantasy(id) ON DELETE CASCADE;

-- 2. Backfill desde el miembro al que pertenece cada fichaje
UPDATE plantilla_fantasy p
SET    liga_id = m.liga_id
FROM   miembros_liga_fantasy m
WHERE  m.id = p.miembro_id
  AND  p.liga_id IS NULL;

-- 3. Reembolsar el presupuesto de los fichajes duplicados que se van a borrar
--    (todos menos el más antiguo de cada liga+jugador)
WITH duplicados AS (
  SELECT id, miembro_id, precio_compra,
         ROW_NUMBER() OVER (
           PARTITION BY liga_id, jugador_id
           ORDER BY fichado_at, id
         ) AS rn
  FROM   plantilla_fantasy
),
reembolsos AS (
  SELECT miembro_id, SUM(precio_compra) AS total
  FROM   duplicados
  WHERE  rn > 1
  GROUP  BY miembro_id
)
UPDATE miembros_liga_fantasy m
SET    presupuesto = m.presupuesto + r.total
FROM   reembolsos r
WHERE  m.id = r.miembro_id;

-- 4. Borrar los fichajes duplicados (mismo criterio: se queda el más antiguo)
DELETE FROM plantilla_fantasy p
USING (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY liga_id, jugador_id
             ORDER BY fichado_at, id
           ) AS rn
    FROM   plantilla_fantasy
  ) t
  WHERE t.rn > 1
) dup
WHERE p.id = dup.id;

-- 5. Ya sin duplicados ni nulos: liga_id obligatorio
ALTER TABLE plantilla_fantasy
  ALTER COLUMN liga_id SET NOT NULL;

-- 6. Mantener liga_id sincronizado automáticamente desde miembro_id en cada insert
CREATE OR REPLACE FUNCTION set_plantilla_liga_id() RETURNS trigger AS $$
BEGIN
  SELECT liga_id INTO NEW.liga_id
  FROM   miembros_liga_fantasy
  WHERE  id = NEW.miembro_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_plantilla_liga_id ON plantilla_fantasy;
CREATE TRIGGER trg_set_plantilla_liga_id
  BEFORE INSERT ON plantilla_fantasy
  FOR EACH ROW EXECUTE FUNCTION set_plantilla_liga_id();

-- 7. Un jugador, un único dueño por liga
ALTER TABLE plantilla_fantasy
  ADD CONSTRAINT uq_plantilla_liga_jugador UNIQUE (liga_id, jugador_id);

CREATE INDEX IF NOT EXISTS idx_plantilla_liga ON plantilla_fantasy(liga_id);

COMMIT;
