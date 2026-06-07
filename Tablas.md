# Tablas Supabase — Liga Verano Alameda

## Ya creadas

| Tabla | Estado |
|---|---|
| `perfiles` | ✓ creada |

---

## Web informativa

### `equipos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nombre | text | "Atlético Alameda" |
| abrev | text | "ALA" |
| color | text | hex del equipo |
| created_at | timestamptz | |

### `jugadores`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| equipo_id | uuid FK → equipos | |
| nombre | text | |
| dorsal | int | |
| posicion | text | 'POR' / 'DEF' / 'MC' / 'DEL' |
| precio_fantasy | numeric | valor en el mercado |
| estado_fantasy | text | 'disponible' / 'lesionado' / 'sancionado' |

### `jornadas`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| numero | int | |
| fecha_inicio | date | |
| fecha_fin | date | |
| activa | bool | solo una activa a la vez |

### `partidos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| jornada_id | uuid FK → jornadas | |
| equipo_local_id | uuid FK → equipos | |
| equipo_visitante_id | uuid FK → equipos | |
| goles_local | int | null si no ha empezado |
| goles_visitante | int | null si no ha empezado |
| estado | text | 'upcoming' / 'live' / 'finished' |
| hora_inicio | timestamptz | |
| minuto | text | null salvo en live |

### `estadisticas_jugador`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| jugador_id | uuid FK → jugadores | |
| partido_id | uuid FK → partidos | |
| goles | int | default 0 |
| asistencias | int | default 0 |
| puntos_fantasy | int | calculado al cerrar partido |

> La **clasificación** no necesita tabla — es una vista calculada desde `partidos`.

---

## Torneo (eliminatorias)

### `cruces`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| fase | text | 'cuartos' / 'semis' / 'final' |
| equipo_local_id | uuid FK → equipos | nullable hasta que se asigne |
| equipo_visitante_id | uuid FK → equipos | nullable |
| goles_local | int | nullable |
| goles_visitante | int | nullable |
| estado | text | 'pendiente' / 'live' / 'finished' |

---

## Fantasy

### `equipos_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| usuario_id | uuid FK → auth.users | único por usuario |
| nombre | text | nombre del equipo |
| presupuesto | numeric | saldo restante |
| puntuacion_total | int | acumulado |

### `plantilla_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| equipo_fantasy_id | uuid FK → equipos_fantasy | |
| jugador_id | uuid FK → jugadores | |
| es_titular | bool | |
| es_capitan | bool | default false |

### `puntuaciones_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| equipo_fantasy_id | uuid FK → equipos_fantasy | |
| jornada_id | uuid FK → jornadas | |
| puntos | int | |

> La **clasificación fantasy** no necesita tabla — es una vista que agrupa `puntuaciones_fantasy`.
