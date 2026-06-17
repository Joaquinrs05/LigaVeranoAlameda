from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.database import supabase_admin
from app.ratelimit import limiter
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

# Tope duro de paginación para endpoints que pueden crecer.
MAX_PAGE = 200


@router.get("/clasificacion", response_model=ApiResponse[list[ClasificacionRow]])
@limiter.limit(settings.rate_limit_public)
def get_clasificacion(request: Request) -> dict:
    result = supabase_admin.table("clasificacion").select("*").execute()
    return {"data": result.data}


@router.get("/jornadas", response_model=ApiResponse[list[JornadaOut]])
@limiter.limit(settings.rate_limit_public)
def get_jornadas(request: Request) -> dict:
    result = supabase_admin.table("jornadas").select("*").order("numero").execute()
    return {"data": result.data}


@router.get("/jornadas/{numero}", response_model=ApiResponse[JornadaConPartidosOut])
@limiter.limit(settings.rate_limit_public)
def get_jornada(request: Request, numero: int) -> dict:
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


@router.get("/partidos", response_model=ApiResponse[list[PartidoOut]])
@limiter.limit(settings.rate_limit_public)
def get_partidos(request: Request, jornada: int | None = Query(default=None)) -> dict:
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


@router.get("/partidos/{partido_id}", response_model=ApiResponse[PartidoConEstadisticasOut])
@limiter.limit(settings.rate_limit_public)
def get_partido(request: Request, partido_id: UUID) -> dict:
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


@router.get("/equipos", response_model=ApiResponse[list[EquipoOut]])
@limiter.limit(settings.rate_limit_public)
def get_equipos(request: Request) -> dict:
    result = supabase_admin.table("equipos").select("*").order("nombre").execute()
    return {"data": result.data}


@router.get("/equipos/{equipo_id}", response_model=ApiResponse[EquipoConStatsOut])
@limiter.limit(settings.rate_limit_public)
def get_equipo(request: Request, equipo_id: UUID) -> dict:
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


@router.get("/jugadores", response_model=ApiResponse[list[JugadorOut]])
@limiter.limit(settings.rate_limit_public)
def get_jugadores(
    request: Request,
    equipo: UUID | None = Query(default=None),
    limit: int = Query(default=MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(default=0, ge=0),
) -> dict:
    q = supabase_admin.table("jugadores").select("*").eq("activo", True)
    if equipo is not None:
        q = q.eq("equipo_id", str(equipo))
    result = q.order("nombre").range(offset, offset + limit - 1).execute()
    return {"data": result.data}


@router.get("/goleadores", response_model=ApiResponse[list[dict]])
@limiter.limit(settings.rate_limit_public)
def get_goleadores(request: Request) -> dict:
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


@router.get("/cruces", response_model=ApiResponse[list[dict]])
@limiter.limit(settings.rate_limit_public)
def get_cruces(request: Request) -> dict:
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
