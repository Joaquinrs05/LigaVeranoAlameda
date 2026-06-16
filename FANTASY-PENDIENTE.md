# Fantasy — Qué queda por hacer

Estado a 2026-06-16. Inventario de lo pendiente en el módulo Fantasy (front `web/` + back `backend/`).
Los IDs `Bx`/`Fx` enlazan con [BUGS.md](BUGS.md) y su verificación en [VERIFICACION-BUGS-2026-06-16.md](VERIFICACION-BUGS-2026-06-16.md).

Leyenda de prioridad: 🔴 bloqueante para que el fantasy "funcione de verdad" · 🟠 importante · 🟡 mejora.

---

## 1. Puntuaciones reales de jugador 🔴

Hoy las cards muestran **siempre "0 pts"**. `_mapPlantillaItem` y `_mapJugadorMercado` mapean `puntuacionJornada`/`puntuacionTotal` a `0` fijo ([fantasy.service.ts:194-220](web/src/app/core/services/fantasy.service.ts#L194-L220)) — ver **F7**.

- [ ] Backend: exponer puntos por jugador (agregado de `estadisticas_jugador.puntos_fantasy`), por jornada y acumulado.
- [ ] Incluir esos campos en `GET /fantasy/ligas/{id}/mi-equipo` y `GET .../mercado`.
- [ ] Front: mapear los puntos reales en el servicio y mostrarlos en dashboard, mi-equipo y mercado.

Sin esto, la propuesta de valor del fantasy (los puntos) no se ve en ninguna pantalla.

---

## 2. Persistir alineación: formación + capitán 🔴

- [ ] **Formación** (F2/B16): hoy vive solo en `localStorage` ([mi-equipo.component.ts:35](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L35)). `cambiarFormacion()` mueve titulares a reserva **solo en el signal local**, sin llamar a `actualizarPlantilla()`. Al recargar o al calcular puntos en backend, vuelve la alineación anterior.
  - Añadir columna `formacion` en `miembros_liga_fantasy` y persistirla; o llamar a `actualizarPlantilla()` al cambiar de formación.
- [ ] **Capitán** (F3): no hay UI para elegir capitán y siempre se envía `es_capitan: false`. El backend ya duplica los puntos del capitán ([admin.py:307-308](backend/app/routers/admin.py#L307-L308)), pero nadie puede asignarlo. Peor: cualquier cambio de alineación borra el capitán existente.
  - Añadir UI de "hacer capitán" + enviar `es_capitan` correcto en `actualizarPlantilla`.

---

## 3. Vender jugador desde la UI 🟠

`FantasyService.venderJugador()` existe y el endpoint `DELETE /fantasy/ligas/{id}/fichajes/{jugador_id}` funciona, pero **no se llama desde ningún componente**. No hay botón de vender en `mi-equipo`.

- [ ] Añadir acción de vender en la card/detalle de jugador propio.

---

## 4. Vista de detalle de jugador propio (FT1) 🟠

Al tocar un jugador en `mi-equipo` hoy solo se selecciona para intercambiar titular/reserva. Falta un modal de detalle (modo oscuro) con:

- [ ] **Venta directa** al mercado (decidir si a `precio_compra` o `precio_fantasy` actual).
- [ ] **Poner en venta a precio X** visible para la liga → requiere backend nuevo (tabla `mercado_listados`, endpoints crear/cancelar/comprar).
- [ ] **Subir cláusula** + mecanismo de robo entre miembros → columna `clausula`, endpoints, y la feature acoplada de "pagar cláusula". Sin el robo, la cláusula no tiene función.

Las tres acciones deben deshabilitarse con el mercado cerrado (coherente con B3).

---

## 5. `/ajustes` real 🟠

Hoy es **100% mock** ([ajustes.component.ts](web/src/app/features/ajustes/ajustes.component.ts)) — ver **F5**:

- [ ] Añadir `authGuard` a la ruta (contiene "Salir de liga", acción destructiva real).
- [ ] Cargar nombre/email reales del `AuthService` en vez de los hardcodeados ("Jugador Fantasy", "jugador@liga-verano.es").
- [ ] Guardar con `AuthService.actualizarPerfil()` (ya existe) en vez de `localStorage`.
- [ ] Enlace de invitación: usar el `codigo_invitacion` de la liga activa, no el hardcodeado `liga-alameda.es/invite/alameda26`.

---

## 6. Estados de carga / vacío / error 🟠

Las specs (03, 04, 05) piden skeleton de carga, estado vacío y estado de error. Hoy:

- [ ] **Errores HTTP silenciosos** (F8): casi todos los `subscribe` del servicio no tienen handler de `error`; el signal `error` existe pero nunca se setea. `fichar()` hace `await` sin try/catch → unhandled rejection y el usuario no sabe por qué no fichó (presupuesto, plantilla llena, mercado cerrado). El backend devuelve `detail` útil que se descarta.
- [ ] Skeletons de carga en dashboard / mercado / mi-equipo.
- [ ] Mostrar mensajes de error en pantalla.

---

## 7. Coherencia de datos del fantasy

- [ ] **Mercado abierto/cerrado incoherente** (B3) 🔴: `_verificar_mercado_activo()` deja el mercado abierto si no hay jornada en curso, pero `get_liga()` devuelve `mercado_activo: false`. La UI dice "cerrado" pero la API acepta fichajes. Unificar semántica.
- [ ] **Recalcular jornada duplica puntos** (B1/F11) 🔴: `calcular_puntuaciones` suma incrementalmente a `puntos_total`; pulsar "Calcular" dos veces duplica. La UI de superadmin lo permite sin aviso. Recalcular como `SUM(puntuaciones_fantasy)`.
- [ ] **Validación de alineación en backend** (B7) 🟠: `actualizar_mi_equipo` permite 11 titulares (el sistema usa 7), no valida límites por posición, ni capitán titular, ni pertenencia a plantilla, ni cierre de mercado.
- [ ] **Clasificación con datos falsos** (F6) 🟠: `propietario = nombre_equipo` (debería ser el manager) y `pj: 0` fijo.
- [ ] **Carreras de presupuesto** (B4) 🟠: fichar/vender no son atómicos.
- [ ] **Activar liga tras crear/unirse** (F10) 🟠: se llama a `inicializar()`, que selecciona la guardada en localStorage o la primera, no la recién creada.

---

## 8. Diseño y deuda menor 🟡

- [ ] **Modo oscuro fantasy**: las specs 03/04/05 lo exigen; los componentes usan `NavbarLightComponent` (modo claro).
- [ ] **HEX hardcodeados** (F15): `posicionColor()` en [mi-equipo.component.ts:201-203](web/src/app/features/fantasy/mi-equipo/mi-equipo.component.ts#L201-L203) y [mercado.component.ts:81-83](web/src/app/features/fantasy/mercado/mercado.component.ts#L81-L83) devuelven HEX (`#0f5a8a`, `#7b2d8b` ni existen en la paleta). CLAUDE.md prohíbe HEX en plantilla → mover a tokens Tailwind.
- [ ] **`presupuesto ?? 100`** (F16): muestra "100 M" inventado mientras carga.
- [ ] **`get partidos()` duplica array** (F13): `[...lista, ...lista]` en cada change-detection → convertir a `computed`.
- [ ] **`cardsTrackRef` puede ser `undefined`** (F12): `pauseScroll/resumeScroll` sin guard `?.`.
- [ ] **Re-inicialización sin caché** (F17): cada navegación re-descarga ligas + clasificación + miembro + plantilla.
- [ ] **`fantasy.data.ts` es código muerto** (F18): ya nadie importa los datos mock; el servicio usa la API. Borrar.

---

## Resumen de prioridad

| # | Pendiente | Prioridad |
|---|-----------|-----------|
| 1 | Puntos reales de jugador (F7) | 🔴 |
| 2 | Persistir formación + capitán (F2, F3, B16) | 🔴 |
| 7 | Mercado coherente (B3) y recálculo idempotente (B1) | 🔴 |
| 3 | Vender desde UI | 🟠 |
| 5 | `/ajustes` real + guard (F5) | 🟠 |
| 6 | Estados de carga/error (F8) | 🟠 |
| 4 | Detalle de jugador / mercado entre miembros (FT1) | 🟠 |
| 8 | Modo oscuro, tokens, limpieza | 🟡 |
