# Verificación de BUGS.md — 2026-06-16

Revisión del código actual contra cada punto de [BUGS.md](BUGS.md) (auditoría original 2026-06-11).
Para cada bug se ha leído el fichero y las líneas referenciadas.

Estados:
- ❌ **SIGUE** — el fallo persiste igual.
- 🟡 **PARCIAL** — algo se ha mitigado, pero el problema de fondo sigue.
- ✅ **CORREGIDO** — ya no ocurre.

---

## BACKEND

| ID | Resumen | Estado | Comprobación |
|----|---------|--------|--------------|
| B1 | Recalcular jornada duplica puntos | ❌ SIGUE | [admin.py:327](backend/app/routers/admin.py#L327) sigue haciendo `nuevo_total = puntos_total + total` (acumulación incremental, no idempotente). |
| B2 | `get_admin_user` 500 en vez de 403 | ❌ SIGUE | [auth.py:43-50](backend/app/auth.py#L43-L50) accede a `result.data` tras `maybe_single()` sin el guard `_ms` (si devuelve `None` → `AttributeError` → 500). |
| B3 | Estado de mercado incoherente sin jornada en curso | ❌ SIGUE | `_verificar_mercado_activo` ([fantasy.py:343-352](backend/app/routers/fantasy.py#L343-L352)) deja abierto si no hay jornada; `get_liga` ([fantasy.py:143](backend/app/routers/fantasy.py#L143)) devuelve `false`. Sin cambios. |
| B4 | Carreras en presupuesto (no atómico) | ❌ SIGUE | Fichar/vender ([fantasy.py:272-283, 317-324](backend/app/routers/fantasy.py#L272-L283)) siguen leyendo-validando-escribiendo sin transacción ni update condicional. |
| B5 | Colisión de código de invitación → 500 | ❌ SIGUE | [fantasy.py:57](backend/app/routers/fantasy.py#L57) `secrets.token_hex(3)` sin retry ni transacción liga+miembro. |
| B6 | Nada impide varias jornadas `en_curso` | ❌ SIGUE | Sin índice único parcial en `migrations/001_initial_schema.sql` (solo `CHECK` de valores) y `actualizar_jornada` ([admin.py:41-49](backend/app/routers/admin.py#L41-L49)) no valida. |
| B7 | `actualizar_mi_equipo`: validaciones incompletas | ❌ SIGUE | [fantasy.py:167-187](backend/app/routers/fantasy.py#L167-L187) sigue permitiendo 11 titulares, sin límite por posición, sin validar capitán-titular ni pertenencia ni cierre de mercado. |
| B8 | Exception handler expone `str(exc)` | ❌ SIGUE | [main.py:33](backend/app/main.py#L33) sigue devolviendo `str(exc)` y `type(exc).__name__`. |
| B9 | `calcular_puntuaciones` ignora `jornada_inicio` | ❌ SIGUE | [admin.py:292](backend/app/routers/admin.py#L292) itera **todos** los miembros sin filtrar por `ligas_fantasy.jornada_inicio`. |
| B10 | `/clasificacion` sin `ORDER BY` | ❌ SIGUE | [liga_real.py:28](backend/app/routers/liga_real.py#L28) `select("*")` sin `.order(...)`. |
| B11 | Schemas sin validación de dominio | 🟡 PARCIAL | `EstadisticaJugadorIn` ya usa `ge=0` ([admin.py schema:39-43](backend/app/schemas/admin.py#L39-L43)). Pero `ActualizarPartidoIn.goles_local/visitante` siguen sin `ge=0` ([schema:30-31](backend/app/schemas/admin.py#L30-L31)) y `estado`/`posicion`/`estado_fantasy` siguen siendo `str` libres (sin `Literal`). |
| B12 | PATCH con `if v is not None` impide null | ❌ SIGUE | `actualizar_jornada` ([admin.py:43](backend/app/routers/admin.py#L43)), `actualizar_partido` ([:75](backend/app/routers/admin.py#L75)) y `actualizar_jugador` ([:159](backend/app/routers/admin.py#L159)) siguen igual; solo `equipos` usa `exclude_unset`. |
| B13 | `put_estadisticas` no valida partido ni pertenencia | ❌ SIGUE | [admin.py:97-135](backend/app/routers/admin.py#L97-L135): no verifica que el `partido_id` exista, ni que los jugadores pertenezcan a los equipos, y el `upsert` no borra estadísticas omitidas. |
| B14 | Recalcular partido finalizado no actualiza consolidado | ❌ SIGUE | `_recalcular_puntos_partido` ([admin.py:354-385](backend/app/routers/admin.py#L354-L385)) solo toca `estadisticas_jugador`; `puntuaciones_fantasy`/`puntos_total` quedan obsoletos. |
| B15 | `scoring.py`: bonus de minutos y FIXME | ❌ SIGUE | [scoring.py:2,30-33](backend/app/scoring.py#L30-L33): FIXME presente, `minutos>=60` inalcanzable y doble bonus (`>=60` y `>0`). |
| B16 | Titularidad automática contradice la formación | ❌ SIGUE | [fantasy.py:23-25,258-270](backend/app/routers/fantasy.py#L258-L270) usa límites fijos 1-2-2-2; la formación sigue solo en `localStorage` del front. |
| B17 | `/goleadores` solo agrega una jornada | 🟡 PARCIAL | [liga_real.py:156-217](backend/app/routers/liga_real.py#L156-L217): ahora cae a la última jornada `finalizada` si no hay `en_curso`, pero sigue siendo una sola jornada, sin parámetro `?jornada=` ni ranking de temporada. |
| B18 | `salir_de_liga` no limpia `puntuaciones_fantasy` ni es transaccional | ❌ SIGUE | [fantasy.py:286-296](backend/app/routers/fantasy.py#L286-L296): dos deletes no transaccionales, depende de CASCADE. |
| B19 | Mejoras generales | ❌ SIGUE | Sin `tests/`; todos los endpoints usan `supabase_admin`; el cliente anon `supabase` ([database.py:6](backend/app/database.py#L6)) se crea pero **no se usa en ninguna query**; `upload-signature` firma cualquier `folder`. |

---

## FRONTEND

| ID | Resumen | Estado | Comprobación |
|----|---------|--------|--------------|
| F1 | `superadminGuard`: carrera al refrescar expulsa admins | ❌ SIGUE | [auth.service.ts:37,40](web/src/app/core/services/auth.service.ts#L37-L40): `fetchPerfil()` se llama sin `await` y luego `cargando.set(false)`; el guard ([superadmin.guard.ts](web/src/app/core/guards/superadmin.guard.ts)) lee `esAdmin` aún en `false`. |
| F2 | `cambiarFormacion` no persiste en backend | ❌ SIGUE | [mi-equipo.component.ts:73-100](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L73-L100): hace `fantasy.miEquipo.set(updated)` sin llamar a `actualizarPlantilla()`. |
| F3 | El capitán nunca se puede asignar | ❌ SIGUE | [mi-equipo.component.ts:141,183](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L141) envían `es_capitan: false`; no hay UI de capitán. |
| F4 | Callback OAuth con `setTimeout(1500)` | ❌ SIGUE | [auth-callback.component.ts:23-29](web/src/app/features/auth/callback/auth-callback.component.ts#L23-L29) sin cambios. |
| F5 | `/ajustes` mock y sin guard | ❌ SIGUE | Ruta sin `authGuard` ([app.routes.ts:93-96](web/src/app/app.routes.ts#L93-L96)); datos hardcodeados y `localStorage` ([ajustes.component.ts:57-67,79](web/src/app/features/ajustes/ajustes.component.ts#L57-L67)); enlace falso `liga-alameda.es/invite/alameda26` ([:100](web/src/app/features/ajustes/ajustes.component.ts#L100)). No usa `actualizarPerfil()`. (Sí se añadió `salirDeLiga` real y `ThemeService`.) |
| F6 | Clasificación: propietario y PJ incorrectos | ❌ SIGUE | [fantasy.service.ts:183-192](web/src/app/core/services/fantasy.service.ts#L183-L192): `propietario: c.nombre_equipo` y `pj: 0`. |
| F7 | Puntos de jugadores siempre a 0 | ❌ SIGUE | [fantasy.service.ts:200-201,216-217](web/src/app/core/services/fantasy.service.ts#L200-L201) mapean `puntuacionJornada/Total` a `0`. |
| F8 | Errores HTTP silenciosos | ❌ SIGUE | `subscribe` sin handler de `error` en `cargarMercado`/`_cargarDatosLiga`; `fichar()` ([mercado.component.ts:66-71](web/src/app/features/fantasy/mercado/mercado.component.ts#L66-L71)) hace `await` sin try/catch. El signal `error` nunca se setea. |
| F9 | Sin manejo de 401 global | ❌ SIGUE | [auth.interceptor.ts](web/src/app/core/interceptors/auth.interceptor.ts) añade el token pero no captura 401/403. |
| F10 | Tras crear/unirse no se activa esa liga | ❌ SIGUE | `mis-ligas` ([:61](web/src/app/features/fantasy/mis-ligas/mis-ligas.component.ts#L61)) y dashboard llaman a `inicializar()`, que elige la de localStorage o la primera. |
| F11 | UI superadmin permite estados que rompen el backend | ❌ SIGUE | Jornadas: `hayEnCurso` existe pero `cambiarEstado` no bloquea ([superadmin-jornadas.component.ts:49-54](web/src/app/features/superadmin/components/jornadas/superadmin-jornadas.component.ts#L49-L54)). Puntuaciones: `calcular()` sin confirmación, repetible ([superadmin-puntuaciones.component.ts:29-38](web/src/app/features/superadmin/components/puntuaciones/superadmin-puntuaciones.component.ts#L29-L38)). |
| F12 | `cardsTrackRef` puede ser `undefined` | ❌ SIGUE | [fantasy-dashboard.component.ts:127-128](web/src/app/features/fantasy/dashboard/fantasy-dashboard.component.ts#L127-L128) y [home.component.ts:72-73](web/src/app/features/home/home.component.ts#L72-L73) acceden a `nativeElement` sin guard. |
| F13 | Carrusel duplica la lista en un getter | ❌ SIGUE | `get partidos()` con `[...lista, ...lista]` en [home.component.ts:24-26](web/src/app/features/home/home.component.ts#L24-L26) y [fantasy-dashboard.component.ts:31-34](web/src/app/features/fantasy/dashboard/fantasy-dashboard.component.ts#L31-L34). |
| F14 | Partidos sin filtrar por jornada | ❌ SIGUE | `cargarPartidos()` ([liga-real.service.ts:75](web/src/app/core/services/liga-real.service.ts#L75)) baja todos los partidos; no usa `?jornada=`. |
| F15 | HEX hardcodeados contra la regla de tokens | ❌ SIGUE | [mi-equipo.component.ts:201-203](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L201-L203) y [mercado.component.ts:81-83](web/src/app/features/fantasy/mercado/mercado.component.ts#L81-L83) devuelven HEX (`#0f5a8a`, `#7b2d8b` no están en la paleta). |
| F16 | `presupuesto ?? 100` inventado | ❌ SIGUE | [fantasy.service.ts:58](web/src/app/core/services/fantasy.service.ts#L58), [mi-equipo.component.ts:61](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L61), [fantasy-dashboard.component.ts:42](web/src/app/features/fantasy/dashboard/fantasy-dashboard.component.ts#L42). |
| F17 | `inicializar()` se repite sin caché | ❌ SIGUE | Dashboard/mercado/mis-ligas llaman `inicializar()` en cada navegación; solo `mi-equipo` comprueba `enLiga()`. |
| F18 | CLAUDE.md desactualizado | ❌ SIGUE | GSAP instalado y usado; backend FastAPI real; `core/data/fantasy.data.ts` es código muerto (nadie lo importa). |
| F19 | Detalle de equipo con stats a cero | ❌ SIGUE | [liga-real.service.ts:159](web/src/app/core/services/liga-real.service.ts#L159) `asistencias: 0` (y goles) fijos por jugador. |
| F20 | Validación de email duplicada x3 | ❌ SIGUE | Misma regex en [login:24](web/src/app/features/auth/login/login.component.ts#L24), [register:30](web/src/app/features/auth/register/register.component.ts#L30) y [ajustes:45](web/src/app/features/ajustes/ajustes.component.ts#L45). |

---

## Resumen

- **Backend:** 17 puntos → 15 ❌ SIGUE, 2 🟡 PARCIAL (B11, B17), 0 ✅.
- **Frontend:** 20 puntos → 20 ❌ SIGUE, 0 ✅.

**Ningún bug se ha corregido por completo** desde la auditoría del 2026-06-11. Las únicas mejoras parciales son la validación `ge=0` en estadísticas (B11) y el fallback de `/goleadores` a la última jornada finalizada (B17). El resto persiste idéntico.

Prioridades intactas (de [BUGS.md](BUGS.md)): **B1+F11** (duplicación de puntos), **F1** (admin expulsado), **F2/F3** (alineación/capitán), **B4/B5** (carreras), **B6** (varias jornadas en curso → 500 público), **B3** (mercado incoherente).
