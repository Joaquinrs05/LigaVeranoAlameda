# Clasificación — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `02-clasificacion` |
| **Status** | `done` |
| **Módulo** | `web-informativa` |
| **Prioridad** | `alta` |
| **Mockup** | `screens/clasificacion-escritorio.html`, `screens/clasificacion-movil.html` |
| **Dependencias** | `00-architecture`, `01-home-dashboard` (shared navbar y footer) |

---

## Overview

Tabla completa de clasificación de la liga real. Muestra posición, equipo, puntos y estadísticas de todos los equipos. También puede incluir tabla de máximos goleadores.

---

## En scope

- Tabla de clasificación completa con todos los equipos
- Indicadores visuales de posiciones (1º con badge dorado, descenso en rojo, etc.)
- Navbar modo claro y footer

## Fuera de scope

- Filtrar por jornada
- Historial de resultados por equipo

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/clasificacion` | `ClasificacionComponent` | lazy loaded, tema claro |

---

## Modelo de datos

```typescript
// Reutiliza IClasificacionEntry de 01-home-dashboard
// Añadir si el mockup lo requiere:
export interface IGoleador {
  id: string;
  nombre: string;
  equipo: string;
  goles: number;
  posicion: string; // 'portero' | 'defensa' | 'centrocampista' | 'delantero'
}
```

### Datos mock

Archivo: `src/app/core/data/clasificacion.data.ts` (ya creado en arch spec)
- 8 equipos completos

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
ClasificacionComponent               (features/clasificacion/clasificacion.component)
├── NavbarLightComponent              (shared)
├── ClasificacionTablaComponent       (features/clasificacion/components/clasificacion-tabla)
│   └── ClasificacionFilaComponent    (features/clasificacion/components/clasificacion-fila)
├── [ClasificacionGoleadoresComponent] (si existe en mockup)
└── FooterComponent                   (shared)
```

---

## Estados a implementar

- [ ] **Cargando** — skeleton de la tabla
- [ ] **Vacío** — no hay datos de clasificación aún
- [ ] **Error** — fallo de servicio
- [ ] **Poblado** — tabla completa

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Ver `screens/clasificacion-movil.html` — posiblemente tabla horizontal scrollable |
| `≥ 768px` | Ver `screens/clasificacion-escritorio.html` |

Posición 1º: badge `$color-action` (#FFD600) sobre `$color-base`.

---

## Criterios de aceptación

- [ ] La ruta `/clasificacion` carga el componente
- [ ] La tabla muestra todos los equipos con posición, puntos y estadísticas
- [ ] La posición 1º tiene badge amarillo (`$color-action`)
- [ ] En móvil la tabla es horizontalmente scrollable (no rompe el layout)
- [ ] Los colores usan variables SCSS
- [ ] Estado de carga con skeleton
- [ ] Compilación sin errores

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.