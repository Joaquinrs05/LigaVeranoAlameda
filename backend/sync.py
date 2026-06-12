"""
Sincroniza las tablas de liga real desde Supabase al PostgreSQL local del VPS.

Uso desde dentro del contenedor:
    docker exec liga-verano-api python sync.py

Uso desde fuera (con túnel SSH expuesto en el host):
    ssh -L 5433:localhost:5432 user@vps-ip
    LOCAL_DB_URL=postgresql://ligaverano:PASS@localhost:5433/ligaverano python sync.py

El script hace TRUNCATE + INSERT en orden de FK. La vista `clasificacion`
se recalcula sola a partir de `partidos` y `equipos`.
"""

from __future__ import annotations

import os
import sys

import psycopg2
import psycopg2.extras
from supabase import Client, create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
LOCAL_DB_URL = os.environ.get(
    "LOCAL_DB_URL",
    os.environ.get("local_db_url", "postgresql://ligaverano:ligaverano_local@db:5432/ligaverano"),
)

TABLES_IN_FK_ORDER = [
    "equipos",
    "jornadas",
    "jugadores",
    "partidos",
    "estadisticas_jugador",
    "cruces",
]

SELECTS: dict[str, str] = {
    "equipos":              "*",
    "jornadas":             "*",
    "jugadores":            "*",
    "partidos":             "*",
    "estadisticas_jugador": "*",
    "cruces":               "*",
}

COLUMNS: dict[str, list[str]] = {
    "equipos":  ["id", "nombre", "abrev", "color", "foto_url", "created_at"],
    "jornadas": ["id", "numero", "fecha_inicio", "fecha_fin", "estado", "mercado_activo"],
    "jugadores": ["id", "equipo_id", "nombre", "dorsal", "posicion", "precio_fantasy", "estado_fantasy", "activo"],
    "partidos": ["id", "jornada_id", "equipo_local_id", "equipo_visitante_id",
                 "goles_local", "goles_visitante", "estado", "hora_inicio", "minuto"],
    "estadisticas_jugador": ["id", "jugador_id", "partido_id", "goles", "asistencias",
                              "tarjeta_amarilla", "tarjeta_roja", "minutos_jugados",
                              "portero_sin_goles", "puntos_fantasy"],
    "cruces": ["id", "fase", "equipo_local_id", "equipo_visitante_id",
               "goles_local", "goles_visitante", "estado"],
}


def fetch_table(sb: Client, table: str) -> list[dict]:
    result = sb.table(table).select(SELECTS[table]).execute()
    return result.data or []


def sync_table(cur: psycopg2.extensions.cursor, table: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    cols = COLUMNS[table]
    placeholders = ", ".join(["%s"] * len(cols))
    col_list = ", ".join(cols)
    sql = f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
    values = [tuple(row.get(c) for c in cols) for row in rows]
    cur.executemany(sql, values)
    return len(values)


def main() -> None:
    print("Conectando a Supabase...")
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("Conectando a PostgreSQL local...")
    conn = psycopg2.connect(LOCAL_DB_URL)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            print("Truncando tablas locales...")
            # Reverse order for FK deps, then CASCADE
            cur.execute(
                "TRUNCATE estadisticas_jugador, cruces, partidos, jugadores, jornadas, equipos RESTART IDENTITY CASCADE"
            )

            for table in TABLES_IN_FK_ORDER:
                print(f"  Sincronizando {table}...", end=" ", flush=True)
                rows = fetch_table(sb, table)
                n = sync_table(cur, table, rows)
                print(f"{n} filas")

        conn.commit()
        print("Sincronización completada.")
    except Exception as exc:
        conn.rollback()
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
