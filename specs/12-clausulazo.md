# Cláusulazo — Ver equipo rival y robar jugadores por cláusula — Spec

---

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `12-clausulazo` |
| **Status** | `in-progress` |
| **Módulo** | `fantasy` |
| **Prioridad** | `media` |
| **Mockup** | Reutiliza la vista de campo de `mi-equipo` (sin mockup nuevo) |
| **Dependencias** | `03-fantasy-dashboard`, `05-mi-equipo`, `10-backend-full` |

---

## Overview

Permite entrar en el equipo de **otro miembro** de la liga fantasy desde la clasificación
(dashboard y página de clasificación), ver su alineación en vista de campo, y **robarle un
jugador pagando su cláusula** ("cláusulazo"). Implementa la sección 4b de `FANTASY-PENDIENTE.md`.

---

## Reglas de negocio (acordadas con el usuario)

1. **Cláusula por jugador**: cada jugador fichado tiene una `clausula` (columna nueva en
   `plantilla_fantasy`). Al fichar, la cláusula inicial = precio de fichaje (`precio_fantasy`).
2. **El dueño puede subir su cláusula** en cualquier momento (no puede bajarla). Subir la
   cláusula encarece el robo: protege a sus jugadores.
3. **Cláusulazo**: otro miembro paga la cláusula **actual** del jugador y se lo lleva a su
   plantilla. Si el dueño la subió de 5M a 15M, el comprador paga 15M.
4. **El dueño robado recibe la cláusula íntegra** en su presupuesto.
5. **Solo con mercado abierto** (misma regla que fichar/vender).
6. **Validaciones**: el comprador necesita presupuesto ≥ cláusula; no puede robarse a sí mismo;
   no puede tener ya a ese jugador; su plantilla no puede estar llena (máx. 15).
7. Tras el robo, el jugador entra en el equipo del comprador **como suplente** (`es_titular=false`,
   `es_capitan=false`). Su nuevo `precio_compra` = cláusula pagada; la `clausula` se mantiene en
   ese valor (el nuevo dueño puede volver a subirla).

---

## En scope

- Endpoint para leer la plantilla de cualquier miembro de la liga (solo lectura).
- Endpoint para subir la cláusula de un jugador propio.
- Endpoint de cláusulazo (transferencia atómica entre miembros).
- Ruta + componente de **vista de equipo rival** (campo + suplentes, solo lectura) con acción de
  cláusulazo al pulsar un jugador.
- Filas de clasificación clicables (dashboard y clasificación fantasy) → equipo rival; la fila
  propia enlaza a `mi-equipo`.
- Acción **"Subir cláusula"** en el modal de detalle de `mi-equipo`.

## Fuera de scope

- Mercado entre miembros con listados a precio fijo (sección 4b, parte 2 — no es cláusulazo).
- Histórico de movimientos / notificaciones de robo.
- Animación GSAP propia para la vista rival (se reutiliza el layout, sin timeline nueva).

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/fantasy/equipo/:miembroId` | `EquipoRivalComponent` | lazy, bajo `authGuard` |

---

## Modelo de datos

```typescript
// IJugadorFantasy gana un campo:
export interface IJugadorFantasy {
  // ...campos existentes...
  clausula?: number;
}

// IClasificacionFantasy gana el id de miembro para poder navegar:
export interface IClasificacionFantasy {
  // ...campos existentes...
  miembroId: string;
}
```

---

## API (backend)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/fantasy/ligas/{liga_id}/miembros/{miembro_id}/equipo` | Plantilla de un miembro (solo lectura; el solicitante debe ser miembro de la liga). Incluye `clausula` y puntos. |
| `PATCH` | `/fantasy/ligas/{liga_id}/mi-equipo/{jugador_id}/clausula` | Subir la cláusula de un jugador propio. Body `{ clausula }`. Solo se puede subir. |
| `POST` | `/fantasy/ligas/{liga_id}/clausulazos` | Robar un jugador pagando su cláusula. Body `{ jugador_id }`. |

Las dos operaciones de escritura van por **RPC transaccional** (migración 006), igual que
`fichar_jugador`/`vender_jugador`, con lock sobre los miembros implicados y códigos `PTxyz`.

---

## Árbol de componentes

```
EquipoRivalComponent              (features/fantasy/equipo-rival/equipo-rival.component)
├── NavbarLightComponent          (shared/components/navbar/navbar-light)
├── (campo: slots por posición, solo lectura)
├── (lista de suplentes)
├── (modal de jugador → acción "Cláusulazo")
└── FooterComponent               (shared/components/footer)
```

---

## Estados a implementar

- [ ] **Cargando** — mientras llega la plantilla del rival
- [ ] **Vacío** — el rival no tiene jugadores
- [ ] **Error** — cláusulazo rechazado (presupuesto, mercado cerrado) → mensaje del backend
- [ ] **Poblado** — campo + suplentes con cláusula visible por jugador

---

## Criterios de aceptación

- [ ] La ruta `/fantasy/equipo/:miembroId` carga el componente y la plantilla del rival
- [ ] Las filas de la clasificación (dashboard y página) navegan al equipo del miembro
- [ ] La fila propia navega a `mi-equipo`, no a la vista rival
- [ ] Cada jugador del rival muestra su cláusula
- [ ] Pulsar un jugador abre el modal con la acción "Cláusulazo" y el importe a pagar
- [ ] El cláusulazo transfiere el jugador, descuenta al comprador y abona al dueño (atómico)
- [ ] El cláusulazo respeta el mercado cerrado (error claro)
- [ ] En `mi-equipo` se puede subir la cláusula de un jugador propio
- [ ] Sin HEX hardcodeados nuevos en plantilla (tokens Tailwind)

---

## Notas para el agente

- **Migración en Supabase**: `backend/migrations/006_*.sql` debe ejecutarlo el usuario en Supabase
  (el esquema real vive ahí, no en el repo). El código backend asume que la columna `clausula` y
  las RPCs `subir_clausula`/`clausulazo` ya existen.
- La vista de campo reutiliza la lógica de `buildSlots` de `mi-equipo` pero en **solo lectura**:
  sin drag, sin cambio de formación, sin vender. La única acción es el cláusulazo.
- Mantener modo claro (`NavbarLightComponent`) por coherencia con el resto del fantasy actual
  (el modo oscuro es deuda pendiente común a todo el módulo, no de esta feature).
