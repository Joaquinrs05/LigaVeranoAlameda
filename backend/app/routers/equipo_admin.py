import hashlib
import time
from typing import cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.config import settings
from app.database import supabase_admin
from app.schemas.common import ApiResponse
from fastapi import Query
from app.schemas.equipo_admin import ActualizarEquipoEntrenadorIn, ActualizarJugadorEntrenadorIn

router = APIRouter(prefix="/equipo-admin", tags=["equipo-admin"])


def _is_superadmin(uid: str) -> bool:
    res = (
        supabase_admin.table("perfiles")
        .select("is_superadmin")
        .eq("id", uid)
        .maybe_single()
        .execute()
    )
    if res is None or not isinstance(res.data, dict):
        return False
    return bool(res.data.get("is_superadmin"))


def get_equipo_entrenador(user: dict = Depends(get_current_user)) -> dict:
    uid = user.get("sub", "")
    result = (
        supabase_admin.table("equipos")
        .select("*")
        .eq("entrenador_id", uid)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="No eres entrenador de ningún equipo")
    return result.data


@router.get("/mi-equipo", response_model=ApiResponse[dict])
def get_mi_equipo(equipo: dict = Depends(get_equipo_entrenador)) -> dict:
    return {"data": equipo}


@router.get("/mi-equipo/jugadores", response_model=ApiResponse[list[dict]])
def get_jugadores(equipo: dict = Depends(get_equipo_entrenador)) -> dict:
    result = (
        supabase_admin.table("jugadores")
        .select("id, nombre, dorsal, posicion, foto_url, activo, es_titular")
        .eq("equipo_id", equipo["id"])
        .eq("activo", True)
        .execute()
    )
    return {"data": result.data or []}


@router.patch("/jugadores/{jugador_id}", response_model=ApiResponse[dict])
def actualizar_jugador(
    jugador_id: UUID,
    body: ActualizarJugadorEntrenadorIn,
    equipo: dict = Depends(get_equipo_entrenador),
) -> dict:
    check = (
        supabase_admin.table("jugadores")
        .select("equipo_id")
        .eq("id", str(jugador_id))
        .maybe_single()
        .execute()
    )
    if not check.data or check.data["equipo_id"] != equipo["id"]:
        raise HTTPException(status_code=403, detail="Este jugador no pertenece a tu equipo")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No hay cambios que aplicar")

    result = (
        supabase_admin.table("jugadores")
        .update(updates)
        .eq("id", str(jugador_id))
        .execute()
    )
    return {"data": result.data[0] if result.data else None}


def get_equipo_por_id_con_acceso(equipo_id: UUID, user: dict = Depends(get_current_user)) -> dict:
    uid = user.get("sub", "")
    equipo_res = (
        supabase_admin.table("equipos")
        .select("*")
        .eq("id", str(equipo_id))
        .maybe_single()
        .execute()
    )
    if equipo_res is None or not equipo_res.data:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    equipo = cast(dict, equipo_res.data)
    if _is_superadmin(uid) or equipo.get("entrenador_id") == uid:
        return equipo
    raise HTTPException(status_code=403, detail="Sin acceso a este equipo")


@router.get("/equipo/{equipo_id}", response_model=ApiResponse[dict])
def get_equipo_admin(equipo: dict = Depends(get_equipo_por_id_con_acceso)) -> dict:
    return {"data": equipo}


@router.get("/equipo/{equipo_id}/jugadores", response_model=ApiResponse[list[dict]])
def get_jugadores_admin(equipo: dict = Depends(get_equipo_por_id_con_acceso)) -> dict:
    result = (
        supabase_admin.table("jugadores")
        .select("id, nombre, dorsal, posicion, foto_url, activo, es_titular")
        .eq("equipo_id", equipo["id"])
        .eq("activo", True)
        .execute()
    )
    return {"data": result.data or []}


@router.patch("/equipo/{equipo_id}/jugadores/{jugador_id}", response_model=ApiResponse[dict])
def actualizar_jugador_admin(
    jugador_id: UUID,
    body: ActualizarJugadorEntrenadorIn,
    equipo: dict = Depends(get_equipo_por_id_con_acceso),
) -> dict:
    check = (
        supabase_admin.table("jugadores")
        .select("equipo_id")
        .eq("id", str(jugador_id))
        .maybe_single()
        .execute()
    )
    if not check.data or check.data["equipo_id"] != equipo["id"]:
        raise HTTPException(status_code=403, detail="Este jugador no pertenece a este equipo")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No hay cambios que aplicar")
    result = (
        supabase_admin.table("jugadores")
        .update(updates)
        .eq("id", str(jugador_id))
        .execute()
    )
    return {"data": result.data[0] if result.data else None}


@router.get("/equipo/{equipo_id}/upload-signature", response_model=ApiResponse[dict])
def generar_firma_upload_admin(
    _equipo: dict = Depends(get_equipo_por_id_con_acceso),
    folder: str = Query(default="jugadores"),
) -> dict:
    timestamp = int(time.time())
    params_to_sign = f"folder={folder}&timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(params_to_sign.encode()).hexdigest()
    return {
        "data": {
            "signature": signature,
            "timestamp": timestamp,
            "cloud_name": settings.cloudinary_cloud_name,
            "api_key": settings.cloudinary_api_key,
            "folder": folder,
        }
    }


@router.patch("/mi-equipo", response_model=ApiResponse[dict])
def actualizar_mi_equipo(
    body: ActualizarEquipoEntrenadorIn,
    equipo: dict = Depends(get_equipo_entrenador),
) -> dict:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Sin cambios")
    result = (
        supabase_admin.table("equipos")
        .update(updates)
        .eq("id", equipo["id"])
        .execute()
    )
    data = result.data[0] if result.data else None  # type: ignore[index]
    return {"data": data}


@router.patch("/equipo/{equipo_id}", response_model=ApiResponse[dict])
def actualizar_equipo_admin(
    body: ActualizarEquipoEntrenadorIn,
    equipo: dict = Depends(get_equipo_por_id_con_acceso),
) -> dict:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Sin cambios")
    result = (
        supabase_admin.table("equipos")
        .update(updates)
        .eq("id", equipo["id"])
        .execute()
    )
    data = result.data[0] if result.data else None  # type: ignore[index]
    return {"data": data}


@router.get("/upload-signature", response_model=ApiResponse[dict])
def generar_firma_upload(
    _equipo: dict = Depends(get_equipo_entrenador),
    folder: str = Query(default="jugadores"),
) -> dict:
    timestamp = int(time.time())
    params_to_sign = f"folder={folder}&timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(params_to_sign.encode()).hexdigest()
    return {
        "data": {
            "signature": signature,
            "timestamp": timestamp,
            "cloud_name": settings.cloudinary_cloud_name,
            "api_key": settings.cloudinary_api_key,
            "folder": folder,
        }
    }
