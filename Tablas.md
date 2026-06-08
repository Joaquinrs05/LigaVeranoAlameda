# Tablas Supabase — Liga Verano Alameda

> Referencia rápida del schema. El documento completo con RLS, endpoints y flujos está en `specs/10-backend-full.md`.

## Estado

| Tabla | Estado |
|---|---|
| `perfiles` | ✓ creada |
| resto | pendiente — Fase 1 de implementación |

---

## Web informativa

### `equipos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| nombre | text | "FC Alameda" |
| abrev | text | "FCA" — 3 chars |
| color | text | hex del equipo |
| created_at | timestamptz | |

### `jugadores`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| equipo_id | uuid FK → equipos | |
| nombre | text | |
| dorsal | int | |
| posicion | text | `'portero' / 'defensa' / 'centrocampista' / 'delantero'` |
| precio_fantasy | numeric | valor en millones en el mercado |
| estado_fantasy | text | `'disponible' / 'lesionado' / 'sancionado'` |
| activo | bool | DEFAULT true |

### `jornadas`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| numero | int UNIQUE | número de jornada |
| fecha_inicio | date | |
| fecha_fin | date | |
| estado | text | `'pendiente' / 'en_curso' / 'finalizada'` |
| mercado_activo | bool | DEFAULT true — false durante días de partido |

### `partidos`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| jornada_id | uuid FK → jornadas | |
| equipo_local_id | uuid FK → equipos | |
| equipo_visitante_id | uuid FK → equipos | |
| goles_local | int | null hasta que empieza |
| goles_visitante | int | null hasta que empieza |
| estado | text | `'upcoming' / 'live' / 'finished'` |
| hora_inicio | timestamptz | |
| minuto | text | null salvo en `live` |

### `estadisticas_jugador`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| jugador_id | uuid FK → jugadores | |
| partido_id | uuid FK → partidos | |
| goles | int | DEFAULT 0 |
| asistencias | int | DEFAULT 0 |
| tarjeta_amarilla | bool | DEFAULT false |
| tarjeta_roja | bool | DEFAULT false |
| minutos_jugados | int | DEFAULT 0 |
| portero_sin_goles | bool | DEFAULT false — clean sheet ≥60 min |
| puntos_fantasy | int | calculado al cerrar el partido |
| UNIQUE | (jugador_id, partido_id) | |

> La **clasificación** no tiene tabla — es una vista SQL calculada desde `partidos` (ver `specs/10-backend-full.md` §7).

### `cruces` (eliminatorias)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| fase | text | `'cuartos' / 'semis' / 'final'` |
| equipo_local_id | uuid FK → equipos | nullable |
| equipo_visitante_id | uuid FK → equipos | nullable |
| goles_local | int | nullable |
| goles_visitante | int | nullable |
| estado | text | `'pendiente' / 'live' / 'finished'` |

---

## Fantasy (multi-liga)

> Diseño para múltiples ligas privadas. Un usuario puede estar en varias ligas con un equipo distinto en cada una.

### `ligas_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nombre | text | nombre elegido por el creador |
| codigo_invitacion | text UNIQUE | 6 chars mayúsculas, generado al crear (ej. `A3F9B2`) |
| creador_id | uuid FK → auth.users | |
| jornada_inicio | int | jornada desde la que computa |
| created_at | timestamptz | |

### `miembros_liga_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| liga_id | uuid FK → ligas_fantasy | |
| usuario_id | uuid FK → auth.users | |
| nombre_equipo | text | nombre del equipo en esta liga |
| presupuesto | numeric | DEFAULT 100.0 — millones disponibles |
| puntos_total | int | DEFAULT 0 — acumulado |
| joined_at | timestamptz | |
| UNIQUE | (liga_id, usuario_id) | un equipo por usuario por liga |

### `plantilla_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| miembro_id | uuid FK → miembros_liga_fantasy | |
| jugador_id | uuid FK → jugadores | |
| es_titular | bool | DEFAULT true |
| es_capitan | bool | DEFAULT false |
| precio_compra | numeric | precio en el momento de fichar |
| fichado_at | timestamptz | |

### `puntuaciones_fantasy`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| miembro_id | uuid FK → miembros_liga_fantasy | |
| jornada_numero | int | |
| puntos | int | suma de titulares esa jornada |
| calculado_at | timestamptz | |
| UNIQUE | (miembro_id, jornada_numero) | |

> La **clasificación fantasy** no tiene tabla — es una vista que agrupa `puntuaciones_fantasy` por liga.

---

## Auth

### `perfiles` ✓ creada
| Columna | Tipo | Notas |
|---|---|---|
| uid | uuid PK FK → auth.users | |
| nombre | text | |
| email | text | |
| foto_url | text | nullable |
| es_admin | bool | DEFAULT false — acceso a rutas `/admin/*` |
| created_at | timestamptz | |
