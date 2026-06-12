from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.database import supabase_admin
from app import database_local as local
from app.schemas.common import ApiResponse
from app.schemas.liga_real import (
    ClasificacionRow,
    EquipoConStatsOut,
    EquipoOut,
    JornadaConPartidosOut,
    JornadaOut,
    JugadorOut,
    PartidoConEstadisticasOut,
    PartidoOut,
)

router = APIRouter(tags=["liga-real"])

_NET_ERRORS = (httpx.TransportError, httpx.TimeoutException)


@router.get("/clasificacion", response_model=ApiResponse[list[ClasificacionRow]])
def get_clasificacion() -> dict:
    try:
        result = supabase_admin.table("clasificacion").select("*").execute()
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_clasificacion()}


@router.get("/jornadas", response_model=ApiResponse[list[JornadaOut]])
def get_jornadas() -> dict:
    try:
        result = supabase_admin.table("jornadas").select("*").order("numero").execute()
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_jornadas()}


@router.get("/jornadas/{numero}", response_model=ApiResponse[JornadaConPartidosOut])
def get_jornada(numero: int) -> dict:
    try:
        jornada = (
            supabase_admin.table("jornadas").select("*").eq("numero", numero).maybe_single().execute()
        )
        if not jornada.data:
            raise HTTPException(status_code=404, detail="Jornada no encontrada")
        partidos = (
            supabase_admin.table("partidos")
            .select("*, equipo_local:equipos!equipo_local_id(*), equipo_visitante:equipos!equipo_visitante_id(*)")
            .eq("jornada_id", jornada.data["id"])
            .order("hora_inicio")
            .execute()
        )
        return {"data": {**jornada.data, "partidos": partidos.data}}
    except _NET_ERRORS:
        data = local.get_jornada(numero)
        if not data:
            raise HTTPException(status_code=404, detail="Jornada no encontrada")
        return {"data": data}


@router.get("/partidos", response_model=ApiResponse[list[PartidoOut]])
def get_partidos(jornada: int | None = Query(default=None)) -> dict:
    try:
        q = supabase_admin.table("partidos").select(
            "*, equipo_local:equipos!equipo_local_id(*), equipo_visitante:equipos!equipo_visitante_id(*)"
        )
        if jornada is not None:
            jornada_row = (
                supabase_admin.table("jornadas").select("id").eq("numero", jornada).maybe_single().execute()
            )
            if not jornada_row.data:
                return {"data": []}
            q = q.eq("jornada_id", jornada_row.data["id"])
        result = q.order("hora_inicio").execute()
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_partidos(jornada)}


@router.get("/partidos/{partido_id}", response_model=ApiResponse[PartidoConEstadisticasOut])
def get_partido(partido_id: UUID) -> dict:
    try:
        partido = (
            supabase_admin.table("partidos")
            .select("*, equipo_local:equipos!equipo_local_id(*), equipo_visitante:equipos!equipo_visitante_id(*)")
            .eq("id", str(partido_id))
            .maybe_single()
            .execute()
        )
        if not partido.data:
            raise HTTPException(status_code=404, detail="Partido no encontrado")
        stats = (
            supabase_admin.table("estadisticas_jugador")
            .select("*, jugador:jugadores(*)")
            .eq("partido_id", str(partido_id))
            .execute()
        )
        return {"data": {**partido.data, "estadisticas": stats.data}}
    except _NET_ERRORS:
        data = local.get_partido(str(partido_id))
        if not data:
            raise HTTPException(status_code=404, detail="Partido no encontrado")
        return {"data": data}


@router.get("/equipos", response_model=ApiResponse[list[EquipoOut]])
def get_equipos() -> dict:
    try:
        result = supabase_admin.table("equipos").select("*").order("nombre").execute()
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_equipos()}


@router.get("/equipos/{equipo_id}", response_model=ApiResponse[EquipoConStatsOut])
def get_equipo(equipo_id: UUID) -> dict:
    try:
        equipo = (
            supabase_admin.table("equipos").select("*").eq("id", str(equipo_id)).maybe_single().execute()
        )
        if not equipo.data:
            raise HTTPException(status_code=404, detail="Equipo no encontrado")
        jugadores = (
            supabase_admin.table("jugadores")
            .select("*")
            .eq("equipo_id", str(equipo_id))
            .eq("activo", True)
            .order("dorsal")
            .execute()
        )
        return {"data": {**equipo.data, "jugadores": jugadores.data}}
    except _NET_ERRORS:
        data = local.get_equipo(str(equipo_id))
        if not data:
            raise HTTPException(status_code=404, detail="Equipo no encontrado")
        return {"data": data}


@router.get("/jugadores", response_model=ApiResponse[list[JugadorOut]])
def get_jugadores(equipo: UUID | None = Query(default=None)) -> dict:
    try:
        q = supabase_admin.table("jugadores").select("*").eq("activo", True)
        if equipo is not None:
            q = q.eq("equipo_id", str(equipo))
        result = q.order("nombre").execute()
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_jugadores(str(equipo) if equipo else None)}


@router.get("/goleadores", response_model=ApiResponse[list[dict]])
def get_goleadores() -> dict:
    try:
        jornada_res = (
            supabase_admin.table("jornadas").select("id").eq("estado", "en_curso").maybe_single().execute()
        )
        if not jornada_res or not jornada_res.data:
            j_res = (
                supabase_admin.table("jornadas")
                .select("id")
                .eq("estado", "finalizada")
                .order("numero", desc=True)
                .limit(1)
                .execute()
            )
            jornada_id = j_res.data[0]["id"] if j_res.data else None
        else:
            jornada_id = jornada_res.data["id"]

        if not jornada_id:
            return {"data": []}

        partidos_res = (
            supabase_admin.table("partidos")
            .select("id")
            .eq("jornada_id", jornada_id)
            .eq("estado", "finished")
            .execute()
        )
        partido_ids = [p["id"] for p in partidos_res.data]
        if not partido_ids:
            return {"data": []}

        stats_res = (
            supabase_admin.table("estadisticas_jugador")
            .select("goles, asistencias, jugador:jugadores(id, nombre, posicion, equipo:equipos(nombre))")
            .in_("partido_id", partido_ids)
            .execute()
        )

        aggregated: dict[str, dict] = {}
        for s in stats_res.data:
            jug = s.get("jugador") or {}
            jid = jug.get("id")
            if not jid:
                continue
            if jid not in aggregated:
                aggregated[jid] = {
                    "id": jid,
                    "nombre": jug.get("nombre", ""),
                    "equipo": (jug.get("equipo") or {}).get("nombre", ""),
                    "posicion": jug.get("posicion", ""),
                    "goles": 0,
                    "asistencias": 0,
                }
            aggregated[jid]["goles"] += s.get("goles", 0)
            aggregated[jid]["asistencias"] += s.get("asistencias", 0)

        top = sorted(aggregated.values(), key=lambda x: (-x["goles"], -x["asistencias"]))[:10]
        return {"data": top}
    except _NET_ERRORS:
        return {"data": local.get_goleadores()}


@router.get("/cruces", response_model=ApiResponse[list[dict]])
def get_cruces() -> dict:
    try:
        result = (
            supabase_admin.table("cruces")
            .select(
                "id, fase, goles_local, goles_visitante, estado,"
                " equipo_local:equipos!equipo_local_id(nombre, abrev),"
                " equipo_visitante:equipos!equipo_visitante_id(nombre, abrev)"
            )
            .execute()
        )
        return {"data": result.data}
    except _NET_ERRORS:
        return {"data": local.get_cruces()}
