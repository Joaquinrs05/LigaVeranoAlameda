# Equipos — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `07-equipos` |
| **Status** | `done` |
| **Módulo** | `web-informativa` |
| **Prioridad** | `alta` |
| **Mockup** | Sin mockup — diseñar siguiendo `DESIGN.md` y el patrón visual de `02-clasificacion` |
| **Dependencias** | `00-architecture`, `01-home-dashboard` (shared navbar y footer) |

---

## Overview

Sección pública que muestra todos los equipos de la liga. Desde la lista el usuario puede pinchar en un equipo y ver su página de detalle: stats del equipo y el listado completo de jugadores con sus estadísticas individuales.

---

## En scope

### Vista lista — `/equipos`
- Grid de tarjetas, una por equipo
- Cada tarjeta muestra: nombre del equipo, color identificativo, y stats clave (PJ, PTS, GF, GC)
- Ordenadas por posición en la clasificación
- Al pinchar en una tarjeta navega a `/equipos/:id`
- Navbar modo claro y footer

### Vista detalle — `/equipos/:id`
- Cabecera con nombre del equipo y badge de posición en la liga
- Bloque de stats del equipo: PJ, V, E, D, GF, GC, Pts
- Tabla de jugadores del equipo: nombre, posición, goles, asistencias
- Botón / enlace "Volver a equipos"
- Navbar modo claro y footer

### Corrección navbar-light (incluir en este sprint)
La `NavbarLightComponent` actualmente mezcla links de Fantasy (Mi Equipo, Mercado) con los de la web informativa. Debe corregirse para mostrar **solo** los links de la web pública:
- Inicio (`/`)
- Clasificación (`/clasificacion`)
- Equipos (`/equipos`) ← nuevo
- Ajustes (`/ajustes`)

El CTA "Entrar al Fantasy" en la topbar y el botón "Unirse a la Liga Fantasy" en el sidebar se mantienen.

---

## Fuera de scope

- Historial de partidos del equipo (se implementará más adelante)
- Filtros o búsqueda de equipos
- Estadísticas avanzadas de jugadores (tarjetas, minutos, etc.)
- Gestión de equipos (solo lectura)

---

## Árbol de componentes

```
features/
└── equipos/
    ├── equipos.component.ts        ← lista, ruta /equipos
    ├── equipos.component.html
    ├── equipo-detalle/
    │   ├── equipo-detalle.component.ts   ← detalle, ruta /equipos/:id
    │   └── equipo-detalle.component.html
```

No se crean subcomponentes adicionales — la tarjeta de equipo es inline en la lista.

---

## Modelos necesarios

Crear `web/src/app/core/models/equipo.model.ts` (pendiente del sprint 0):

```typescript
export interface IEquipo {
  id: string;
  nombre: string;
  color: string;          // HEX identificativo del equipo para el badge
  posicion: number;       // posición en la clasificación
  jugadores: IJugadorEquipo[];
  stats: IEquipoStats;
}

export interface IEquipoStats {
  pj: number;   // partidos jugados
  v:  number;   // victorias
  e:  number;   // empates
  d:  number;   // derrotas
  gf: number;   // goles a favor
  gc: number;   // goles en contra
  pts: number;  // puntos
}

export interface IJugadorEquipo {
  id: string;
  nombre: string;
  posicion: 'Portero' | 'Cierre' | 'Ala' | 'Pivot';
  goles: number;
  asistencias: number;
  dorsal: number;
}
```

Crear `web/src/app/core/data/equipos.data.ts` con datos mock de ≥ 4 equipos, ≥ 5 jugadores por equipo.

---

## Rutas a añadir en `app.routes.ts`

```typescript
{
  path: 'equipos',
  loadComponent: () => import('./features/equipos/equipos.component').then(m => m.EquiposComponent),
},
{
  path: 'equipos/:id',
  loadComponent: () => import('./features/equipos/equipo-detalle/equipo-detalle.component').then(m => m.EquipoDetalleComponent),
},
```

---

## Diseño — guía para implementación

Sin mockup propio, seguir estas reglas:

**Lista de equipos:**
- Fondo de página: `bg-background`
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md`
- Tarjeta: `bg-surface border border-outline rounded p-lg`
- Badge de color del equipo: cuadrado `w-10 h-10` con el `color` del equipo
- Stats en fila: texto `text-data-mono font-bold text-on-background` con label `text-label-bold text-on-background/60`

**Detalle de equipo:**
- Cabecera con `bg-tertiary text-background` (igual que navbar), muestra nombre del equipo y badge de posición en `bg-secondary text-on-background`
- Bloque de stats: `grid-cols-4 gap-md`, cada stat con número grande (`text-headline-lg font-bold text-primary`) y label pequeño (`text-label-bold text-on-background/60`)
- Tabla de jugadores: cabecera `bg-primary/10`, filas alternas `bg-surface` / `bg-background`, dorsal en `text-data-mono`

---

## Criterios de aceptación

- [ ] `IEquipo`, `IEquipoStats`, `IJugadorEquipo` creados en `equipo.model.ts`
- [ ] `equipos.data.ts` con ≥ 4 equipos reales de la liga, ≥ 5 jugadores cada uno
- [ ] `EquiposComponent` muestra grid de tarjetas con stats
- [ ] Pinchar en tarjeta navega a `/equipos/:id`
- [ ] `EquipoDetalleComponent` muestra cabecera, stats y tabla de jugadores
- [ ] Botón "Volver" funciona (navega a `/equipos`)
- [ ] `navbar-light` corregida: solo links web informativa (Inicio, Clasificación, Equipos, Ajustes)
- [ ] Rutas `/equipos` y `/equipos/:id` añadidas a `app.routes.ts`
- [ ] `00-architecture.md` actualizado con las nuevas rutas
- [ ] Sin `any`, sin `*ngIf`, sin `*ngFor`, sin colores HEX hardcodeados en templates
- [ ] `ng build` sin errores
