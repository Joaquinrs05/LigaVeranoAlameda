from __future__ import annotations

import psycopg2
import psycopg2.extras
import psycopg2.pool

from app.config import settings

_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(1, 5, settings.local_db_url)
    return _pool


def _query(sql: str, params: tuple = ()) -> list[dict]:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
    finally:
        pool.putconn(conn)


def _one(sql: str, params: tuple = ()) -> dict | None:
    rows = _query(sql, params)
    return rows[0] if rows else None


def get_clasificacion() -> list[dict]:
    return _query("SELECT * FROM clasificacion")


def get_jornadas() -> list[dict]:
    return _query("SELECT * FROM jornadas ORDER BY numero")


def get_jornada(numero: int) -> dict | None:
    jornada = _one("SELECT * FROM jornadas WHERE numero = %s", (numero,))
    if not jornada:
        return None
    partidos = _query(
        """
        SELECT p.*,
               row_to_json(el.*) AS equipo_local,
               row_to_json(ev.*) AS equipo_visitante
        FROM   partidos p
        LEFT   JOIN equipos el ON el.id = p.equipo_local_id
        LEFT   JOIN equipos ev ON ev.id = p.equipo_visitante_id
        WHERE  p.jornada_id = %s
        ORDER  BY p.hora_inicio
        """,
        (str(jornada["id"]),),
    )
    return {**jornada, "partidos": partidos}


def get_partidos(jornada_numero: int | None = None) -> list[dict]:
    base = """
        SELECT p.*,
               row_to_json(el.*) AS equipo_local,
               row_to_json(ev.*) AS equipo_visitante
        FROM   partidos p
        LEFT   JOIN equipos el ON el.id = p.equipo_local_id
        LEFT   JOIN equipos ev ON ev.id = p.equipo_visitante_id
    """
    if jornada_numero is not None:
        return _query(
            base + " WHERE p.jornada_id = (SELECT id FROM jornadas WHERE numero = %s) ORDER BY p.hora_inicio",
            (jornada_numero,),
        )
    return _query(base + " ORDER BY p.hora_inicio")


def get_partido(partido_id: str) -> dict | None:
    partido = _one(
        """
        SELECT p.*,
               row_to_json(el.*) AS equipo_local,
               row_to_json(ev.*) AS equipo_visitante
        FROM   partidos p
        LEFT   JOIN equipos el ON el.id = p.equipo_local_id
        LEFT   JOIN equipos ev ON ev.id = p.equipo_visitante_id
        WHERE  p.id = %s
        """,
        (partido_id,),
    )
    if not partido:
        return None
    estadisticas = _query(
        """
        SELECT ej.*, row_to_json(j.*) AS jugador
        FROM   estadisticas_jugador ej
        LEFT   JOIN jugadores j ON j.id = ej.jugador_id
        WHERE  ej.partido_id = %s
        """,
        (partido_id,),
    )
    return {**partido, "estadisticas": estadisticas}


def get_equipos() -> list[dict]:
    return _query("SELECT * FROM equipos ORDER BY nombre")


def get_equipo(equipo_id: str) -> dict | None:
    equipo = _one("SELECT * FROM equipos WHERE id = %s", (equipo_id,))
    if not equipo:
        return None
    jugadores = _query(
        "SELECT * FROM jugadores WHERE equipo_id = %s AND activo = true ORDER BY dorsal",
        (equipo_id,),
    )
    return {**equipo, "jugadores": jugadores}


def get_jugadores(equipo_id: str | None = None) -> list[dict]:
    if equipo_id:
        return _query(
            "SELECT * FROM jugadores WHERE activo = true AND equipo_id = %s ORDER BY nombre",
            (equipo_id,),
        )
    return _query("SELECT * FROM jugadores WHERE activo = true ORDER BY nombre")


def get_goleadores() -> list[dict]:
    jornada = _one("SELECT id FROM jornadas WHERE estado = 'en_curso'") or _one(
        "SELECT id FROM jornadas WHERE estado = 'finalizada' ORDER BY numero DESC LIMIT 1"
    )
    if not jornada:
        return []
    return _query(
        """
        SELECT j.id, j.nombre, e.nombre AS equipo, j.posicion,
               COALESCE(SUM(ej.goles), 0)::int       AS goles,
               COALESCE(SUM(ej.asistencias), 0)::int AS asistencias
        FROM   estadisticas_jugador ej
        JOIN   partidos  p ON p.id = ej.partido_id
        JOIN   jugadores j ON j.id = ej.jugador_id
        JOIN   equipos   e ON e.id = j.equipo_id
        WHERE  p.jornada_id = %s AND p.estado = 'finished'
        GROUP  BY j.id, j.nombre, e.nombre, j.posicion
        ORDER  BY goles DESC, asistencias DESC
        LIMIT  10
        """,
        (str(jornada["id"]),),
    )


def get_cruces() -> list[dict]:
    return _query(
        """
        SELECT c.*,
               row_to_json(el.*) AS equipo_local,
               row_to_json(ev.*) AS equipo_visitante
        FROM   cruces c
        LEFT   JOIN equipos el ON el.id = c.equipo_local_id
        LEFT   JOIN equipos ev ON ev.id = c.equipo_visitante_id
        """
    )
