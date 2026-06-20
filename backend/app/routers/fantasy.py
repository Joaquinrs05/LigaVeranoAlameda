import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.auth import get_current_user
from app.database import supabase_admin
from app.schemas.common import ApiResponse
from app.schemas.fantasy import (
    ActualizarPlantillaIn,
    CrearLigaIn,
    FicharJugadorIn,
    LigaDetalleOut,
    LigaFantasyOut,
    MiembroOut,
    PlantillaItemOut,
    UnirseALigaIn,
)

router = APIRouter(prefix="/fantasy", tags=["fantasy"])

# Presupuesto inicial (millones) con el que arranca cada miembro nuevo.
PRESUPUESTO_INICIAL = 50


def _uid(user: dict) -> str:
    return user.get("sub", "")


def _rpc_http_error(exc: APIError) -> HTTPException:
    """Traduce el error de una RPC a HTTPException.

    Las funciones RPC lanzan SQLSTATE 'PTxyz' (ver migración 005); PostgREST lo
    propaga como code='PTxyz'. Lo mapeamos al HTTP xyz con el mensaje original.
    Si no es un código nuestro, devolvemos 400 con el mensaje (mejor que un 500
    genérico que oculta la causa real al usuario).
    """
    code = getattr(exc, "code", "") or ""
    msg = getattr(exc, "message", None) or "No se pudo completar la operación"
    if len(code) == 5 and code.startswith("PT") and code[2:].isdigit():
        return HTTPException(status_code=int(code[2:]), detail=msg)
    return HTTPException(status_code=400, detail=msg)


def _ms(result) -> dict | None:
    """supabase-py v2.31: maybe_single().execute() devuelve None cuando no hay fila."""
    return result.data if result is not None else None


# ---- Ligas ----

@router.get("/ligas", response_model=ApiResponse[list[LigaFantasyOut]])
def mis_ligas(user: dict = Depends(get_current_user)) -> dict:
    miembros = (
        supabase_admin.table("miembros_liga_fantasy")
        .select("liga_id")
        .eq("usuario_id", _uid(user))
        .execute()
    )
    liga_ids = [m["liga_id"] for m in miembros.data]
    if not liga_ids:
        return {"data": []}
    result = supabase_admin.table("ligas_fantasy").select("*").in_("id", liga_ids).execute()
    return {"data": result.data}


@router.post("/ligas", response_model=ApiResponse[dict], status_code=201)
def crear_liga(body: CrearLigaIn, user: dict = Depends(get_current_user)) -> dict:
    uid = _uid(user)
    codigo = secrets.token_hex(3).upper()
    jornada_activa = _ms(
        supabase_admin.table("jornadas")
        .select("numero")
        .eq("estado", "en_curso")
        .maybe_single()
        .execute()
    )
    jornada_inicio = jornada_activa["numero"] if jornada_activa else 1

    liga_res = supabase_admin.table("ligas_fantasy").insert({
        "nombre": body.nombre,
        "codigo_invitacion": codigo,
        "creador_id": uid,
        "jornada_inicio": jornada_inicio,
    }).execute()
    liga = liga_res.data[0]

    supabase_admin.table("miembros_liga_fantasy").insert({
        "liga_id": liga["id"],
        "usuario_id": uid,
        "nombre_equipo": body.nombre_equipo,
        "presupuesto": PRESUPUESTO_INICIAL,
    }).execute()

    return {"data": {"liga_id": liga["id"], "codigo": codigo}}


@router.post("/ligas/unirse", response_model=ApiResponse[dict], status_code=201)
def unirse_a_liga(body: UnirseALigaIn, user: dict = Depends(get_current_user)) -> dict:
    uid = _uid(user)
    liga = _ms(
        supabase_admin.table("ligas_fantasy")
        .select("id")
        .eq("codigo_invitacion", body.codigo.upper())
        .maybe_single()
        .execute()
    )
    if not liga:
        raise HTTPException(status_code=404, detail="Código de liga no encontrado")
    liga_id = liga["id"]

    ya_miembro = _ms(
        supabase_admin.table("miembros_liga_fantasy")
        .select("id")
        .eq("liga_id", liga_id)
        .eq("usuario_id", uid)
        .maybe_single()
        .execute()
    )
    if ya_miembro:
        raise HTTPException(status_code=409, detail="Ya eres miembro de esta liga")

    result = supabase_admin.table("miembros_liga_fantasy").insert({
        "liga_id": liga_id,
        "usuario_id": uid,
        "nombre_equipo": body.nombre_equipo,
        "presupuesto": PRESUPUESTO_INICIAL,
    }).execute()
    miembro = result.data[0]
    return {"data": {"liga_id": liga_id, "miembro_id": miembro["id"]}}


@router.get("/ligas/{liga_id}", response_model=ApiResponse[LigaDetalleOut])
def get_liga(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    _verificar_miembro(str(liga_id), _uid(user))
    liga = _ms(
        supabase_admin.table("ligas_fantasy")
        .select("*")
        .eq("id", str(liga_id))
        .maybe_single()
        .execute()
    )
    if not liga:
        raise HTTPException(status_code=404, detail="Liga no encontrada")
    clasificacion = (
        supabase_admin.table("clasificacion_fantasy")
        .select("*")
        .eq("liga_id", str(liga_id))
        .execute()
    )
    jornada_activa = _ms(
        supabase_admin.table("jornadas")
        .select("mercado_activo")
        .eq("estado", "en_curso")
        .maybe_single()
        .execute()
    )
    mercado_activo = bool(jornada_activa and jornada_activa.get("mercado_activo"))
    return {"data": {**liga, "clasificacion": clasificacion.data, "mercado_activo": mercado_activo}}


# ---- Mi equipo ----

@router.get("/ligas/{liga_id}/mi-miembro", response_model=ApiResponse[MiembroOut])
def get_mi_miembro(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    # puntos_total ya no se materializa: se suma en vivo desde puntuaciones_fantasy
    # (pocas filas, una por jornada calculada).
    pts_res = (
        supabase_admin.table("puntuaciones_fantasy")
        .select("puntos")
        .eq("miembro_id", miembro["id"])
        .execute()
    )
    total = 0
    for p in pts_res.data:
        total += p["puntos"]
    miembro["puntos_total"] = total
    return {"data": miembro}


@router.get("/ligas/{liga_id}/mi-equipo", response_model=ApiResponse[list[PlantillaItemOut]])
def get_mi_equipo(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    plantilla = (
        supabase_admin.table("plantilla_fantasy")
        .select("*, jugador:jugadores(id, nombre, dorsal, posicion, precio_fantasy, estado_fantasy, activo, foto_url, equipo:equipos(nombre, abrev))")
        .eq("miembro_id", miembro["id"])
        .execute()
    )
    items = plantilla.data or []

    # Puntos acumulados por jugador (suma de todos sus partidos).
    jugador_ids = [it["jugador_id"] for it in items]
    puntos_map: dict[str, int] = {}
    if jugador_ids:
        stats = (
            supabase_admin.table("estadisticas_jugador")
            .select("jugador_id, puntos_fantasy")
            .in_("jugador_id", jugador_ids)
            .execute()
        )
        for s in stats.data:
            puntos_map[s["jugador_id"]] = puntos_map.get(s["jugador_id"], 0) + s["puntos_fantasy"]
    for it in items:
        it["puntos_total"] = puntos_map.get(it["jugador_id"], 0)

    return {"data": items}


@router.patch("/ligas/{liga_id}/mi-equipo", response_model=ApiResponse[dict])
def actualizar_mi_equipo(
    liga_id: UUID, body: ActualizarPlantillaIn, user: dict = Depends(get_current_user)
) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    miembro_id = miembro["id"]

    capitanes = [j for j in body.jugadores if j.es_capitan]
    if len(capitanes) > 1:
        raise HTTPException(status_code=400, detail="Solo puede haber un capitán")
    titulares = [j for j in body.jugadores if j.es_titular]
    if len(titulares) > 11:
        raise HTTPException(status_code=400, detail="Máximo 11 titulares")

    # En lugar de un UPDATE por jugador (hasta 15 round-trips secuenciales),
    # agrupamos por valor: como mucho 4 updates en bloque con .in_(), sin
    # importar el tamaño de la plantilla. Solo tocan filas ya existentes.
    titular_ids = [str(j.jugador_id) for j in body.jugadores if j.es_titular]
    no_titular_ids = [str(j.jugador_id) for j in body.jugadores if not j.es_titular]
    capitan_ids = [str(j.jugador_id) for j in body.jugadores if j.es_capitan]
    no_capitan_ids = [str(j.jugador_id) for j in body.jugadores if not j.es_capitan]

    def _bulk_update(campo: str, valor: bool, ids: list[str]) -> None:
        if not ids:
            return
        (
            supabase_admin.table("plantilla_fantasy")
            .update({campo: valor})
            .eq("miembro_id", miembro_id)
            .in_("jugador_id", ids)
            .execute()
        )

    _bulk_update("es_titular", True, titular_ids)
    _bulk_update("es_titular", False, no_titular_ids)
    _bulk_update("es_capitan", True, capitan_ids)
    _bulk_update("es_capitan", False, no_capitan_ids)

    return {"data": {"actualizado": True}}


# ---- Mercado ----

@router.get("/ligas/{liga_id}/mercado", response_model=ApiResponse[list[dict]])
def get_mercado(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    _verificar_miembro(str(liga_id), _uid(user))
    _verificar_mercado_activo()

    ids_ocupados = _jugadores_ocupados_en_liga(str(liga_id))

    q = supabase_admin.table("jugadores").select("*, equipo:equipos(nombre, abrev)").eq("activo", True).eq("estado_fantasy", "disponible")
    if ids_ocupados:
        q = q.not_.in_("id", ids_ocupados)
    result = q.order("precio_fantasy", desc=True).execute()
    return {"data": result.data}


# ---- Fichajes ----

@router.post("/ligas/{liga_id}/fichajes", response_model=ApiResponse[dict], status_code=201)
def fichar_jugador(
    liga_id: UUID, body: FicharJugadorIn, user: dict = Depends(get_current_user)
) -> dict:
    # Toda la operación (validaciones + insert + descuento de presupuesto) vive en
    # una RPC transaccional con lock sobre el miembro (migración 005): 1 round-trip
    # en lugar de ~8 y sin la condición de carrera del presupuesto (bug B4).
    try:
        res = supabase_admin.rpc("fichar_jugador", {
            "p_liga_id": str(liga_id),
            "p_usuario_id": _uid(user),
            "p_jugador_id": str(body.jugador_id),
        }).execute()
    except APIError as exc:
        raise _rpc_http_error(exc) from exc
    return {"data": res.data}


@router.delete("/ligas/{liga_id}/salir", response_model=ApiResponse[dict])
def salir_de_liga(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    uid = _uid(user)
    miembro = _verificar_miembro(str(liga_id), uid)

    # Borrar plantilla y luego la membresía (la FK en plantilla tiene ON DELETE CASCADE,
    # pero lo hacemos explícito por claridad)
    supabase_admin.table("plantilla_fantasy").delete().eq("miembro_id", miembro["id"]).execute()
    supabase_admin.table("miembros_liga_fantasy").delete().eq("id", miembro["id"]).execute()

    return {"data": {"salido": True}}


@router.delete("/ligas/{liga_id}/fichajes/{jugador_id}", response_model=ApiResponse[dict])
def vender_jugador(
    liga_id: UUID, jugador_id: UUID, user: dict = Depends(get_current_user)
) -> dict:
    # Borrado + devolución de presupuesto atómicos en una RPC (migración 005):
    # si algo falla no hay dinero gratis ni jugador perdido.
    try:
        res = supabase_admin.rpc("vender_jugador", {
            "p_liga_id": str(liga_id),
            "p_usuario_id": _uid(user),
            "p_jugador_id": str(jugador_id),
        }).execute()
    except APIError as exc:
        raise _rpc_http_error(exc) from exc
    return {"data": {"vendido": True, "precio": float(res.data or 0)}}


# ---- Helpers ----

def _jugadores_ocupados_en_liga(liga_id: str) -> list[str]:
    """IDs de jugadores ya fichados por cualquier miembro de la liga.

    La propiedad de un jugador es por-liga. La migración 003 desnormalizó
    `liga_id` en plantilla_fantasy (mantenido por trigger), así que basta una
    única consulta filtrando por liga en lugar de resolver miembros + plantillas.
    """
    plantillas_res = (
        supabase_admin.table("plantilla_fantasy")
        .select("jugador_id")
        .eq("liga_id", liga_id)
        .execute()
    )
    return [p["jugador_id"] for p in plantillas_res.data]


def _verificar_miembro(liga_id: str, uid: str) -> dict:
    miembro = _ms(
        supabase_admin.table("miembros_liga_fantasy")
        .select("*")
        .eq("liga_id", liga_id)
        .eq("usuario_id", uid)
        .maybe_single()
        .execute()
    )
    if not miembro:
        raise HTTPException(status_code=403, detail="No eres miembro de esta liga")
    return miembro


def _verificar_mercado_activo() -> None:
    jornada = _ms(
        supabase_admin.table("jornadas")
        .select("mercado_activo")
        .eq("estado", "en_curso")
        .maybe_single()
        .execute()
    )
    if jornada and not jornada["mercado_activo"]:
        raise HTTPException(status_code=403, detail="Mercado cerrado durante esta jornada")
