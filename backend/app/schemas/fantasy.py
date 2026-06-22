from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class EquipoResumenOut(BaseModel):
    nombre: str
    abrev: str


class JugadorPlantillaOut(BaseModel):
    """Jugador tal como llega en el join anidado de plantilla_fantasy."""
    id: UUID
    nombre: str
    dorsal: int | None = None
    posicion: str
    precio_fantasy: Decimal
    estado_fantasy: str
    activo: bool
    foto_url: str | None = None
    equipo: EquipoResumenOut | None = None


class LigaFantasyOut(BaseModel):
    id: UUID
    nombre: str
    codigo_invitacion: str
    creador_id: UUID
    jornada_inicio: int
    created_at: datetime


class MiembroOut(BaseModel):
    id: UUID
    liga_id: UUID
    usuario_id: UUID
    nombre_equipo: str
    presupuesto: Decimal
    puntos_total: int
    joined_at: datetime


class ClasificacionFantasyRow(BaseModel):
    liga_id: UUID
    miembro_id: UUID
    usuario_id: UUID
    nombre_equipo: str
    puntos_total: int
    presupuesto: Decimal
    posicion: int


class LigaDetalleOut(BaseModel):
    id: UUID
    nombre: str
    codigo_invitacion: str
    creador_id: UUID
    jornada_inicio: int
    clasificacion: list[ClasificacionFantasyRow] = []
    mercado_activo: bool = False


class PlantillaItemOut(BaseModel):
    id: UUID
    miembro_id: UUID
    jugador_id: UUID
    jugador: JugadorPlantillaOut | None = None
    es_titular: bool
    es_capitan: bool
    precio_compra: Decimal
    clausula: Decimal = Decimal(0)
    fichado_at: datetime
    puntos_total: int = 0
    precio_venta: Decimal | None = None


# ---- Requests ----

class CrearLigaIn(BaseModel):
    nombre: str = Field(min_length=3, max_length=60)
    nombre_equipo: str = Field(min_length=2, max_length=40)


class UnirseALigaIn(BaseModel):
    codigo: str = Field(min_length=6, max_length=6)
    nombre_equipo: str = Field(min_length=2, max_length=40)


class ActualizarPlantillaItemIn(BaseModel):
    jugador_id: UUID
    es_titular: bool
    es_capitan: bool


class ActualizarPlantillaIn(BaseModel):
    jugadores: list[ActualizarPlantillaItemIn]


class FicharJugadorIn(BaseModel):
    jugador_id: UUID


class SubirClausulaIn(BaseModel):
    clausula: Decimal = Field(gt=Decimal(0))


class ClausulazoIn(BaseModel):
    jugador_id: UUID


class ListarJugadorIn(BaseModel):
    jugador_id: UUID
    precio: Decimal = Field(gt=Decimal(0))
