from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_admin_user
from app.database import supabase_admin
from app.schemas.admin import (
    ActualizarJornadaIn,
    ActualizarJugadorIn,
    ActualizarPartidoIn,
    CrearJornadaIn,
    CrearJugadorIn,
    CrearPartidoIn,
    PutEstadisticasIn,
)
from app.schemas.common import ApiResponse
from app.scoring import calcular_puntos_jugador

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])


# ---- Jornadas ----

@router.post("/jornadas", response_model=ApiResponse[dict], status_code=201)
def crear_jornada(body: CrearJornadaIn) -> dict:
    result = supabase_admin.table("jornadas").insert(body.model_dump()).execute()
    return {"data": result.data[0] if result.data else None}


@router.patch("/jornadas/{jornada_id}", response_model=ApiResponse[dict])
def actualizar_jornada(jornada_id: UUID, body: ActualizarJornadaIn) -> dict:
    cambios = {k: v for k, v in body.model_dump().items() if v is not None}
    if not cambios:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos a actualizar")
    result = supabase_admin.table("jornadas").update(cambios).eq("id", str(jornada_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Jornada no encontrada")
    return {"data": result.data[0]}


# ---- Partidos ----

@router.post("/partidos", response_model=ApiResponse[dict], status_code=201)
def crear_partido(body: CrearPartidoIn) -> dict:
    result = supabase_admin.table("partidos").insert(
        body.model_dump(mode="json")
    ).execute()
    return {"data": result.data[0] if result.data else None}


@router.patch("/partidos/{partido_id}", response_model=ApiResponse[dict])
def actualizar_partido(partido_id: UUID, body: ActualizarPartidoIn) -> dict:
    cambios = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    if not cambios:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos a actualizar")
    result = supabase_admin.table("partidos").update(cambios).eq("id", str(partido_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    if cambios.get("estado") == "finished":
        _recalcular_puntos_partido(str(partido_id))
    return {"data": result.data[0]}


@router.put("/partidos/{partido_id}/estadisticas", response_model=ApiResponse[list[dict]])
def put_estadisticas(partido_id: UUID, body: PutEstadisticasIn) -> dict:
    jugador_ids = [str(e.jugador_id) for e in body.estadisticas]
    jugadores_res = (
        supabase_admin.table("jugadores")
        .select("id, posicion")
        .in_("id", jugador_ids)
        .execute()
    )
    pos_map: dict[str, str] = {j["id"]: j["posicion"] for j in jugadores_res.data}

    rows = []
    for e in body.estadisticas:
        posicion = pos_map.get(str(e.jugador_id), "delantero")
        pts = calcular_puntos_jugador(
            posicion=posicion,
            goles=e.goles,
            asistencias=e.asistencias,
            tarjeta_amarilla=e.tarjeta_amarilla,
            tarjeta_roja=e.tarjeta_roja,
            minutos_jugados=e.minutos_jugados,
            portero_sin_goles=e.portero_sin_goles,
        )
        rows.append({
            "jugador_id": str(e.jugador_id),
            "partido_id": str(partido_id),
            "goles": e.goles,
            "asistencias": e.asistencias,
            "tarjeta_amarilla": e.tarjeta_amarilla,
            "tarjeta_roja": e.tarjeta_roja,
            "minutos_jugados": e.minutos_jugados,
            "portero_sin_goles": e.portero_sin_goles,
            "puntos_fantasy": pts,
        })

    result = supabase_admin.table("estadisticas_jugador").upsert(
        rows, on_conflict="jugador_id,partido_id"
    ).execute()
    return {"data": result.data}


# ---- Jugadores ----

@router.post("/jugadores", response_model=ApiResponse[dict], status_code=201)
def crear_jugador(body: CrearJugadorIn) -> dict:
    result = supabase_admin.table("jugadores").insert(
        body.model_dump(mode="json")
    ).execute()
    return {"data": result.data[0] if result.data else None}


@router.patch("/jugadores/{jugador_id}", response_model=ApiResponse[dict])
def actualizar_jugador(jugador_id: UUID, body: ActualizarJugadorIn) -> dict:
    cambios = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    if not cambios:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos a actualizar")
    result = supabase_admin.table("jugadores").update(cambios).eq("id", str(jugador_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return {"data": result.data[0]}


# ---- Puntuaciones ----

@router.post("/puntuaciones/calcular/{jornada_numero}", response_model=ApiResponse[dict])
def calcular_puntuaciones(jornada_numero: int) -> dict:
    _jornada_res = (
        supabase_admin.table("jornadas")
        .select("id")
        .eq("numero", jornada_numero)
        .maybe_single()
        .execute()
    )
    jornada_data = _jornada_res.data if _jornada_res is not None else None
    if not jornada_data:
        raise HTTPException(status_code=404, detail="Jornada no encontrada")

    partidos_res = (
        supabase_admin.table("partidos")
        .select("id")
        .eq("jornada_id", jornada_data["id"])
        .eq("estado", "finished")
        .execute()
    )
    partido_ids = [p["id"] for p in partidos_res.data]
    if not partido_ids:
        raise HTTPException(status_code=400, detail="No hay partidos finalizados en esta jornada")

    stats_res = (
        supabase_admin.table("estadisticas_jugador")
        .select("jugador_id, puntos_fantasy")
        .in_("partido_id", partido_ids)
        .execute()
    )
    jugador_pts: dict[str, int] = {}
    for s in stats_res.data:
        jugador_pts[s["jugador_id"]] = jugador_pts.get(s["jugador_id"], 0) + s["puntos_fantasy"]

    miembros_res = supabase_admin.table("miembros_liga_fantasy").select("id, liga_id").execute()

    registros_insertados = 0
    for miembro in miembros_res.data:
        miembro_id = miembro["id"]
        plantilla_res = (
            supabase_admin.table("plantilla_fantasy")
            .select("jugador_id, es_capitan")
            .eq("miembro_id", miembro_id)
            .eq("es_titular", True)
            .execute()
        )
        total = 0
        for item in plantilla_res.data:
            pts = jugador_pts.get(item["jugador_id"], 0)
            if item["es_capitan"]:
                pts *= 2
            total += pts

        supabase_admin.table("puntuaciones_fantasy").upsert(
            {
                "miembro_id": miembro_id,
                "jornada_numero": jornada_numero,
                "puntos": total,
            },
            on_conflict="miembro_id,jornada_numero",
        ).execute()

        puntos_actuales_res = (
            supabase_admin.table("miembros_liga_fantasy")
            .select("puntos_total")
            .eq("id", miembro_id)
            .single()
            .execute()
        )
        nuevo_total = puntos_actuales_res.data["puntos_total"] + total
        supabase_admin.table("miembros_liga_fantasy").update(
            {"puntos_total": nuevo_total}
        ).eq("id", miembro_id).execute()
        registros_insertados += 1

    return {"data": {"miembros_calculados": registros_insertados, "jornada": jornada_numero}}


# ---- Helpers ----

def _recalcular_puntos_partido(partido_id: str) -> None:
    stats_res = (
        supabase_admin.table("estadisticas_jugador")
        .select("id, jugador_id, goles, asistencias, tarjeta_amarilla, tarjeta_roja, minutos_jugados, portero_sin_goles")
        .eq("partido_id", partido_id)
        .execute()
    )
    if not stats_res.data:
        return
    jugador_ids = [s["jugador_id"] for s in stats_res.data]
    jug_res = (
        supabase_admin.table("jugadores")
        .select("id, posicion")
        .in_("id", jugador_ids)
        .execute()
    )
    pos_map = {j["id"]: j["posicion"] for j in jug_res.data}

    for s in stats_res.data:
        pts = calcular_puntos_jugador(
            posicion=pos_map.get(s["jugador_id"], "delantero"),
            goles=s["goles"],
            asistencias=s["asistencias"],
            tarjeta_amarilla=s["tarjeta_amarilla"],
            tarjeta_roja=s["tarjeta_roja"],
            minutos_jugados=s["minutos_jugados"],
            portero_sin_goles=s["portero_sin_goles"],
        )
        supabase_admin.table("estadisticas_jugador").update(
            {"puntos_fantasy": pts}
        ).eq("id", s["id"]).execute()
