import hashlib
import time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.config import settings
from app.database import supabase_admin
from app.schemas.common import ApiResponse
from app.schemas.equipo_admin import ActualizarJugadorEntrenadorIn

router = APIRouter(prefix="/equipo-admin", tags=["equipo-admin"])


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
        .select("id, nombre, dorsal, posicion, foto_url, activo")
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


@router.get("/upload-signature", response_model=ApiResponse[dict])
def generar_firma_upload(_equipo: dict = Depends(get_equipo_entrenador)) -> dict:
    timestamp = int(time.time())
    folder = "jugadores"
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
