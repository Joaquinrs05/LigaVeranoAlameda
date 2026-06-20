
#FIXME EN UN FUTURO CAMBIAR SI HACE  FALTA LOS PUTNOS Y LAS COSAS
_GOL_PTS = 2
_VICTORIA_PTS = 3
_EMPATE_PTS = 1
_AMARILLA_PTS = -1
_ROJA_PTS = -2
_PORTERIA_CERO_DEF = 2
_PORTERIA_CERO_ATK = 1


def calcular_puntos_jugador(
    posicion: str,
    goles: int,
    tarjeta_amarilla: bool,
    tarjeta_roja: bool,
    equipo_gana: bool,
    equipo_empata: bool,
    porteria_cero: bool,
) -> int:
    pts = goles * _GOL_PTS
    if equipo_gana:
        pts += _VICTORIA_PTS
    elif equipo_empata:
        pts += _EMPATE_PTS
    if porteria_cero and not equipo_empata:
        if posicion in ("portero", "defensa"):
            pts += _PORTERIA_CERO_DEF
        else:
            pts += _PORTERIA_CERO_ATK
    if tarjeta_amarilla:
        pts += _AMARILLA_PTS
    if tarjeta_roja:
        pts += _ROJA_PTS
    return pts
