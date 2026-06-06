# Fantasy Dashboard — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `03-fantasy-dashboard` |
| **Status** | `done` |
| **Módulo** | `fantasy` |
| **Prioridad** | `alta` |
| **Mockup** | `screens/dashboard-fantasy-league-escritorio.html`, `screens/dashboard-movil.html` |
| **Dependencias** | `00-architecture` |

---

## Overview

Panel principal del módulo Fantasy. El usuario ve su equipo fantasy: puntuación de la jornada actual, posición en la liga fantasy, rendimiento de sus jugadores y alertas (lesiones, sanciones, jugadores disponibles en mercado).

---

## En scope

- Puntuación del equipo en la jornada actual
- Clasificación de la liga fantasy (posición del usuario)
- Resumen del equipo con puntuaciones individuales por jugador
- Alertas de la jornada (lesiones, sanciones, mejores jugadores disponibles)
- Navbar modo oscuro y footer

## Fuera de scope

- Edición del equipo (eso es `/fantasy/mi-equipo`)
- Compra/venta de jugadores (eso es `/fantasy/mercado`)

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/fantasy/dashboard` | `FantasyDashboardComponent` | lazy, tema oscuro |
| `/fantasy` | redirect a `/fantasy/dashboard` | |

---

## Modelo de datos

```typescript
export interface IEquipoFantasy {
  id: string;
  nombre: string;
  propietario: string;
  puntuacionTotal: number;
  puntuacionJornada: number;
  posicionLiga: number;
  presupuesto: number;  // dinero disponible en mercado
  jugadores: IJugadorFantasy[];
}

export interface IJugadorFantasy {
  id: string;
  nombre: string;
  equipo: string;        // equipo real
  posicion: 'portero' | 'defensa' | 'centrocampista' | 'delantero';
  puntuacionJornada: number;
  puntuacionTotal: number;
  precio: number;
  estado: 'disponible' | 'lesionado' | 'sancionado';
  titular: boolean;      // en el once del usuario
}

export interface IClasificacionFantasy {
  posicion: number;
  equipo: string;
  propietario: string;
  puntos: number;
  pj: number;
}
```

### Datos mock

Archivo: `src/app/core/data/fantasy.data.ts`
- 1 equipo fantasy del usuario con 11 jugadores + 4 reservas
- Clasificación fantasy con 8 equipos

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
FantasyDashboardComponent                    (features/fantasy/dashboard/fantasy-dashboard.component)
├── NavbarDarkComponent                      (shared)
├── FantasyDashboardHeroComponent            (features/fantasy/dashboard/components/hero)
│   └── — puntuación jornada + posición liga
├── FantasyDashboardEquipoComponent          (features/fantasy/dashboard/components/equipo-resumen)
│   └── PlayerCardComponent (x11+4)          (shared — modo puntuación)
├── FantasyDashboardClasificacionComponent   (features/fantasy/dashboard/components/clasificacion)
└── FooterComponent                          (shared)
```

---

## Estados a implementar

- [ ] **Cargando** — skeleton del dashboard
- [ ] **Vacío** — el usuario no tiene equipo creado aún
- [ ] **Error** — fallo de servicio
- [ ] **Poblado** — dashboard completo

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Ver `screens/dashboard-movil.html` |
| `≥ 768px` | Ver `screens/dashboard-fantasy-league-escritorio.html` |

Tema: **oscuro** — fondo `$color-base`, cards `$color-structure`, puntuaciones `$color-action`.

---

## Criterios de aceptación

- [ ] La ruta `/fantasy/dashboard` carga el componente
- [ ] `/fantasy` redirige a `/fantasy/dashboard`
- [ ] El tema oscuro se aplica correctamente (fondo `$color-base`)
- [ ] Se muestra la puntuación de la jornada en `$color-action`
- [ ] Se muestra la posición en la liga fantasy
- [ ] El equipo del usuario aparece con puntuaciones individuales
- [ ] Los jugadores lesionados/sancionados tienen indicador visual
- [ ] Los colores usan variables SCSS
- [ ] Estado de carga con skeleton
- [ ] Compilación sin errores

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.
> Los badges de puntuación usan `$color-action` (#FFD600) SIEMPRE sobre fondo oscuro — ver regla 1 de DESIGN.md.
