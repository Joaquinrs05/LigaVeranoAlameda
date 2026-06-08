
#FIXME EN UN FUTURO CAMBIAR SI HACE  FALTA LOS PUTNOS Y LAS COSAS 
_GOL_PTS: dict[str, int] = {
    "delantero": 6,
    "centrocampista": 8,
    "defensa": 10,
    "portero": 12,
}


def calcular_puntos_jugador(
    posicion: str,
    goles: int,
    asistencias: int,
    tarjeta_amarilla: bool,
    tarjeta_roja: bool,
    minutos_jugados: int,
    portero_sin_goles: bool,
) -> int:
    pts = goles * _GOL_PTS.get(posicion, 6)
    pts += asistencias * 3
    if posicion == "portero" and portero_sin_goles:
        pts += 8
    elif posicion == "defensa" and portero_sin_goles:
        pts += 4
    if tarjeta_amarilla:
        pts -= 1
    if tarjeta_roja:
        pts -= 3
    if minutos_jugados >= 60:
        pts += 1
    if minutos_jugados > 0:
        pts += 1
    return pts
