-- Cláusula por jugador + cláusulazo (robo entre miembros). Spec specs/12-clausulazo.md.
--
-- Añade `clausula` a plantilla_fantasy y dos RPCs transaccionales nuevas, en la
-- misma línea que fichar/vender (migración 005): SECURITY INVOKER ejecutado por
-- service_role, lock FOR UPDATE sobre los miembros implicados, y errores con
-- SQLSTATE 'PTxyz' para que PostgREST devuelva el HTTP correspondiente.
--
-- Reglas (acordadas con el usuario):
--   * Cada jugador fichado tiene una cláusula. Inicial = precio de fichaje.
--   * El dueño puede SUBIRLA en cualquier momento (nunca bajarla).
--   * Otro miembro paga la cláusula ACTUAL y se lleva al jugador.
--   * El dueño robado recibe la cláusula íntegra.
--   * Solo con el mercado abierto (igual que fichar/vender).

BEGIN;

-- ---- Columna ----
ALTER TABLE plantilla_fantasy
  ADD COLUMN IF NOT EXISTS clausula numeric NOT NULL DEFAULT 0;

-- Backfill: los jugadores ya fichados toman como cláusula su precio de compra.
UPDATE plantilla_fantasy SET clausula = precio_compra WHERE clausula = 0;

-- ---- Fichar (recreada): fija la cláusula inicial = precio de fichaje ----
CREATE OR REPLACE FUNCTION fichar_jugador(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid
) RETURNS plantilla_fantasy AS $$
DECLARE
  v_miembro       miembros_liga_fantasy;
  v_jugador       jugadores;
  v_mercado       bool;
  v_count         int;
  v_titulares_pos int;
  v_max_pos       int;
  v_es_titular    bool;
  v_nueva         plantilla_fantasy;
BEGIN
  SELECT * INTO v_miembro FROM miembros_liga_fantasy
   WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  SELECT mercado_activo INTO v_mercado FROM jornadas WHERE estado = 'en_curso' LIMIT 1;
  IF FOUND AND v_mercado = false THEN
    RAISE EXCEPTION 'Mercado cerrado durante esta jornada' USING ERRCODE = 'PT403';
  END IF;

  SELECT * INTO v_jugador FROM jugadores WHERE id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no encontrado' USING ERRCODE = 'PT404';
  END IF;
  IF NOT v_jugador.activo OR v_jugador.estado_fantasy <> 'disponible' THEN
    RAISE EXCEPTION 'Jugador no disponible en el mercado' USING ERRCODE = 'PT400';
  END IF;
  IF v_jugador.precio_fantasy > v_miembro.presupuesto THEN
    RAISE EXCEPTION 'Presupuesto insuficiente' USING ERRCODE = 'PT400';
  END IF;

  SELECT count(*) INTO v_count FROM plantilla_fantasy WHERE miembro_id = v_miembro.id;
  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Plantilla llena (máximo 15 jugadores)' USING ERRCODE = 'PT400';
  END IF;

  IF EXISTS (SELECT 1 FROM plantilla_fantasy
             WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id) THEN
    RAISE EXCEPTION 'El jugador ya está en tu plantilla' USING ERRCODE = 'PT409';
  END IF;

  v_max_pos := CASE v_jugador.posicion
                 WHEN 'portero'        THEN 1
                 WHEN 'defensa'        THEN 2
                 WHEN 'centrocampista' THEN 2
                 WHEN 'delantero'      THEN 2
                 ELSE 1
               END;
  SELECT count(*) INTO v_titulares_pos
  FROM   plantilla_fantasy p
  JOIN   jugadores j ON j.id = p.jugador_id
  WHERE  p.miembro_id = v_miembro.id AND p.es_titular = true
    AND  j.posicion = v_jugador.posicion;
  v_es_titular := v_titulares_pos < v_max_pos;

  BEGIN
    INSERT INTO plantilla_fantasy (miembro_id, jugador_id, precio_compra, clausula, es_titular)
    VALUES (v_miembro.id, p_jugador_id, v_jugador.precio_fantasy, v_jugador.precio_fantasy, v_es_titular)
    RETURNING * INTO v_nueva;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'El jugador ya ha sido fichado por otro equipo de la liga'
      USING ERRCODE = 'PT409';
  END;

  UPDATE miembros_liga_fantasy
     SET presupuesto = presupuesto - v_jugador.precio_fantasy
   WHERE id = v_miembro.id;

  RETURN v_nueva;
END;
$$ LANGUAGE plpgsql;

-- ---- Subir cláusula ----
-- El dueño sube la cláusula de un jugador propio. Solo se puede subir, nunca
-- bajar. No depende del mercado: es una acción defensiva.
CREATE OR REPLACE FUNCTION subir_clausula(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid, p_clausula numeric
) RETURNS plantilla_fantasy AS $$
DECLARE
  v_miembro miembros_liga_fantasy;
  v_actual  numeric;
  v_fila    plantilla_fantasy;
BEGIN
  SELECT * INTO v_miembro FROM miembros_liga_fantasy
   WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  SELECT clausula INTO v_actual FROM plantilla_fantasy
   WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no está en tu plantilla' USING ERRCODE = 'PT404';
  END IF;

  IF p_clausula < v_actual THEN
    RAISE EXCEPTION 'La cláusula solo se puede subir' USING ERRCODE = 'PT400';
  END IF;

  UPDATE plantilla_fantasy SET clausula = p_clausula
   WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id
   RETURNING * INTO v_fila;

  RETURN v_fila;
END;
$$ LANGUAGE plpgsql;

-- ---- Cláusulazo ----
-- El comprador paga la cláusula actual del jugador y se lo lleva. El dueño
-- robado recibe esa cláusula. Atómico: bloquea a ambos miembros (en orden de id
-- para evitar deadlocks) y mueve dinero + jugador en la misma transacción.
CREATE OR REPLACE FUNCTION clausulazo(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid
) RETURNS plantilla_fantasy AS $$
DECLARE
  v_comprador miembros_liga_fantasy;
  v_vendedor  miembros_liga_fantasy;
  v_mercado   bool;
  v_plantilla plantilla_fantasy;
  v_count     int;
  v_fila      plantilla_fantasy;
BEGIN
  SELECT * INTO v_comprador FROM miembros_liga_fantasy
   WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  SELECT mercado_activo INTO v_mercado FROM jornadas WHERE estado = 'en_curso' LIMIT 1;
  IF FOUND AND v_mercado = false THEN
    RAISE EXCEPTION 'Mercado cerrado durante esta jornada' USING ERRCODE = 'PT403';
  END IF;

  -- Localizar al jugador dentro de la liga (uq_plantilla_liga_jugador garantiza
  -- que pertenece a un único equipo).
  SELECT * INTO v_plantilla FROM plantilla_fantasy
   WHERE liga_id = p_liga_id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ese jugador no pertenece a ningún equipo de la liga' USING ERRCODE = 'PT404';
  END IF;
  IF v_plantilla.miembro_id = v_comprador.id THEN
    RAISE EXCEPTION 'Ese jugador ya es tuyo' USING ERRCODE = 'PT409';
  END IF;

  -- Lock de ambos miembros en orden de id (evita deadlocks si dos cláusulazos
  -- cruzados ocurren a la vez).
  PERFORM 1 FROM miembros_liga_fantasy
   WHERE id IN (v_comprador.id, v_plantilla.miembro_id)
   ORDER BY id FOR UPDATE;

  -- Releer presupuestos ya bloqueados.
  SELECT * INTO v_comprador FROM miembros_liga_fantasy WHERE id = v_comprador.id;
  SELECT * INTO v_vendedor  FROM miembros_liga_fantasy WHERE id = v_plantilla.miembro_id;

  IF v_plantilla.clausula > v_comprador.presupuesto THEN
    RAISE EXCEPTION 'Presupuesto insuficiente para pagar la cláusula' USING ERRCODE = 'PT400';
  END IF;

  SELECT count(*) INTO v_count FROM plantilla_fantasy WHERE miembro_id = v_comprador.id;
  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Tu plantilla está llena (máximo 15 jugadores)' USING ERRCODE = 'PT400';
  END IF;

  -- Transferir: pasa al comprador como suplente; su nuevo precio_compra es la
  -- cláusula pagada (la cláusula se mantiene en ese valor).
  UPDATE plantilla_fantasy
     SET miembro_id    = v_comprador.id,
         es_titular    = false,
         es_capitan    = false,
         precio_compra = v_plantilla.clausula,
         fichado_at    = now()
   WHERE id = v_plantilla.id
   RETURNING * INTO v_fila;

  -- Dinero: el comprador paga, el dueño robado cobra.
  UPDATE miembros_liga_fantasy
     SET presupuesto = presupuesto - v_plantilla.clausula WHERE id = v_comprador.id;
  UPDATE miembros_liga_fantasy
     SET presupuesto = presupuesto + v_plantilla.clausula WHERE id = v_vendedor.id;

  RETURN v_fila;
END;
$$ LANGUAGE plpgsql;

-- Solo el backend (service_role) puede ejecutarlas. Nunca anon/authenticated.
REVOKE ALL ON FUNCTION fichar_jugador(uuid, uuid, uuid)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION subir_clausula(uuid, uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION clausulazo(uuid, uuid, uuid)              FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fichar_jugador(uuid, uuid, uuid)          TO service_role;
GRANT EXECUTE ON FUNCTION subir_clausula(uuid, uuid, uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION clausulazo(uuid, uuid, uuid)              TO service_role;

COMMIT;
