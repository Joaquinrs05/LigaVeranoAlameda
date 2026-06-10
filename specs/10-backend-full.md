# Backend — Arquitectura completa

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `10-backend-full` |
| **Status** | `done` |
| **Tipo** | Referencia de arquitectura — backend + BD |
| **Prioridad** | `alta` |
| **Dependencias** | `08-auth`, `09-backend` |

---

## Contexto

Este documento es la referencia de arquitectura completa antes de implementar el backend de negocio. La base técnica (FastAPI, CORS, auth JWT, health check) ya está en `backend/`. Lo que falta es todo el dominio: schema de BD, endpoints por router, flujo fantasy multi-liga, sistema de puntuaciones y fases de implementación.

---

## 1. Esquema de base de datos (Supabase PostgreSQL)

### 1.1 Tablas — Liga real

#### `equipos`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| nombre | text | "FC Alameda" |
| abrev | text | "FCA" — 3 chars |
| color | text | hex del equipo |
| created_at | timestamptz | `now()` |

#### `jugadores`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| equipo_id | uuid FK → equipos | |
| nombre | text | |
| dorsal | int | |
| posicion | text | `'portero' / 'defensa' / 'centrocampista' / 'delantero'` |
| precio_fantasy | numeric | valor en millones en el mercado |
| estado_fantasy | text | `'disponible' / 'lesionado' / 'sancionado'` |
| activo | bool | DEFAULT true — false si el jugador causa baja |

#### `jornadas`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| numero | int UNIQUE | número de jornada (1, 2, 3...) |
| fecha_inicio | date | |
| fecha_fin | date | |
| estado | text | `'pendiente' / 'en_curso' / 'finalizada'` |
| mercado_activo | bool | DEFAULT true — false durante días de partido |

> Solo una jornada puede tener `estado = 'en_curso'` a la vez (constraint de aplicación, no de BD).

#### `partidos`

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
| minuto | text | null salvo en `live` (ej. "72'", "HT") |

#### `estadisticas_jugador`

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
| puntos_fantasy | int | calculado al cerrar el partido (ver §4) |
| UNIQUE | (jugador_id, partido_id) | un registro por jugador por partido |

#### `cruces` (eliminatorias / torneo)

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| fase | text | `'cuartos' / 'semis' / 'final'` |
| equipo_local_id | uuid FK → equipos | nullable hasta que se asigne |
| equipo_visitante_id | uuid FK → equipos | nullable |
| goles_local | int | nullable |
| goles_visitante | int | nullable |
| estado | text | `'pendiente' / 'live' / 'finished'` |

> **Vista `clasificacion`** — no es tabla. Se calcula desde `partidos` con una SQL view (ver §7).

---

### 1.2 Tablas — Fantasy (multi-liga)

El diseño soporta múltiples ligas privadas. Un usuario puede estar en varias ligas simultáneamente con un equipo distinto en cada una.

#### `ligas_fantasy`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nombre | text | nombre que elige el creador |
| codigo_invitacion | text UNIQUE | 6 chars mayúsculas generado al crear (ej. `A3F9B2`) |
| creador_id | uuid FK → auth.users | quien creó la liga |
| jornada_inicio | int | número de jornada desde la que computa la liga |
| created_at | timestamptz | |

#### `miembros_liga_fantasy`

Tabla pivote que une usuario ↔ liga y contiene el estado del equipo de ese usuario en esa liga.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| liga_id | uuid FK → ligas_fantasy | |
| usuario_id | uuid FK → auth.users | |
| nombre_equipo | text | nombre del equipo en esta liga |
| presupuesto | numeric | DEFAULT 100.0 — millones disponibles |
| puntos_total | int | DEFAULT 0 — acumulado de puntuaciones_fantasy |
| joined_at | timestamptz | |
| UNIQUE | (liga_id, usuario_id) | un equipo por usuario por liga |

#### `plantilla_fantasy`

Jugadores que tiene el usuario en su equipo dentro de una liga concreta.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| miembro_id | uuid FK → miembros_liga_fantasy | |
| jugador_id | uuid FK → jugadores | |
| es_titular | bool | DEFAULT true |
| es_capitan | bool | DEFAULT false |
| precio_compra | numeric | precio en el momento de fichar |
| fichado_at | timestamptz | |

#### `puntuaciones_fantasy`

Puntos obtenidos por un miembro en una jornada concreta.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| miembro_id | uuid FK → miembros_liga_fantasy | |
| jornada_numero | int | |
| puntos | int | suma de puntos de los titulares esa jornada |
| calculado_at | timestamptz | |
| UNIQUE | (miembro_id, jornada_numero) | |

> **Vista `clasificacion_fantasy`** — no es tabla. Agrupa `puntuaciones_fantasy` por `liga_id` via join con `miembros_liga_fantasy`.

---

### 1.3 Tabla — Auth (ya existe)

#### `perfiles`

| Columna | Tipo | Notas |
|---|---|---|
| uid | uuid PK FK → auth.users | |
| nombre | text | |
| email | text | |
| foto_url | text | nullable |
| es_admin | bool | DEFAULT false — acceso a rutas `/admin/*` |
| created_at | timestamptz | |

---

### 1.4 RLS (Row Level Security)

| Tabla | SELECT | INSERT | UPDATE / DELETE |
|---|---|---|---|
| `equipos`, `jugadores`, `jornadas`, `partidos`, `cruces` | Público | service_role | service_role |
| `estadisticas_jugador` | Público | service_role | service_role |
| `ligas_fantasy` | Público (para buscar por código) | Auth | Solo creador o service_role |
| `miembros_liga_fantasy` | Miembros de la misma liga | Propio usuario | Solo propio usuario |
| `plantilla_fantasy` | Miembros de la misma liga | Solo propietario del miembro | Solo propietario |
| `puntuaciones_fantasy` | Miembros de la misma liga | service_role | service_role |
| `perfiles` | Propio usuario | service_role | Propio usuario |

---

## 2. Endpoints API

Todos responden con la misma envoltura:

```json
// Éxito
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": { "message": "...", "code": "..." } }
```

Códigos HTTP estándar: `400` validación, `401` no autenticado, `403` sin permiso, `404` no encontrado, `422` entidad no procesable, `500` error interno.

### 2.1 `routers/liga_real.py` — sin auth (lectura pública)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clasificacion` | Tabla de clasificación calculada desde `partidos` |
| GET | `/jornadas` | Lista de jornadas con estado |
| GET | `/jornadas/{numero}` | Jornada + sus partidos |
| GET | `/partidos` | Todos los partidos (`?jornada=12` filtra por jornada) |
| GET | `/partidos/{id}` | Partido + estadísticas por jugador |
| GET | `/equipos` | Todos los equipos con stats acumulados |
| GET | `/equipos/{id}` | Equipo + plantilla + estadísticas individuales |
| GET | `/jugadores` | Todos los jugadores activos (`?equipo=uuid` filtra) |

### 2.2 `routers/fantasy.py` — auth requerida

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/fantasy/ligas` | Mis ligas (todas en las que soy miembro) |
| POST | `/fantasy/ligas` | Crear liga `{ nombre }` → devuelve código de invitación |
| POST | `/fantasy/ligas/unirse` | Unirse con código `{ codigo, nombre_equipo }` |
| GET | `/fantasy/ligas/{liga_id}` | Detalle de liga: clasificación + jornada activa |
| GET | `/fantasy/ligas/{liga_id}/mi-equipo` | Mi plantilla en esta liga |
| PATCH | `/fantasy/ligas/{liga_id}/mi-equipo` | Cambiar titulares / capitán |
| GET | `/fantasy/ligas/{liga_id}/mercado` | Jugadores disponibles (no en mi plantilla) |
| POST | `/fantasy/ligas/{liga_id}/fichajes` | Fichar jugador `{ jugador_id }` |
| DELETE | `/fantasy/ligas/{liga_id}/fichajes/{jugador_id}` | Vender jugador |

**Reglas de negocio de fichajes:**
- El jugador no puede estar ya en la plantilla del mismo miembro
- `presupuesto >= precio_fantasy` del jugador
- `mercado_activo = true` en la jornada activa (cuando se defina la regla exacta)
- Máximo 15 jugadores en plantilla (11 titulares + 4 suplentes)

### 2.3 `routers/admin.py` — auth + `es_admin = true`

La dependencia `get_admin_user` encadena `get_current_user` y verifica `perfiles.es_admin`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/admin/jornadas` | Crear jornada |
| PATCH | `/admin/jornadas/{id}` | Actualizar estado / `mercado_activo` |
| POST | `/admin/partidos` | Crear partido |
| PATCH | `/admin/partidos/{id}` | Actualizar resultado, minuto, estado |
| PUT | `/admin/partidos/{id}/estadisticas` | Insertar / actualizar stats de jugadores del partido |
| POST | `/admin/jugadores` | Crear jugador |
| PATCH | `/admin/jugadores/{id}` | Actualizar precio, estado, activo |
| POST | `/admin/puntuaciones/calcular/{jornada_numero}` | Trigger de cálculo de puntos fantasy |

---

## 3. Flujo fantasy completo

```
Usuario sin liga
  → pantalla onboarding (ya implementada en Angular)
  ├── Crear liga
  │     POST /fantasy/ligas { nombre: "Mi Liga de Amigos" }
  │     ← { codigo: "A3F9B2", liga_id: "..." }
  │     → comparte el código con amigos
  └── Unirse a una liga
        POST /fantasy/ligas/unirse { codigo: "A3F9B2", nombre_equipo: "Los Cañoneros" }
        ← { liga_id: "...", miembro_id: "..." }

Usuario en liga → dashboard fantasy
  ├── GET /fantasy/ligas → lista de ligas del usuario
  ├── GET /fantasy/ligas/{id} → clasificación + jornada activa
  ├── GET /fantasy/ligas/{id}/mi-equipo → plantilla
  │     PATCH /fantasy/ligas/{id}/mi-equipo → cambiar titular / capitán
  └── GET /fantasy/ligas/{id}/mercado → jugadores disponibles
        POST /fantasy/ligas/{id}/fichajes { jugador_id } → fichar
        DELETE /fantasy/ligas/{id}/fichajes/{jugador_id} → vender

Admin tras cada jornada
  1. PATCH /admin/jornadas/{id}  → { estado: "en_curso" }
  2. PATCH /admin/partidos/{id}  → actualizar goles, minuto en tiempo real
  3. PUT   /admin/partidos/{id}/estadisticas → stats de cada jugador
  4. PATCH /admin/jornadas/{id}  → { estado: "finalizada" }
  5. POST  /admin/puntuaciones/calcular/{numero}
       → backend lee plantillas + estadisticas_jugador
       → aplica fórmula de puntuación
       → inserta en puntuaciones_fantasy
       → actualiza miembros_liga_fantasy.puntos_total
```

---

## 4. Sistema de puntuaciones fantasy

> **Estado: TBD — pendiente de validar con el usuario antes de implementar.**
> La fórmula siguiente es una propuesta. No se implementa hasta que haya acuerdo.

### Propuesta de fórmula

| Evento | DEL | MC | DEF | POR |
|---|---|---|---|---|
| Gol marcado | +6 | +8 | +10 | +12 |
| Asistencia | +3 | +3 | +3 | +3 |
| Portero a cero (≥60 min jugados) | — | — | +4 | +8 |
| Tarjeta amarilla | -1 | -1 | -1 | -1 |
| Tarjeta roja | -3 | -3 | -3 | -3 |
| ≥60 minutos jugados | +1 | +1 | +1 | +1 |
| Titular en alineación inicial | +1 | +1 | +1 | +1 |
| Capitán | × 2 sobre el total del jugador | — | — | — |

**Notas:**
- Solo puntúan los jugadores marcados como `es_titular = true` en la plantilla
- El capitán dobla sus puntos (se aplica al final del cálculo)
- Si un jugador está `lesionado` o `sancionado`, puntúa 0 automáticamente

### Pseudocódigo del cálculo

```python
def calcular_puntos_miembro(miembro_id, jornada_numero):
    titulares = plantilla_fantasy WHERE miembro_id AND es_titular
    total = 0
    for jugador in titulares:
        stats = estadisticas_jugador WHERE jugador_id AND partido.jornada_numero
        pts = formula(stats, jugador.posicion)
        if jugador.es_capitan:
            pts *= 2
        total += pts
    INSERT INTO puntuaciones_fantasy (miembro_id, jornada_numero, puntos, calculado_at)
    UPDATE miembros_liga_fantasy SET puntos_total += pts WHERE id = miembro_id
```

---

## 5. Ventanas de mercado

> **Estado: TBD — regla exacta por definir.**

El mecanismo ya está en el schema: `jornadas.mercado_activo bool`. Cuando es `false`, el endpoint `POST /fantasy/ligas/{id}/fichajes` responde `403` con mensaje `"Mercado cerrado durante esta jornada"`.

La regla operativa (qué días se cierra, cuánto tiempo antes del partido) se decide en una iteración posterior. Opciones barajadas:

- Cerrar automáticamente cuando `jornada.estado = 'en_curso'`
- Cerrar X horas antes del primer partido de la jornada (requiere cron job)
- El admin lo activa/desactiva manualmente con `PATCH /admin/jornadas/{id}`

La opción manual (admin) es la más simple para empezar.

---

## 6. Fases de implementación

| Fase | Contenido | Requisito |
|---|---|---|
| **1** | Crear todas las tablas en Supabase (SQL) + seed data de prueba | — |
| **2** | `routers/liga_real.py` — endpoints de lectura pública | Fase 1 |
| **3** | `routers/admin.py` — gestión de partidos, estadísticas, jugadores | Fase 2 |
| **4** | `routers/fantasy.py` — crear/unirse a liga, plantilla, mercado | Fase 1 + fórmula acordada |
| **5** | Cálculo de puntuaciones (`/admin/puntuaciones/calcular`) | Fases 3 + 4 + fórmula acordada |
| **6** | Frontend Angular — reemplazar mocks por HTTP calls + `AuthInterceptor` | Todas las anteriores |
| **7** | Panel admin Angular (`/admin`) — módulo protegido por `es_admin` | Fase 3 |

---

## 7. SQL útil — vistas y helpers

### Vista `clasificacion`

```sql
CREATE OR REPLACE VIEW clasificacion AS
SELECT
  e.id AS equipo_id,
  e.nombre,
  e.abrev,
  e.color,
  COUNT(p.id) AS pj,
  SUM(CASE
    WHEN p.estado = 'finished' AND p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante THEN 1
    WHEN p.estado = 'finished' AND p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local THEN 1
    ELSE 0 END) AS pg,
  SUM(CASE
    WHEN p.estado = 'finished' AND p.goles_local = p.goles_visitante THEN 1
    ELSE 0 END) AS pe,
  SUM(CASE
    WHEN p.estado = 'finished' AND p.equipo_local_id = e.id AND p.goles_local < p.goles_visitante THEN 1
    WHEN p.estado = 'finished' AND p.equipo_visitante_id = e.id AND p.goles_visitante < p.goles_local THEN 1
    ELSE 0 END) AS pp,
  SUM(CASE WHEN p.equipo_local_id = e.id THEN COALESCE(p.goles_local, 0)
           WHEN p.equipo_visitante_id = e.id THEN COALESCE(p.goles_visitante, 0)
           ELSE 0 END) AS gf,
  SUM(CASE WHEN p.equipo_local_id = e.id THEN COALESCE(p.goles_visitante, 0)
           WHEN p.equipo_visitante_id = e.id THEN COALESCE(p.goles_local, 0)
           ELSE 0 END) AS gc,
  (
    SUM(CASE WHEN p.estado = 'finished' AND p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante THEN 3
             WHEN p.estado = 'finished' AND p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local THEN 3
             WHEN p.estado = 'finished' AND p.goles_local = p.goles_visitante THEN 1
             ELSE 0 END)
  ) AS puntos
FROM equipos e
LEFT JOIN partidos p ON e.id = p.equipo_local_id OR e.id = p.equipo_visitante_id
GROUP BY e.id, e.nombre, e.abrev, e.color
ORDER BY puntos DESC, (gf - gc) DESC, gf DESC;
```

### Generación de código de invitación (Python)

```python
import secrets

def generar_codigo() -> str:
    return secrets.token_hex(3).upper()  # → "A3F9B2"
```

---

## 8. Notas técnicas

- **Cliente Supabase en endpoints admin:** usar `supabase_admin` (service role) para saltarse RLS en escrituras administrativas.
- **Cliente Supabase en endpoints de usuario:** usar `supabase` (anon key) para que RLS se aplique automáticamente. Pasar el JWT del usuario con `supabase.auth.set_session(token)` si se necesita contexto de usuario en RLS.
- **`puntuaciones_fantasy` solo lo escribe el backend** (service role) — nunca el cliente Angular directamente.
- **Columna `es_admin` en `perfiles`:** se activa manualmente desde Supabase dashboard para los organizadores. No hay endpoint de self-promotion.
- **Tiempo real (futuro):** Supabase Realtime puede emitir cambios de `partidos` vía websocket — el frontend Angular se suscribe con el SDK de Supabase directamente, sin pasar por el backend FastAPI. Esto es suficiente para el marcador en directo sin complejidad extra.
