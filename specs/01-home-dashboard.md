# Home Dashboard (Web Informativa) — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `01-home-dashboard` |
| **Status** | `draft` |
| **Módulo** | `web-informativa` |
| **Prioridad** | `alta` |
| **Mockup** | `screens/dashboard-escritorio-nueva.html`, `screens/dashboard-escritorio-2.html`, `screens/dashboard-movil.html` |
| **Dependencias** | `00-architecture` |

---

## Overview

Página pública de entrada a la liga. Muestra el estado actual de la competición: próximos partidos, últimos resultados, tabla de clasificación resumida y destacados de la jornada. Es la carta de presentación de la liga para visitantes.

---

## En scope

- Hero con nombre de la liga y jornada actual
- Próximos partidos (máx. 3)
- Últimos resultados (máx. 3)
- Mini-clasificación (top 5)
- Navbar modo claro
- Footer

## Fuera de scope

- Autenticación / login (no hay auth en este sprint)
- Noticias / blog
- Estadísticas individuales de jugadores (eso es `/clasificacion`)

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/` | `HomeComponent` | lazy loaded, tema claro |

---

## Modelo de datos

> Revisar y completar al refinar la spec antes de implementar.

```typescript
export interface IPartido {
  id: string;
  equipoLocal: string;
  equipoVisitante: string;
  golesLocal?: number;
  golesVisitante?: number;
  fecha: Date;
  jornada: number;
  estado: 'pendiente' | 'jugado';
}

export interface IClasificacionEntry {
  posicion: number;
  equipo: string;
  puntos: number;
  pj: number;  // partidos jugados
  pg: number;  // ganados
  pe: number;  // empatados
  pp: number;  // perdidos
  gf: number;  // goles favor
  gc: number;  // goles contra
}
```

### Datos mock

Archivo: `src/app/core/data/partidos.data.ts`
- 3 partidos pendientes (próxima jornada)
- 3 partidos jugados (última jornada)

Archivo: `src/app/core/data/clasificacion.data.ts`
- 8 equipos con todos los campos

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
HomeComponent                     (features/home/home.component)
├── NavbarLightComponent           (shared/components/navbar/navbar-light)
├── HomeHeroComponent              (features/home/components/home-hero)
├── HomeProximosPartidosComponent  (features/home/components/home-proximos-partidos)
│   └── PartidoCardComponent       (features/home/components/partido-card)
├── HomeResultadosComponent        (features/home/components/home-resultados)
│   └── PartidoCardComponent       (reutiliza el mismo)
├── HomeMiniClasificacionComponent (features/home/components/home-mini-clasificacion)
└── FooterComponent                (shared/components/footer)
```

---

## Estados a implementar

- [ ] **Cargando** — skeleton en las secciones de partidos y clasificación
- [ ] **Vacío** — mensaje si no hay partidos programados
- [ ] **Error** — mensaje de error si el servicio falla
- [ ] **Poblado** — estado normal

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Ver `screens/dashboard-movil.html` |
| `≥ 768px` | Ver `screens/dashboard-escritorio-nueva.html` |

Tema: **claro** — fondo `$color-light`, títulos `$color-identity`, navbar `$color-structure`.

---

## Criterios de aceptación

- [ ] La ruta `/` carga `HomeComponent`
- [ ] El diseño coincide con el mockup en escritorio
- [ ] El diseño coincide con el mockup en móvil
- [ ] Los colores usan variables SCSS, no HEX hardcodeados
- [ ] Se muestran los próximos 3 partidos
- [ ] Se muestran los últimos 3 resultados
- [ ] Se muestra la mini-clasificación con top 5
- [ ] El estado de carga muestra skeletons
- [ ] Compilación sin errores ni warnings de TypeScript

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.