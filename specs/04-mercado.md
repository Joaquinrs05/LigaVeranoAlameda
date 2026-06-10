# Mercado de Jugadores — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `04-mercado` |
| **Status** | `done` |
| **Módulo** | `fantasy` |
| **Prioridad** | `alta` |
| **Mockup** | `screens/mercado-escritorio.html`, `screens/mercado-movil.html` |
| **Dependencias** | `00-architecture`, `03-fantasy-dashboard` (modelos IJugadorFantasy) |

---

## Overview

Pantalla donde el usuario compra y vende jugadores para su equipo fantasy. Muestra el catálogo de jugadores disponibles con sus precios, rendimiento y estado. El usuario puede filtrar por posición, equipo o precio y fichar jugadores si tiene presupuesto.

---

## En scope

- Listado de todos los jugadores con precio y puntuación
- Filtros: por posición, por equipo, por precio (rango)
- Búsqueda por nombre
- Acción "Fichar" (añade al equipo si hay presupuesto)
- Acción "Vender" (desde el panel de mi equipo, posiblemente modal)
- Indicador de presupuesto disponible

## Fuera de scope

- Pujas / sistema de subasta (simplificado: precio fijo)
- Histórico de transacciones

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/fantasy/mercado` | `MercadoComponent` | lazy, tema oscuro |

---

## Modelo de datos

```typescript
// Reutiliza IJugadorFantasy de 03-fantasy-dashboard

export interface IFiltrosMercado {
  posicion: 'todos' | 'portero' | 'defensa' | 'centrocampista' | 'delantero';
  equipo: string | null;
  precioMax: number | null;
  busqueda: string;
}
```

### Datos mock

Reutiliza `src/app/core/data/fantasy.data.ts`
- Catálogo de al menos 20 jugadores con precio y estado

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
MercadoComponent                      (features/fantasy/mercado/mercado.component)
├── NavbarDarkComponent               (shared)
├── MercadoFiltrosComponent           (features/fantasy/mercado/components/filtros)
├── MercadoPresupuestoComponent       (features/fantasy/mercado/components/presupuesto)
├── MercadoListaComponent             (features/fantasy/mercado/components/lista)
│   └── PlayerCardComponent (x N)    (shared — modo mercado)
└── FooterComponent                   (shared)
```

---

## Estados a implementar

- [ ] **Cargando** — skeleton del listado
- [ ] **Vacío** — sin resultados para los filtros aplicados
- [ ] **Error** — fallo de servicio
- [ ] **Poblado** — listado con jugadores

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Ver `screens/mercado-movil.html` — listado vertical, filtros colapsables |
| `≥ 768px` | Ver `screens/mercado-escritorio.html` — sidebar de filtros + grid de cards |

Tema: **oscuro**. Botón "Fichar": fondo `$color-action`, texto `$color-base`.

---

## Criterios de aceptación

- [ ] La ruta `/fantasy/mercado` carga el componente
- [ ] Se muestran todos los jugadores disponibles
- [ ] El filtro por posición funciona
- [ ] La búsqueda por nombre filtra en tiempo real
- [ ] El botón "Fichar" está deshabilitado si no hay presupuesto suficiente
- [ ] El presupuesto disponible se actualiza tras fichar
- [ ] Los jugadores ya en el equipo muestran "En tu equipo" en lugar de "Fichar"
- [ ] En móvil los filtros son accesibles (no ocultos o inutilizables)
- [ ] Los colores usan variables SCSS
- [ ] Estado vacío con mensaje si no hay resultados
- [ ] Compilación sin errores

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.
> El estado del mercado (jugadores fichados, presupuesto) se gestiona en `FantasyService` con signals.
