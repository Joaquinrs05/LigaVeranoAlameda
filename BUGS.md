# BUGS.md — Auditoría de frontend y backend

Fecha: 2026-06-11. Análisis estático del código en `backend/` y `web/`.
Severidades: 🔴 crítico (rompe datos o funcionalidad), 🟠 medio (comportamiento incorrecto en casos reales), 🟡 menor / mejora.

---

## BACKEND

### 🔴 B1. `calcular_puntuaciones` no es idempotente — duplica puntos al recalcular

`backend/app/routers/admin.py:295-315`

El upsert en `puntuaciones_fantasy` sí es idempotente, pero después **siempre suma** el total de la jornada a `miembros_liga_fantasy.puntos_total`. Si el admin pulsa "Calcular" dos veces para la misma jornada (la UI de superadmin lo permite sin aviso), los puntos se duplican.

**Fix sugerido:** recalcular `puntos_total` como `SUM(puntos)` de `puntuaciones_fantasy` del miembro, en lugar de acumular incrementalmente. Alternativa: restar el valor previo del registro antes del upsert.

### 🔴 B2. `get_admin_user` puede lanzar 500 en vez de 403

`backend/app/auth.py:43-50`

En supabase-py v2.31 `maybe_single().execute()` devuelve `None` cuando no hay fila (está documentado en el helper `_ms` de `fantasy.py:32`). Si el usuario no tiene fila en `perfiles`, `result.data` lanza `AttributeError` → error 500 en todos los endpoints `/admin`. Usar el mismo patrón `_ms` que en `fantasy.py`.

### 🔴 B3. Incoherencia en el estado del mercado cuando no hay jornada en curso

`backend/app/routers/fantasy.py:343-352` vs `fantasy.py:136-144`

- `_verificar_mercado_activo()`: si **no hay** jornada `en_curso`, no lanza excepción → el mercado queda **abierto** (se puede fichar/vender).
- `get_liga()`: en el mismo caso devuelve `mercado_activo: false` → el frontend muestra el mercado **cerrado**.

Resultado: la UI dice "cerrado" pero la API acepta operaciones (o viceversa según se interprete). Decidir una semántica única y aplicarla en ambos sitios.

### 🔴 B4. Condiciones de carrera en fichajes y ventas (presupuesto no atómico)

`backend/app/routers/fantasy.py:233, 272-283, 317-324`

El presupuesto se lee, se valida y se escribe en pasos separados sin transacción ni lock:

- Dos fichajes simultáneos pueden dejar presupuesto negativo o pisar la actualización del otro.
- En `fichar_jugador` el presupuesto se descuenta **antes** del insert en `plantilla_fantasy`; si el insert falla (p. ej. carrera con el UNIQUE `(miembro_id, jugador_id)`), el dinero se pierde sin fichaje.
- En `vender_jugador`, el dinero se devuelve antes del delete; si el delete falla, dinero gratis.

**Fix sugerido:** mover la operación a una función RPC de Postgres (transacción) o usar update condicional (`UPDATE ... SET presupuesto = presupuesto - X WHERE presupuesto >= X`).

### 🔴 B5. `crear_liga`: colisión de código de invitación → 500, y operación no transaccional

`backend/app/routers/fantasy.py:57, 67-79`

- `secrets.token_hex(3)` no comprueba colisiones; `codigo_invitacion` es UNIQUE en BD → un choque produce APIError 500. Añadir retry con regeneración.
- Si el insert del miembro falla tras crear la liga, queda una liga huérfana sin miembros

### 🔴 B6. Nada impide tener varias jornadas `en_curso` — rompe endpoints con `maybe_single()`

`backend/app/routers/admin.py:41-49` (no valida), sin constraint en `migrations/001_initial_schema.sql`

`actualizar_jornada` permite poner N jornadas en `en_curso`. Con más de una fila, los `maybe_single()` de `get_goleadores` (`liga_real.py:121`), `crear_liga` (`fantasy.py:58`), `get_liga` (`fantasy.py:136`) y `_verificar_mercado_activo` (`fantasy.py:344`) lanzan APIError → 500 incluso en endpoints públicos.

**Fix:** índice único parcial `CREATE UNIQUE INDEX ON jornadas ((true)) WHERE estado = 'en_curso'` y/o validar en el endpoint admin.

### 🔴 B7. `actualizar_mi_equipo`: validaciones de alineación incompletas e incoherentes

`backend/app/routers/fantasy.py:167-187`

- Permite hasta **11 titulares**, pero todo el sistema usa formaciones de 7 (fútbol sala; el propio `fichar_jugador` usa límites 1-2-2-2 = 7). El 11 es un resto de fútbol 11.
- No valida límites por posición (un usuario puede alinear 7 delanteros vía API).
- No valida que el capitán sea titular ni que los `jugador_id` estén en la plantilla (silenciosamente no actualiza nada).
- No respeta el cierre de mercado/jornada: se puede cambiar la alineación con la jornada en curso, antes de calcular puntos.

### 🟠 B8. El manejador global de excepciones expone detalles internos

`backend/app/main.py:33`

Devuelve `str(exc)` y el tipo de la excepción al cliente. Puede filtrar rutas, SQL, claves de configuración, etc. Devolver un mensaje genérico y loguear el detalle solo en servidor.

### 🟠 B9. `calcular_puntuaciones` ignora `jornada_inicio` de la liga

`backend/app/routers/admin.py:276-315`

Itera **todos** los miembros de todas las ligas. Una liga creada en la jornada 5 recibirá puntos si el admin (re)calcula la jornada 3. Filtrar por `ligas_fantasy.jornada_inicio <= jornada_numero`.

### 🟠 B10. `/clasificacion` sin ORDER BY explícito

`backend/app/routers/liga_real.py:21-24`

Depende del `ORDER BY` interno de la vista, que PostgREST no garantiza preservar. El frontend asigna la posición por índice del array (`liga-real.service.ts:166`), así que un cambio de orden corrompería la tabla mostrada. Añadir `.order("puntos", desc=True)...` en la query (la vista expone las columnas necesarias).

### 🟠 B11. Schemas sin validación de dominio

`backend/app/schemas/admin.py`

- `ActualizarPartidoIn.goles_local/goles_visitante` sin `ge=0` → goles negativos aceptados.
- `estado` (jornada y partido), `posicion` y `estado_fantasy` son `str` libres. Un typo (`"Delantero"`, `"finalizado"`) no falla: una posición desconocida puntúa como delantero por el default de `scoring.py:20` y un estado mal escrito hace que el partido nunca compute en la vista `clasificacion`. Usar `Literal[...]` / enums.
- Mezcla de idiomas en estados: partidos `upcoming/live/finished` y jornadas `pendiente/en_curso/finalizada` — confuso y propenso a errores.

### 🟠 B12. PATCH con `if v is not None` impide poner campos a null

`backend/app/routers/admin.py:43, 75, 159`

No se puede borrar un `dorsal`, limpiar el `minuto` de un partido, etc. `ActualizarEquipoIn` ya usa `exclude_unset=True` (línea 200) — aplicar el mismo patrón al resto para ser consistente.

### 🟠 B13. `put_estadisticas` no es un PUT real ni valida pertenencia

`backend/app/routers/admin.py:97-135`

- No verifica que `partido_id` exista (crea estadísticas para partidos fantasma).
- No verifica que los jugadores pertenezcan a los equipos del partido.
- No elimina estadísticas de jugadores que ya no vienen en la lista (semántica de PUT incompleta): si quitas un gol asignado por error a un jugador eliminándolo de la lista, su fila queda en BD.

### 🟠 B14. Recalcular un partido finalizado no actualiza puntuaciones consolidadas

`backend/app/routers/admin.py:81-82, 338-368`

`_recalcular_puntos_partido` corrige `estadisticas_jugador.puntos_fantasy`, pero si la jornada ya se había calculado (`puntuaciones_fantasy` + `puntos_total`), esos totales quedan obsoletos y recalcular la jornada duplica (ver B1). El flujo corrección-de-resultados → fantasy está roto de extremo a extremo.

### 🟡 B15. `scoring.py`: bonus de minutos inalcanzable y FIXME pendiente

`backend/app/scoring.py:30-33`

`minutos_jugados >= 60` nunca se cumple en fútbol sala (partidos de ~40'). Además hay doble bonus de minutos (`>= 60` y `> 0`). Revisar el baremo (hay un FIXME en la línea 2).

### 🟡 B16. Titularidad automática al fichar puede contradecir la formación del usuario

`backend/app/routers/fantasy.py:23-25, 258-270`

El backend asigna titular con límites fijos `1-2-2-2`, pero la formación elegida vive solo en el `localStorage` del frontend (`mi-equipo.component.ts:35`). Un fichaje puede romper la alineación 1-3-2-1 del usuario. La formación debería persistirse en el backend.

### 🟡 B17. `/goleadores` solo agrega la jornada activa

`backend/app/routers/liga_real.py:119-177`

Si es intencional ("goleadores de la jornada"), el nombre del endpoint confunde y faltaría un parámetro `?jornada=`. No existe ranking de goleadores de la temporada.

### 🟡 B18. `salir_de_liga` no limpia `puntuaciones_fantasy` explícitamente

`backend/app/routers/fantasy.py:286-296`

Depende del ON DELETE CASCADE. Si el miembro vuelve a unirse, empieza de cero (probablemente correcto), pero conviene documentarlo. Además los dos deletes no son transaccionales.

### 🟡 B19. Mejoras generales backend

- Sin tests (no hay `tests/` ni pytest en `requirements.txt`).
- Sin rate limiting en endpoints públicos ni en `/fantasy/ligas/unirse` (fuerza bruta de códigos de 6 hex = 16,7M, viable).
- Todos los endpoints usan `supabase_admin` (service role); el cliente `supabase` anon de `database.py:5` no se usa nunca — eliminar o aprovechar RLS.
- `/admin/upload-signature` firma cualquier `folder` que se le pase (es admin-only, riesgo bajo, pero conviene un whitelist: `liga`, `jugadores`, `equipos`).
- N+1 en `calcular_puntuaciones` (una query de plantilla + dos writes por miembro) — lento con muchas ligas.

---

## FRONTEND

### 🔴 F1. `superadminGuard`: carrera al refrescar — expulsa a los admins

`web/src/app/core/services/auth.service.ts:36-40` + `core/guards/superadmin.guard.ts`

En el constructor de `AuthService`, `fetchPerfil()` se llama **sin await** y justo después `cargando.set(false)`. El guard espera a `cargando === false` y comprueba `esAdmin`, que aún es `false` porque el perfil no ha llegado → al recargar `/superadmin`, un admin legítimo es redirigido a `/fantasy`.

**Fix:** `await this.fetchPerfil(...)` antes de `cargando.set(false)`, o un signal `perfilCargado` que el guard también espere.

### 🔴 F2. `cambiarFormacion` no persiste los cambios en el backend

`web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts:73-100`

Al cambiar de formación, los titulares sobrantes pasan a reserva solo en el signal local (`fantasy.miEquipo.set(updated)`), sin llamar a `actualizarPlantilla()`. Al recargar la página (o al calcular puntos en el backend) la alineación vuelve a la anterior. Los puntos se calcularían con una alineación que el usuario no ve.

### 🔴 F3. El capitán nunca se puede asignar (el x2 jamás aplica)

`web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts:141, 183`

Las dos llamadas a `actualizarPlantilla` envían `es_capitan: false` para todos, y no existe UI para elegir capitán. El backend duplica los puntos del capitán (`admin.py:291-292`), pero ningún usuario podrá tener uno. Peor: si alguna vez hubo un capitán en BD, cualquier cambio de alineación lo borra. Feature incompleta.

### 🔴 F4. Callback OAuth basado en `setTimeout(1500)`

`web/src/app/features/auth/callback/auth-callback.component.ts:23-29`

Espera 1,5 s fijos y comprueba `autenticado()`. Con red lenta muestra "No se pudo completar la autenticación" aunque el login termine bien medio segundo después. Sustituir por un `effect()` sobre `auth.autenticado()`/`auth.cargando()` con timeout de seguridad más largo.

### 🔴 F5. `/ajustes` sin guard y completamente mock

`web/src/app/app.routes.ts:77-80` + `features/ajustes/ajustes.component.ts`

- La ruta no tiene `authGuard` pese a contener "Salir de liga" (acción destructiva real contra la API) y datos del fantasy.
- Todo el formulario es falso: nombre/email por defecto ("Jugador Fantasy", "jugador@liga-verano.es"), persiste en `localStorage` en vez de usar `AuthService.actualizarPerfil()` (que existe y no se usa desde aquí), y el enlace de invitación está hardcodeado a `liga-alameda.es/invite/alameda26` (ajustes.component.ts:98) en lugar del código real de la liga activa.

### 🟠 F6. Clasificación fantasy: propietario y PJ incorrectos

`web/src/app/core/services/fantasy.service.ts:183-192`

`propietario: c.nombre_equipo` (debería ser el nombre del manager — la vista `clasificacion_fantasy` no lo expone, habría que añadir el join a `perfiles`) y `pj: 0` fijo. La tabla muestra datos falsos.

### 🟠 F7. Puntos de jugadores siempre a 0

`web/src/app/core/services/fantasy.service.ts:194-220`

`puntuacionJornada` y `puntuacionTotal` se mapean a 0 tanto en plantilla como en mercado: las cards muestran "0 pts" siempre. Falta endpoint/columna de puntos por jugador (agregado de `estadisticas_jugador.puntos_fantasy`).

### 🟠 F8. Errores HTTP silenciosos en casi todos los subscribes

`fantasy.service.ts` (`cargarMercado:90`, `_cargarDatosLiga:162-180`), `liga-real.service.ts` (todos los métodos)

Sin handler de `error` (o solo apagando `cargando`): si la API falla o devuelve 401/403, el usuario ve pantallas vacías sin mensaje. El signal `error` de FantasyService existe pero nunca se setea. Igualmente `fichar()` en `mercado.component.ts:66-71` hace `await` sin try/catch → unhandled promise rejection y el usuario no sabe por qué no fichó (presupuesto, plantilla llena, mercado cerrado…). El backend devuelve `detail` con mensajes útiles que se descartan.

### 🟠 F9. Sin manejo de 401 global

`web/src/app/core/interceptors/auth.interceptor.ts`

El interceptor añade el token pero no captura respuestas 401/403 para cerrar sesión o redirigir a login. Sesión expirada = aplicación rota en silencio.

### 🟠 F10. Tras crear/unirse a una liga, no se activa esa liga

`mis-ligas.component.ts:54-69`, `fantasy-dashboard.component.ts:101-125`

Se llama a `fantasy.inicializar()`, que selecciona la liga guardada en localStorage (`fantasy.service.ts:75-77`) o la primera. Si el usuario tenía otra liga activa, la recién creada/unida no se selecciona y el dashboard muestra la antigua. Pasar el `liga_id` devuelto y llamar a `seleccionarLiga`.

### 🟠 F11. La UI de superadmin permite estados que rompen el backend

`superadmin-jornadas.component.ts:49-54` y `superadmin-puntuaciones.component.ts:29-38`

- Permite poner varias jornadas `en_curso` (existe el computed `hayEnCurso` pero no bloquea) → ver B6.
- Permite recalcular puntuaciones de la misma jornada N veces sin aviso → dispara B1 (duplicación de puntos).

### 🟠 F12. `cardsTrackRef` puede ser `undefined`

`fantasy-dashboard.component.ts:127-128`, `home.component.ts:72-73`

`pauseScroll/resumeScroll` acceden a `nativeElement` sin comprobar. En el dashboard, el track solo existe si `enLiga()`; `home.component.ts:83` llama `resumeScroll()` desde la timeline GSAP en `ngAfterViewInit` — si el carrusel estuviera dentro de un `@if` (datos aún no cargados), crash. Añadir guard `?.` o `viewChild()` opcional.

### 🟡 F13. Carrusel duplica la lista en un getter

`home.component.ts:24-27`, `fantasy-dashboard.component.ts:31-34`

`get partidos()` devuelve `[...lista, ...lista]` creando un array nuevo en **cada** ciclo de change detection. Convertir a `computed()` (además es la convención del proyecto: signals, no getters).

### 🟡 F14. Partidos sin filtrar por jornada

`liga-real.service.ts:69-84`

`cargarPartidos()` baja todos los partidos de la temporada y el carrusel del home/dashboard los muestra todos. El backend soporta `?jornada=`; usar `jornadaActual`.

### 🟡 F15. Colores HEX hardcodeados en TS contra la regla de tokens

`mi-equipo.component.ts:201-203`, `mercado.component.ts:81-83`

`posicionColor()` devuelve HEX (`#1a4a2e`, `#c0552a`, `#0f5a8a`, `#7b2d8b`) que acaban en el template via binding. CLAUDE.md prohíbe hardcodear HEX; `#0f5a8a` y `#7b2d8b` ni siquiera existen en la paleta. Mover a tokens Tailwind (mapa de clases).

### 🟡 F16. `presupuesto ?? 100` — valor inventado mientras carga

`fantasy.service.ts:58`, `mi-equipo.component.ts:61`, `fantasy-dashboard.component.ts:42`

Antes de cargar el miembro se muestra "100 M" en pantalla. Mostrar estado de carga o `null`.

### 🟡 F17. `inicializar()` se repite en cada navegación sin caché

`fantasy-dashboard.component.ts:90`, `mercado.component.ts:53`, `mis-ligas.component.ts:35`, `mi-equipo.component.ts:66`

Cada visita re-descarga ligas + clasificación + miembro + plantilla. Mínimo, evitar re-inicializar si ya hay datos (solo `mi-equipo` lo hace). Mejora: un único punto de carga (resolver o componente padre de las rutas fantasy).

### 🟡 F18. CLAUDE.md desactualizado respecto al código

- "No instalar GSAP todavía — futuro": GSAP está instalado y usado en home, clasificación y dashboard.
- "Sin backend por ahora — datos mock": existe backend FastAPI y los componentes consumen la API; los archivos de `core/data/*.data.ts` parecen restos muertos (verificar si algo los importa y borrarlos).
- El árbol de estructura no refleja `auth/`, `equipos/`, `superadmin/`, guards, interceptors ni servicios reales.

### 🟡 F19. Detalle de equipo con stats de jugador a cero

`liga-real.service.ts:144-151`

`goles: 0, asistencias: 0` fijos para cada jugador — la página de equipo muestra estadísticas falsas. Falta endpoint de stats agregadas por jugador.

### 🟡 F20. Validación de email duplicada y regex laxa

`login.component.ts:24`, `register.component.ts:30`, `ajustes.component.ts:43`

La misma regex copiada 3 veces — extraer a un helper compartido.

---

## FEATURES PENDIENTES (no son bugs)

### FT1. Vista de detalle al pulsar un jugador de mi plantilla

En `mi-equipo`, al tocar un jugador propio debería abrirse una vista/modal de detalle con acciones de mercado. Hoy el tap solo selecciona para intercambiar titular/reserva (`mi-equipo.component.ts:102-143`). La vista debe permitir:

1. **Venta directa al mercado** — vender el jugador inmediatamente a precio de mercado. El endpoint ya existe (`DELETE /fantasy/ligas/{liga_id}/fichajes/{jugador_id}`, [fantasy.py:299-324](backend/app/routers/fantasy.py#L299-L324)) pero hoy vende siempre a `precio_compra`; habría que decidir si la venta directa usa el `precio_fantasy` actual.
2. **Poner en venta por X precio** — listar el jugador en el mercado a un precio elegido por el usuario, visible para el resto de miembros de la liga, que podrían pujar o comprarlo. Requiere backend nuevo: tabla de listados/ofertas (`mercado_listados` con `miembro_id`, `jugador_id`, `precio`, `estado`), endpoints para crear/cancelar el listado y comprar, y mostrar estos listados en el mercado junto a los agentes libres. Nota: el mercado actual es de jugadores sin dueño por liga compartida — habría que decidir si un jugador puede pertenecer a varios miembros de la misma liga o si fichar lo bloquea (hoy no lo bloquea: solo se excluye de TU mercado, `fantasy.py:206-208`).
3. **Subir la cláusula** — pagar del presupuesto para aumentar la cláusula de rescisión del jugador y protegerlo de robos por parte de otros miembros. Requiere: columna `clausula` en `plantilla_fantasy` (inicializada al precio de compra), endpoint `PATCH` para incrementarla descontando presupuesto, y el mecanismo complementario de "pagar cláusula" para robar jugadores de otros equipos. Sin el robo de jugadores la cláusula no tiene función — son dos features acopladas.

Diseño UI sugerido: modal oscuro (módulo fantasy) con la card del jugador, sus puntos por jornada (depende de F7), y los tres botones de acción + confirmación. Mientras el mercado esté cerrado (`mercado_activo = false`), las tres acciones deberían deshabilitarse igual que el fichaje (coherente con B3).

### FT2. Analítica web — saber cuánta gente entra y qué visita

Hoy no hay ningún tipo de analítica. Opciones, de más simple a más completa:

1. **Google Analytics 4 (GA4)** — gratis, el estándar. Crear propiedad en analytics.google.com, añadir el snippet `gtag.js` en `web/src/index.html` y, al ser una SPA, enviar manualmente un `page_view` en cada navegación: suscribirse a los eventos `NavigationEnd` del Router en `app.ts` (o un servicio `AnalyticsService` en `core/services/`) y llamar a `gtag('event', 'page_view', { page_path: url })`. Sin esto GA4 solo registraría la primera carga. Pega: requiere banner de consentimiento de cookies (RGPD) para visitantes de la UE.
2. **Plausible / Umami** (alternativa ligera, sin cookies) — un solo script, no requiere banner de consentimiento, dashboard simple con visitas/páginas/referrers que es exactamente "ver la gente que entra". Umami es open source y se puede autohospedar en el mismo VPS junto al backend (contenedor Docker + Postgres), coste cero. Plausible es de pago (~9 €/mes) u autohospedado.
3. **Eventos custom de producto** (fase 2, con cualquiera de las anteriores) — además de páginas vistas, trackear acciones clave: registro completado, liga creada, unirse a liga, fichaje, venta. Útil para saber qué partes del fantasy se usan.

**Recomendación:** para una liga local, Umami autohospedado en el VPS (sin cookies, sin banner, datos propios) o GA4 si se prefiere no mantener nada. En ambos casos el único cambio estructural en el código es el servicio de analítica suscrito al Router; mantener los IDs de tracking en `environments/` y desactivarlo cuando `production: false` para no contaminar las métricas con desarrollo local.

---

## Resumen de prioridades

| #        | Issue                                                | Impacto                                 |
| -------- | ---------------------------------------------------- | --------------------------------------- |
| B1 + F11 | Recalcular jornada duplica puntos fantasy            | Corrupción de datos                     |
| F1       | Guard expulsa a admins al refrescar                  | Admin inutilizable                      |
| F2/F3    | Alineación no persistida y capitán imposible         | Puntos incorrectos                      |
| B4/B5    | Carreras en presupuesto y creación de ligas          | Corrupción de datos                     |
| B6       | Varias jornadas en curso → 500 en endpoints públicos | Caída de la web pública                 |
| B3       | Mercado abierto/cerrado incoherente                  | Trampas posibles                        |
| B2       | 500 en vez de 403 en /admin                          | Bug latente (depende de tabla perfiles) |
| F5       | /ajustes mock y sin guard                            | UX engañosa                             |
