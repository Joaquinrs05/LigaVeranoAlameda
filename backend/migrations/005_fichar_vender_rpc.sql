-- Mueve fichar/vender a funciones RPC transaccionales.
--
-- Antes: el backend hacía ~8 round-trips secuenciales por fichaje y leía/validaba/
-- escribía el presupuesto en pasos separados sin lock ni transacción (bug B4):
-- dos fichajes simultáneos podían dejar presupuesto negativo o pisar la
-- actualización del otro, y si el INSERT fallaba tras descontar, el dinero se
-- perdía. Ahora todo ocurre en una sola llamada, atómica, con SELECT ... FOR
-- UPDATE sobre el miembro para serializar operaciones sobre el mismo presupuesto.
--
-- Errores: usamos SQLSTATE 'PTxyz' para que PostgREST devuelva HTTP xyz
-- (PT403/PT404/PT400/PT409). El backend mapea ese código a HTTPException.
--
-- Seguridad: SECURITY INVOKER (las ejecuta service_role desde el backend). Se
-- REVOCA el EXECUTE a anon/authenticated: el usuario_id lo deriva el backend del
-- JWT, así que NADIE debe poder llamar la función directamente con la anon key
-- pasando un usuario_id arbitrario (sería un bypass de autenticación).

BEGIN;

-- ---- Fichar ----
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
  -- Miembro + lock (serializa fichajes/ventas concurrentes sobre este presupuesto)
  SELECT * INTO v_miembro FROM miembros_liga_fantasy
   WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  -- Mercado: si hay jornada en_curso con mercado_activo=false, está cerrado.
  -- (LIMIT 1 evita el 500 si hubiera varias en_curso — bug B6.)
  SELECT mercado_activo INTO v_mercado FROM jornadas WHERE estado = 'en_curso' LIMIT 1;
  IF FOUND AND v_mercado = false THEN
    RAISE EXCEPTION 'Mercado cerrado durante esta jornada' USING ERRCODE = 'PT403';
  END IF;

  -- Jugador
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

  -- Plantilla llena (máximo 15)
  SELECT count(*) INTO v_count FROM plantilla_fantasy WHERE miembro_id = v_miembro.id;
  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Plantilla llena (máximo 15 jugadores)' USING ERRCODE = 'PT400';
  END IF;

  -- Ya en tu plantilla
  IF EXISTS (SELECT 1 FROM plantilla_fantasy
             WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id) THEN
    RAISE EXCEPTION 'El jugador ya está en tu plantilla' USING ERRCODE = 'PT409';
  END IF;

  -- Titular si aún no se alcanzó el límite de su posición (1-2-2-2)
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

  -- Insert (la UNIQUE uq_plantilla_liga_jugador impide el doble fichaje en la liga,
  -- incluso con concurrencia; el trigger rellena liga_id desde miembro_id)
  BEGIN
    INSERT INTO plantilla_fantasy (miembro_id, jugador_id, precio_compra, es_titular)
    VALUES (v_miembro.id, p_jugador_id, v_jugador.precio_fantasy, v_es_titular)
    RETURNING * INTO v_nueva;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'El jugador ya ha sido fichado por otro equipo de la liga'
      USING ERRCODE = 'PT409';
  END;

  -- Descontar presupuesto (atómico con el insert)
  UPDATE miembros_liga_fantasy
     SET presupuesto = presupuesto - v_jugador.precio_fantasy
   WHERE id = v_miembro.id;

  RETURN v_nueva;
END;
$$ LANGUAGE plpgsql;

-- ---- Vender ----
CREATE OR REPLACE FUNCTION vender_jugador(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid
) RETURNS numeric AS $$
DECLARE
  v_miembro miembros_liga_fantasy;
  v_mercado bool;
  v_precio  numeric;
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

  SELECT precio_compra INTO v_precio FROM plantilla_fantasy
   WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no está en tu plantilla' USING ERRCODE = 'PT404';
  END IF;

  -- Borrar y devolver el dinero, atómico (si algo falla, no hay dinero gratis)
  DELETE FROM plantilla_fantasy
   WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id;
  UPDATE miembros_liga_fantasy
     SET presupuesto = presupuesto + v_precio
   WHERE id = v_miembro.id;

  RETURN v_precio;
END;
$$ LANGUAGE plpgsql;

-- Solo el backend (service_role) puede ejecutarlas. Nunca anon/authenticated.
REVOKE ALL ON FUNCTION fichar_jugador(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION vender_jugador(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fichar_jugador(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION vender_jugador(uuid, uuid, uuid) TO service_role;

COMMIT;
