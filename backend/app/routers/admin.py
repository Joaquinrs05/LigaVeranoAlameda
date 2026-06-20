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

# Tope duro de paginación para listados que pueden crecer.
MAX_PAGE = 200


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
        .select("id, equipo_id, posicion")
        .in_("id", jugador_ids)
        .execute()
    )
    equipo_map: dict[str, str] = {j["id"]: j["equipo_id"] for j in jugadores_res.data}
    pos_map: dict[str, str] = {j["id"]: j["posicion"] for j in jugadores_res.data}
    resultado_map = _resultado_equipo_map(str(partido_id))

    rows = []
    for e in body.estadisticas:
        gana, empata, porteria_cero = resultado_map.get(
            equipo_map.get(str(e.jugador_id), ""), (False, False, False)
        )
        pts = calcular_puntos_jugador(
            posicion=pos_map.get(str(e.jugador_id), "delantero"),
            goles=e.goles,
            tarjeta_amarilla=e.tarjeta_amarilla,
            tarjeta_roja=e.tarjeta_roja,
            equipo_gana=gana,
            equipo_empata=empata,
            porteria_cero=porteria_cero,
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
def listar_jugadores_admin(
    equipo_id: UUID | None = Query(default=None),
    limit: int = Query(default=MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(default=0, ge=0),
) -> dict:
    q = supabase_admin.table("jugadores").select("*, equipo:equipos(id, nombre)")
    if equipo_id is not None:
        q = q.eq("equipo_id", str(equipo_id))
    result = q.order("nombre").range(offset, offset + limit - 1).execute()
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
    equipos = result.data or []
    ids = [e["entrenador_id"] for e in equipos if e.get("entrenador_id")]
    nombres: dict[str, str] = {}
    if ids:
        pres = supabase_admin.table("perfiles").select("id, nombre").in_("id", ids).execute()
        nombres = {str(p["id"]): str(p["nombre"]) for p in (pres.data or []) if isinstance(p, dict)}
    for e in equipos:
        e["entrenador"] = {"nombre": nombres[e["entrenador_id"]]} if e.get("entrenador_id") and e["entrenador_id"] in nombres else None
    return {"data": equipos}


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


# ---- Perfiles (para asignar entrenadores) ----

@router.get("/perfiles", response_model=ApiResponse[list[dict]])
def listar_perfiles(
    limit: int = Query(default=MAX_PAGE, ge=1, le=MAX_PAGE),
    offset: int = Query(default=0, ge=0),
) -> dict:
    result = (
        supabase_admin.table("perfiles")
        .select("id, nombre")
        .order("nombre")
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"data": result.data or []}


# ---- Ligas fantasy (para participantes) ----

@router.get("/ligas", response_model=ApiResponse[list[dict]])
def listar_ligas_admin() -> dict:
    result = supabase_admin.table("ligas_fantasy").select("id, nombre, codigo_invitacion").order("nombre").execute()
    return {"data": result.data}


@router.get("/ligas/{liga_id}/participantes", response_model=ApiResponse[list[dict]])
def listar_participantes(liga_id: UUID) -> dict:
    # puntos_total y posicion salen ya calculados de la vista clasificacion_fantasy
    # (suma en vivo de puntuaciones_fantasy); la vista no tiene FK a perfiles, así
    # que resolvemos los nombres de manager en una consulta aparte.
    result = (
        supabase_admin.table("clasificacion_fantasy")
        .select("miembro_id, usuario_id, nombre_equipo, puntos_total, presupuesto, posicion")
        .eq("liga_id", str(liga_id))
        .order("puntos_total", desc=True)
        .execute()
    )
    usuario_ids = [r["usuario_id"] for r in result.data]
    nombres: dict[str, str] = {}
    if usuario_ids:
        pres = supabase_admin.table("perfiles").select("id, nombre").in_("id", usuario_ids).execute()
        nombres = {str(p["id"]): str(p["nombre"]) for p in (pres.data or []) if isinstance(p, dict)}

    rows = [
        {
            "posicion": r["posicion"],
            "miembro_id": r["miembro_id"],
            "nombre_equipo": r["nombre_equipo"],
            "manager": nombres.get(str(r["usuario_id"]), ""),
            "puntos_total": r["puntos_total"],
            "presupuesto": r["presupuesto"],
        }
        for r in result.data
    ]
    return {"data": rows}


# ---- Puntuaciones ----

@router.get("/puntuaciones/resumen/{jornada_numero}", response_model=ApiResponse[dict])
def resumen_puntuaciones(jornada_numero: int) -> dict:
    """Eventos registrados de una jornada (goles, tarjetas) para revisar antes de calcular."""
    jornada_res = (
        supabase_admin.table("jornadas")
        .select("id")
        .eq("numero", jornada_numero)
        .maybe_single()
        .execute()
    )
    jornada = jornada_res.data if jornada_res is not None else None
    if not jornada:
        raise HTTPException(status_code=404, detail="Jornada no encontrada")

    partidos_res = (
        supabase_admin.table("partidos")
        .select(
            "id, estado, goles_local, goles_visitante, "
            "equipo_local:equipos!equipo_local_id(id, nombre), "
            "equipo_visitante:equipos!equipo_visitante_id(id, nombre)"
        )
        .eq("jornada_id", jornada["id"])
        .order("hora_inicio")
        .execute()
    )
    partidos = partidos_res.data or []
    partido_ids = [p["id"] for p in partidos]

    stats_by_partido: dict[str, list] = {}
    jugador_ids: list[str] = []
    if partido_ids:
        stats_res = (
            supabase_admin.table("estadisticas_jugador")
            .select("partido_id, jugador_id, goles, asistencias, tarjeta_amarilla, tarjeta_roja, puntos_fantasy")
            .in_("partido_id", partido_ids)
            .execute()
        )
        for s in stats_res.data:
            stats_by_partido.setdefault(s["partido_id"], []).append(s)
            jugador_ids.append(s["jugador_id"])

    jugador_map: dict[str, dict] = {}
    if jugador_ids:
        jug_res = (
            supabase_admin.table("jugadores")
            .select("id, nombre, posicion, equipo_id")
            .in_("id", jugador_ids)
            .execute()
        )
        jugador_map = {j["id"]: j for j in jug_res.data}

    partidos_out = []
    for p in partidos:
        gl, gv = p["goles_local"], p["goles_visitante"]
        eventos = []
        for s in stats_by_partido.get(p["id"], []):
            if not (s["goles"] or s["tarjeta_amarilla"] or s["tarjeta_roja"] or s["asistencias"]):
                continue
            j = jugador_map.get(s["jugador_id"], {})
            eventos.append({
                "jugador": j.get("nombre", "—"),
                "equipo_id": j.get("equipo_id"),
                "posicion": j.get("posicion"),
                "goles": s["goles"],
                "asistencias": s["asistencias"],
                "tarjeta_amarilla": s["tarjeta_amarilla"],
                "tarjeta_roja": s["tarjeta_roja"],
                "puntos": s["puntos_fantasy"],
            })
        local = p["equipo_local"]
        visitante = p["equipo_visitante"]
        partidos_out.append({
            "partido_id": p["id"],
            "estado": p["estado"],
            "equipo_local": local["nombre"] if local else None,
            "equipo_visitante": visitante["nombre"] if visitante else None,
            "equipo_local_id": local["id"] if local else None,
            "equipo_visitante_id": visitante["id"] if visitante else None,
            "goles_local": gl,
            "goles_visitante": gv,
            "porteria_cero_local": gv == 0 if gv is not None else False,
            "porteria_cero_visitante": gl == 0 if gl is not None else False,
            "eventos": eventos,
        })

    return {"data": {"jornada": jornada_numero, "partidos": partidos_out}}


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

    # Cálculo sin bucle por miembro: 4 consultas en total sin importar cuántos
    # miembros haya. Solo escribimos puntuaciones_fantasy de esta jornada;
    # puntos_total ya no se materializa (la vista clasificacion_fantasy lo suma
    # en vivo), así que no hay un segundo write por miembro. Ver migración 004.
    stats_res = (
        supabase_admin.table("estadisticas_jugador")
        .select("jugador_id, puntos_fantasy")
        .in_("partido_id", partido_ids)
        .execute()
    )
    jugador_pts: dict[str, int] = {}
    for s in stats_res.data:
        jugador_pts[s["jugador_id"]] = jugador_pts.get(s["jugador_id"], 0) + s["puntos_fantasy"]

    miembros_res = supabase_admin.table("miembros_liga_fantasy").select("id").execute()
    titulares_res = (
        supabase_admin.table("plantilla_fantasy")
        .select("miembro_id, jugador_id")
        .eq("es_titular", True)
        .execute()
    )

    puntos_por_miembro: dict[str, int] = {m["id"]: 0 for m in miembros_res.data}
    for t in titulares_res.data:
        pts = jugador_pts.get(t["jugador_id"], 0)
        puntos_por_miembro[t["miembro_id"]] = puntos_por_miembro.get(t["miembro_id"], 0) + pts

    rows = [
        {"miembro_id": miembro_id, "jornada_numero": jornada_numero, "puntos": puntos}
        for miembro_id, puntos in puntos_por_miembro.items()
    ]
    if rows:
        supabase_admin.table("puntuaciones_fantasy").upsert(
            rows, on_conflict="miembro_id,jornada_numero"
        ).execute()

    return {"data": {"miembros_calculados": len(rows), "jornada": jornada_numero}}


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

def _resultado_equipo_map(partido_id: str) -> dict[str, tuple[bool, bool, bool]]:
    """Devuelve {equipo_id: (gana, empata, porteria_cero)} para ambos equipos.

    Portería a cero = el equipo no encajó goles. Si el marcador aún no está
    registrado, ambos equipos quedan sin bonus.
    """
    p_res = (
        supabase_admin.table("partidos")
        .select("equipo_local_id, equipo_visitante_id, goles_local, goles_visitante")
        .eq("id", partido_id)
        .maybe_single()
        .execute()
    )
    p = p_res.data if p_res is not None else None
    if not p or p["goles_local"] is None or p["goles_visitante"] is None:
        return {}
    gl, gv = p["goles_local"], p["goles_visitante"]
    local, visitante = p["equipo_local_id"], p["equipo_visitante_id"]
    gana_local, empate = gl > gv, gl == gv
    return {
        local: (gana_local, empate, gv == 0),
        visitante: (not gana_local and not empate, empate, gl == 0),
    }


def _recalcular_puntos_partido(partido_id: str) -> None:
    stats_res = (
        supabase_admin.table("estadisticas_jugador")
        .select("id, jugador_id, goles, tarjeta_amarilla, tarjeta_roja")
        .eq("partido_id", partido_id)
        .execute()
    )
    if not stats_res.data:
        return
    jugador_ids = [s["jugador_id"] for s in stats_res.data]
    jug_res = (
        supabase_admin.table("jugadores")
        .select("id, equipo_id, posicion")
        .in_("id", jugador_ids)
        .execute()
    )
    equipo_map = {j["id"]: j["equipo_id"] for j in jug_res.data}
    pos_map = {j["id"]: j["posicion"] for j in jug_res.data}
    resultado_map = _resultado_equipo_map(partido_id)

    for s in stats_res.data:
        gana, empata, porteria_cero = resultado_map.get(
            equipo_map.get(s["jugador_id"], ""), (False, False, False)
        )
        pts = calcular_puntos_jugador(
            posicion=pos_map.get(s["jugador_id"], "delantero"),
            goles=s["goles"],
            tarjeta_amarilla=s["tarjeta_amarilla"],
            tarjeta_roja=s["tarjeta_roja"],
            equipo_gana=gana,
            equipo_empata=empata,
            porteria_cero=porteria_cero,
        )
        supabase_admin.table("estadisticas_jugador").update(
            {"puntos_fantasy": pts}
        ).eq("id", s["id"]).execute()
