-- Poner en mercado: jugador sigue en el equipo mientras está listado.
-- El vendedor puede listar/cancelar siempre; el comprador solo cuando mercado abierto.
-- Mínimo precio de venta = precio_compra original.

BEGIN;

-- ── Tabla ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mercado_listados (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  liga_id     uuid        NOT NULL REFERENCES ligas_fantasy(id) ON DELETE CASCADE,
  vendedor_id uuid        NOT NULL REFERENCES miembros_liga_fantasy(id) ON DELETE CASCADE,
  jugador_id  uuid        NOT NULL REFERENCES jugadores(id),
  precio      numeric     NOT NULL CHECK (precio > 0),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (liga_id, jugador_id)
);

CREATE INDEX IF NOT EXISTS idx_mercado_listados_liga     ON mercado_listados(liga_id);
CREATE INDEX IF NOT EXISTS idx_mercado_listados_vendedor ON mercado_listados(vendedor_id);

ALTER TABLE mercado_listados ENABLE ROW LEVEL SECURITY;

-- ── listar_jugador ───────────────────────────────────────────────────────────
-- Crea o actualiza el anuncio de venta de un jugador propio.
-- Precio mínimo = precio_compra. No requiere mercado abierto.

CREATE OR REPLACE FUNCTION listar_jugador(
  p_liga_id    uuid,
  p_usuario_id uuid,
  p_jugador_id uuid,
  p_precio     numeric
) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_miembro       miembros_liga_fantasy;
  v_precio_compra numeric;
BEGIN
  SELECT * INTO v_miembro
    FROM miembros_liga_fantasy
    WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  SELECT precio_compra INTO v_precio_compra
    FROM plantilla_fantasy
    WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este jugador no está en tu equipo' USING ERRCODE = 'PT400';
  END IF;

  IF p_precio < v_precio_compra THEN
    RAISE EXCEPTION 'El precio mínimo de venta es %.1fM (tu precio de compra)', v_precio_compra
      USING ERRCODE = 'PT400';
  END IF;

  INSERT INTO mercado_listados (liga_id, vendedor_id, jugador_id, precio)
    VALUES (p_liga_id, v_miembro.id, p_jugador_id, p_precio)
    ON CONFLICT (liga_id, jugador_id)
    DO UPDATE SET precio = EXCLUDED.precio;
END;
$$;

-- ── cancelar_listado ─────────────────────────────────────────────────────────
-- Borra el anuncio propio. No requiere mercado abierto.

CREATE OR REPLACE FUNCTION cancelar_listado(
  p_liga_id    uuid,
  p_usuario_id uuid,
  p_jugador_id uuid
) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_miembro_id uuid;
BEGIN
  SELECT id INTO v_miembro_id
    FROM miembros_liga_fantasy
    WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  DELETE FROM mercado_listados
    WHERE liga_id = p_liga_id
      AND vendedor_id = v_miembro_id
      AND jugador_id  = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este jugador no está en venta' USING ERRCODE = 'PT404';
  END IF;
END;
$$;

-- ── comprar_listado ──────────────────────────────────────────────────────────
-- Compra un jugador listado por otro miembro. Requiere mercado abierto.
-- Lock dual en orden UUID para evitar deadlocks (igual que clausulazo).

CREATE OR REPLACE FUNCTION comprar_listado(
  p_liga_id    uuid,
  p_usuario_id uuid,
  p_jugador_id uuid
) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_comprador  miembros_liga_fantasy;
  v_vendedor   miembros_liga_fantasy;
  v_listado    mercado_listados;
  v_mercado    bool;
  v_count      int;
BEGIN
  SELECT mercado_activo INTO v_mercado
    FROM jornadas WHERE estado = 'en_curso' LIMIT 1;
  IF v_mercado IS NOT TRUE THEN
    RAISE EXCEPTION 'El mercado está cerrado' USING ERRCODE = 'PT403';
  END IF;

  SELECT * INTO v_listado
    FROM mercado_listados
    WHERE liga_id = p_liga_id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este jugador no está en venta en esta liga' USING ERRCODE = 'PT404';
  END IF;

  SELECT * INTO v_comprador
    FROM miembros_liga_fantasy
    WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  IF v_comprador.id = v_listado.vendedor_id THEN
    RAISE EXCEPTION 'No puedes comprarte tu propio jugador' USING ERRCODE = 'PT400';
  END IF;

  -- Lock ambos miembros en orden UUID (previene deadlock cruzado)
  PERFORM id FROM miembros_liga_fantasy
    WHERE id IN (v_comprador.id, v_listado.vendedor_id)
    ORDER BY id FOR UPDATE;

  SELECT * INTO v_comprador FROM miembros_liga_fantasy WHERE id = v_comprador.id;
  SELECT * INTO v_vendedor  FROM miembros_liga_fantasy WHERE id = v_listado.vendedor_id;

  IF v_comprador.presupuesto < v_listado.precio THEN
    RAISE EXCEPTION 'Presupuesto insuficiente (tienes %.1fM, necesitas %.1fM)',
      v_comprador.presupuesto, v_listado.precio USING ERRCODE = 'PT400';
  END IF;

  SELECT COUNT(*) INTO v_count FROM plantilla_fantasy WHERE miembro_id = v_comprador.id;
  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Tu plantilla está completa (máximo 15 jugadores)' USING ERRCODE = 'PT400';
  END IF;

  UPDATE plantilla_fantasy SET
    miembro_id    = v_comprador.id,
    es_titular    = false,
    es_capitan    = false,
    precio_compra = v_listado.precio,
    clausula      = v_listado.precio
  WHERE miembro_id = v_vendedor.id AND jugador_id = p_jugador_id;

  UPDATE miembros_liga_fantasy SET presupuesto = presupuesto - v_listado.precio WHERE id = v_comprador.id;
  UPDATE miembros_liga_fantasy SET presupuesto = presupuesto + v_listado.precio WHERE id = v_vendedor.id;

  DELETE FROM mercado_listados WHERE id = v_listado.id;
END;
$$;

-- ── vender_jugador (recreada: sin check de mercado, reembolso = cláusula / 2) ─

CREATE OR REPLACE FUNCTION vender_jugador(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid
) RETURNS numeric
LANGUAGE plpgsql AS $$
DECLARE
  v_miembro   miembros_liga_fantasy;
  v_clausula  numeric;
  v_reembolso numeric;
BEGIN
  SELECT * INTO v_miembro FROM miembros_liga_fantasy
    WHERE liga_id = p_liga_id AND usuario_id = p_usuario_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No eres miembro de esta liga' USING ERRCODE = 'PT403';
  END IF;

  -- Sin check de mercado_activo: la venta instantánea siempre está disponible.

  SELECT clausula INTO v_clausula FROM plantilla_fantasy
    WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no está en tu plantilla' USING ERRCODE = 'PT404';
  END IF;

  v_reembolso := v_clausula / 2;

  DELETE FROM plantilla_fantasy
    WHERE miembro_id = v_miembro.id AND jugador_id = p_jugador_id;

  -- Limpiar anuncio si el jugador estaba en venta
  DELETE FROM mercado_listados
    WHERE liga_id = p_liga_id AND vendedor_id = v_miembro.id AND jugador_id = p_jugador_id;

  UPDATE miembros_liga_fantasy
    SET presupuesto = presupuesto + v_reembolso
    WHERE id = v_miembro.id;

  RETURN v_reembolso;
END;
$$;

-- ── clausulazo (recreada con limpieza de anuncio) ────────────────────────────

CREATE OR REPLACE FUNCTION clausulazo(
  p_liga_id uuid, p_usuario_id uuid, p_jugador_id uuid
) RETURNS plantilla_fantasy
LANGUAGE plpgsql AS $$
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

  SELECT * INTO v_plantilla FROM plantilla_fantasy
    WHERE liga_id = p_liga_id AND jugador_id = p_jugador_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ese jugador no pertenece a ningún equipo de la liga' USING ERRCODE = 'PT404';
  END IF;
  IF v_plantilla.miembro_id = v_comprador.id THEN
    RAISE EXCEPTION 'Ese jugador ya es tuyo' USING ERRCODE = 'PT409';
  END IF;

  PERFORM 1 FROM miembros_liga_fantasy
    WHERE id IN (v_comprador.id, v_plantilla.miembro_id)
    ORDER BY id FOR UPDATE;

  SELECT * INTO v_comprador FROM miembros_liga_fantasy WHERE id = v_comprador.id;
  SELECT * INTO v_vendedor  FROM miembros_liga_fantasy WHERE id = v_plantilla.miembro_id;

  IF v_plantilla.clausula > v_comprador.presupuesto THEN
    RAISE EXCEPTION 'Presupuesto insuficiente para pagar la cláusula' USING ERRCODE = 'PT400';
  END IF;

  SELECT count(*) INTO v_count FROM plantilla_fantasy WHERE miembro_id = v_comprador.id;
  IF v_count >= 15 THEN
    RAISE EXCEPTION 'Tu plantilla está llena (máximo 15 jugadores)' USING ERRCODE = 'PT400';
  END IF;

  UPDATE plantilla_fantasy
    SET miembro_id    = v_comprador.id,
        es_titular    = false,
        es_capitan    = false,
        precio_compra = v_plantilla.clausula,
        fichado_at    = now()
    WHERE id = v_plantilla.id
    RETURNING * INTO v_fila;

  UPDATE miembros_liga_fantasy
    SET presupuesto = presupuesto - v_plantilla.clausula WHERE id = v_comprador.id;
  UPDATE miembros_liga_fantasy
    SET presupuesto = presupuesto + v_plantilla.clausula WHERE id = v_vendedor.id;

  -- Limpiar anuncio si el jugador robado estaba en venta
  DELETE FROM mercado_listados
    WHERE liga_id = p_liga_id AND jugador_id = p_jugador_id;

  RETURN v_fila;
END;
$$;

-- ── Permisos ─────────────────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION listar_jugador(uuid, uuid, uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cancelar_listado(uuid, uuid, uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION comprar_listado(uuid, uuid, uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION vender_jugador(uuid, uuid, uuid)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION clausulazo(uuid, uuid, uuid)              FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION listar_jugador(uuid, uuid, uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION cancelar_listado(uuid, uuid, uuid)        TO service_role;
GRANT EXECUTE ON FUNCTION comprar_listado(uuid, uuid, uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION vender_jugador(uuid, uuid, uuid)          TO service_role;
GRANT EXECUTE ON FUNCTION clausulazo(uuid, uuid, uuid)              TO service_role;

COMMIT;
