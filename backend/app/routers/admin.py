import hashlib
import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_admin_user
from app.config import settings
from app.database import supabase_admin
from app.schemas.admin import (
    ActualizarEquipoIn,
    ActualizarJornadaIn,
    ActualizarJugadorIn,
    ActualizarPartidoIn,
    CrearEquipoIn,
    CrearJornadaIn,
    CrearJugadorIn,
    CrearPartidoIn,
    PutEstadisticasIn,
)
from app.schemas.common import ApiResponse
from app.scoring import calcular_puntos_jugador

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_admin_user)])


# ---- Jornadas ----

@router.get("/jornadas", response_model=ApiResponse[list[dict]])
def listar_jornadas() -> dict:
    result = supabase_admin.table("jornadas").select("*").order("numero").execute()
    return {"data": result.data}


@router.post("/jornadas", response_model=ApiResponse[dict], status_code=201)
def crear_jornada(body: CrearJornadaIn) -> dict:
    result = supabase_admin.table("jornadas").insert(body.model_dump(mode="json")).execute()
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

@router.get("/partidos", response_model=ApiResponse[list[dict]])
def listar_partidos_admin(jornada_id: UUID | None = Query(default=None)) -> dict:
    q = supabase_admin.table("partidos").select(
        "*, equipo_local:equipos!equipo_local_id(id, nombre), equipo_visitante:equipos!equipo_visitante_id(id, nombre)"
    )
    if jornada_id is not None:
        q = q.eq("jornada_id", str(jornada_id))
    result = q.order("hora_inicio").execute()
    return {"data": result.data}


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


@router.get("/partidos/{partido_id}/estadisticas", response_model=ApiResponse[list[dict]])
def get_estadisticas(partido_id: UUID) -> dict:
    result = (
        supabase_admin.table("estadisticas_jugador")
        .select("*")
        .eq("partido_id", str(partido_id))
        .execute()
    )
    return {"data": result.data}


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

@router.get("/jugadores", response_model=ApiResponse[list[dict]])
def listar_jugadores_admin(equipo_id: UUID | None = Query(default=None)) -> dict:
    q = supabase_admin.table("jugadores").select("*, equipo:equipos(id, nombre)")
    if equipo_id is not None:
        q = q.eq("equipo_id", str(equipo_id))
    result = q.order("nombre").execute()
    return {"data": result.data}


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


@router.delete("/jugadores/{jugador_id}", response_model=ApiResponse[dict])
def baja_jugador(jugador_id: UUID) -> dict:
    result = supabase_admin.table("jugadores").update({"activo": False}).eq("id", str(jugador_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return {"data": result.data[0]}


@router.delete("/jugadores/{jugador_id}/foto", response_model=ApiResponse[dict])
def eliminar_foto_jugador(jugador_id: UUID) -> dict:
    result = supabase_admin.table("jugadores").update({"foto_url": None}).eq("id", str(jugador_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return {"data": result.data[0]}


# ---- Equipos ----

@router.get("/equipos", response_model=ApiResponse[list[dict]])
def listar_equipos_admin() -> dict:
    result = supabase_admin.table("equipos").select("*").order("nombre").execute()
    return {"data": result.data}


@router.post("/equipos", response_model=ApiResponse[dict], status_code=201)
def crear_equipo(body: CrearEquipoIn) -> dict:
    result = supabase_admin.table("equipos").insert(body.model_dump(mode="json", exclude_none=True)).execute()
    return {"data": result.data[0] if result.data else None}


@router.patch("/equipos/{equipo_id}", response_model=ApiResponse[dict])
def actualizar_equipo(equipo_id: UUID, body: ActualizarEquipoIn) -> dict:
    cambios = body.model_dump(mode="json", exclude_unset=True)
    if not cambios:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos a actualizar")
    result = supabase_admin.table("equipos").update(cambios).eq("id", str(equipo_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return {"data": result.data[0]}


# ---- Ligas fantasy (para participantes) ----

@router.get("/ligas", response_model=ApiResponse[list[dict]])
def listar_ligas_admin() -> dict:
    result = supabase_admin.table("ligas_fantasy").select("id, nombre, codigo_invitacion").order("nombre").execute()
    return {"data": result.data}


@router.get("/ligas/{liga_id}/participantes", response_model=ApiResponse[list[dict]])
def listar_participantes(liga_id: UUID) -> dict:
    result = (
        supabase_admin.table("miembros_liga_fantasy")
        .select("id, nombre_equipo, puntos_total, presupuesto, perfil:perfiles!usuario_id(nombre)")
        .eq("liga_id", str(liga_id))
        .order("puntos_total", desc=True)
        .execute()
    )
    rows = [
        {
            "posicion": i + 1,
            "miembro_id": m["id"],
            "nombre_equipo": m["nombre_equipo"],
            "manager": (m.get("perfil") or {}).get("nombre", ""),
            "puntos_total": m["puntos_total"],
            "presupuesto": m["presupuesto"],
        }
        for i, m in enumerate(result.data)
    ]
    return {"data": rows}


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


# ---- Cloudinary ----

@router.get("/upload-signature", response_model=ApiResponse[dict])
def generar_firma_upload(folder: str = Query(default="liga")) -> dict:
    timestamp = int(time.time())
    params_to_sign = f"folder={folder}&timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(params_to_sign.encode()).hexdigest()
    return {"data": {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": settings.cloudinary_cloud_name,
        "api_key": settings.cloudinary_api_key,
        "folder": folder,
    }}


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
