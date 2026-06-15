from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class EquipoOut(BaseModel):
    id: UUID
    nombre: str
    abrev: str
    color: str
    foto_url: str | None = None
    created_at: datetime


class JugadorOut(BaseModel):
    id: UUID
    equipo_id: UUID
    nombre: str
    dorsal: int | None = None
    posicion: str
    precio_fantasy: Decimal
    estado_fantasy: str
    activo: bool
    es_titular: bool = False
    foto_url: str | None = None


class JornadaOut(BaseModel):
    id: UUID
    numero: int
    fecha_inicio: date
    fecha_fin: date
    estado: str
    mercado_activo: bool


class PartidoOut(BaseModel):
    id: UUID
    jornada_id: UUID
    equipo_local_id: UUID
    equipo_visitante_id: UUID
    equipo_local: EquipoOut | None = None
    equipo_visitante: EquipoOut | None = None
    goles_local: int | None = None
    goles_visitante: int | None = None
    estado: str
    hora_inicio: datetime
    minuto: str | None = None


class EstadisticaOut(BaseModel):
    id: UUID
    jugador_id: UUID
    partido_id: UUID
    jugador: JugadorOut | None = None
    goles: int
    asistencias: int
    tarjeta_amarilla: bool
    tarjeta_roja: bool
    minutos_jugados: int
    portero_sin_goles: bool
    puntos_fantasy: int


class JornadaConPartidosOut(BaseModel):
    id: UUID
    numero: int
    fecha_inicio: date
    fecha_fin: date
    estado: str
    mercado_activo: bool
    partidos: list[PartidoOut] = []


class PartidoConEstadisticasOut(BaseModel):
    id: UUID
    jornada_id: UUID
    equipo_local_id: UUID
    equipo_visitante_id: UUID
    equipo_local: EquipoOut | None = None
    equipo_visitante: EquipoOut | None = None
    goles_local: int | None = None
    goles_visitante: int | None = None
    estado: str
    hora_inicio: datetime
    minuto: str | None = None
    estadisticas: list[EstadisticaOut] = []


class EquipoConStatsOut(BaseModel):
    id: UUID
    nombre: str
    abrev: str
    color: str
    foto_url: str | None = None
    jugadores: list[JugadorOut] = []


class ClasificacionRow(BaseModel):
    equipo_id: UUID
    nombre: str
    abrev: str
    color: str
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    puntos: int
