from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CrearJornadaIn(BaseModel):
    numero: int = Field(ge=1)
    fecha_inicio: date
    fecha_fin: date


class ActualizarJornadaIn(BaseModel):
    estado: str | None = None
    mercado_activo: bool | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None


class CrearPartidoIn(BaseModel):
    jornada_id: UUID
    equipo_local_id: UUID
    equipo_visitante_id: UUID
    hora_inicio: datetime


class ActualizarPartidoIn(BaseModel):
    goles_local: int | None = None
    goles_visitante: int | None = None
    estado: str | None = None
    minuto: str | None = None
    hora_inicio: datetime | None = None


class EstadisticaJugadorIn(BaseModel):
    jugador_id: UUID
    goles: int = Field(ge=0, default=0)
    asistencias: int = Field(ge=0, default=0)
    tarjeta_amarilla: bool = False
    tarjeta_roja: bool = False
    minutos_jugados: int = Field(ge=0, default=0)
    portero_sin_goles: bool = False


class PutEstadisticasIn(BaseModel):
    estadisticas: list[EstadisticaJugadorIn]


class CrearJugadorIn(BaseModel):
    equipo_id: UUID
    nombre: str = Field(min_length=2, max_length=60)
    dorsal: int | None = None
    posicion: str
    precio_fantasy: float = Field(ge=0.5, default=5.0)


class ActualizarJugadorIn(BaseModel):
    nombre: str | None = None
    dorsal: int | None = None
    posicion: str | None = None
    precio_fantasy: float | None = None
    estado_fantasy: str | None = None
    activo: bool | None = None


class CrearEquipoIn(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    escudo_url: str | None = None
    entrenador_id: UUID | None = None


class ActualizarEquipoIn(BaseModel):
    nombre: str | None = None
    escudo_url: str | None = None
    entrenador_id: UUID | None = None
