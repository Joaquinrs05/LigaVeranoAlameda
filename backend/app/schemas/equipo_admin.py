from __future__ import annotations

from pydantic import BaseModel, Field


class ActualizarJugadorEntrenadorIn(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=60)
    dorsal: int | None = None
    posicion: str | None = None
    foto_url: str | None = None
    es_titular: bool | None = None


class ActualizarEquipoEntrenadorIn(BaseModel):
    foto_url: str | None = None
