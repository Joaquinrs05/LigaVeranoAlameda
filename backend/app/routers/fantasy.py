import secrets
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

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

MAX_JUGADORES_PLANTILLA = 15
MAX_TITULARES_POR_POSICION: dict[str, int] = {
    "portero": 1, "defensa": 2, "centrocampista": 2, "delantero": 2,
}


def _uid(user: dict) -> str:
    return user.get("sub", "")


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
    return {"data": {**liga, "clasificacion": clasificacion.data}}


# ---- Mi equipo ----

@router.get("/ligas/{liga_id}/mi-miembro", response_model=ApiResponse[MiembroOut])
def get_mi_miembro(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    return {"data": miembro}


@router.get("/ligas/{liga_id}/mi-equipo", response_model=ApiResponse[list[PlantillaItemOut]])
def get_mi_equipo(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    plantilla = (
        supabase_admin.table("plantilla_fantasy")
        .select("*, jugador:jugadores(id, nombre, dorsal, posicion, precio_fantasy, estado_fantasy, activo, equipo:equipos(nombre, abrev))")
        .eq("miembro_id", miembro["id"])
        .execute()
    )
    return {"data": plantilla.data}


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

    for item in body.jugadores:
        supabase_admin.table("plantilla_fantasy").update({
            "es_titular": item.es_titular,
            "es_capitan": item.es_capitan,
        }).eq("miembro_id", miembro_id).eq("jugador_id", str(item.jugador_id)).execute()

    return {"data": {"actualizado": True}}


# ---- Mercado ----

@router.get("/ligas/{liga_id}/mercado", response_model=ApiResponse[list[dict]])
def get_mercado(liga_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))

    _verificar_mercado_activo()

    plantilla_res = (
        supabase_admin.table("plantilla_fantasy")
        .select("jugador_id")
        .eq("miembro_id", miembro["id"])
        .execute()
    )
    ids_en_plantilla = [p["jugador_id"] for p in plantilla_res.data]

    q = supabase_admin.table("jugadores").select("*, equipo:equipos(nombre, abrev)").eq("activo", True).eq("estado_fantasy", "disponible")
    if ids_en_plantilla:
        q = q.not_.in_("id", ids_en_plantilla)
    result = q.order("precio_fantasy", desc=True).execute()
    return {"data": result.data}


# ---- Fichajes ----

@router.post("/ligas/{liga_id}/fichajes", response_model=ApiResponse[dict], status_code=201)
def fichar_jugador(
    liga_id: UUID, body: FicharJugadorIn, user: dict = Depends(get_current_user)
) -> dict:
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    _verificar_mercado_activo()

    jugador = _ms(
        supabase_admin.table("jugadores")
        .select("id, posicion, precio_fantasy, estado_fantasy, activo")
        .eq("id", str(body.jugador_id))
        .maybe_single()
        .execute()
    )
    if not jugador:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    if not jugador["activo"] or jugador["estado_fantasy"] != "disponible":
        raise HTTPException(status_code=400, detail="Jugador no disponible en el mercado")
    if float(jugador["precio_fantasy"]) > float(miembro["presupuesto"]):
        raise HTTPException(status_code=400, detail="Presupuesto insuficiente")

    count_res = (
        supabase_admin.table("plantilla_fantasy")
        .select("id", count="exact")
        .eq("miembro_id", miembro["id"])
        .execute()
    )
    if (count_res.count or 0) >= MAX_JUGADORES_PLANTILLA:
        raise HTTPException(
            status_code=400, detail=f"Plantilla llena (máximo {MAX_JUGADORES_PLANTILLA} jugadores)"
        )

    ya_fichado = _ms(
        supabase_admin.table("plantilla_fantasy")
        .select("id")
        .eq("miembro_id", miembro["id"])
        .eq("jugador_id", str(body.jugador_id))
        .maybe_single()
        .execute()
    )
    if ya_fichado:
        raise HTTPException(status_code=409, detail="El jugador ya está en tu plantilla")

    # Titular si no hay ningún titular de esa posición todavía; reserva si ya hay uno
    titulares_posicion_res = (
        supabase_admin.table("plantilla_fantasy")
        .select("jugador:jugadores(posicion)")
        .eq("miembro_id", miembro["id"])
        .eq("es_titular", True)
        .execute()
    )
    titulares_posicion = sum(
        1 for item in titulares_posicion_res.data
        if item.get("jugador") and item["jugador"].get("posicion") == jugador["posicion"]
    )
    es_titular = titulares_posicion < MAX_TITULARES_POR_POSICION.get(jugador["posicion"], 1)

    nuevo_presupuesto = float(miembro["presupuesto"]) - float(jugador["precio_fantasy"])
    supabase_admin.table("miembros_liga_fantasy").update(
        {"presupuesto": nuevo_presupuesto}
    ).eq("id", miembro["id"]).execute()

    result = supabase_admin.table("plantilla_fantasy").insert({
        "miembro_id": miembro["id"],
        "jugador_id": str(body.jugador_id),
        "precio_compra": jugador["precio_fantasy"],
        "es_titular": es_titular,
    }).execute()
    return {"data": result.data[0] if result.data else None}


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
    miembro = _verificar_miembro(str(liga_id), _uid(user))
    _verificar_mercado_activo()

    item = _ms(
        supabase_admin.table("plantilla_fantasy")
        .select("id, precio_compra")
        .eq("miembro_id", miembro["id"])
        .eq("jugador_id", str(jugador_id))
        .maybe_single()
        .execute()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Jugador no está en tu plantilla")

    precio_venta = float(item["precio_compra"])
    nuevo_presupuesto = float(miembro["presupuesto"]) + precio_venta
    supabase_admin.table("miembros_liga_fantasy").update(
        {"presupuesto": nuevo_presupuesto}
    ).eq("id", miembro["id"]).execute()

    supabase_admin.table("plantilla_fantasy").delete().eq("id", item["id"]).execute()
    return {"data": {"vendido": True, "precio": precio_venta}}


# ---- Helpers ----

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
