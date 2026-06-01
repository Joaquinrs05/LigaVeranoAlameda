# [Nombre de la Feature] — Spec

> Copia este template para cada nueva spec. Rellena todas las secciones antes de empezar a implementar.

---

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `0X-nombre` |
| **Status** | `draft` \| `ready` \| `in-progress` \| `done` |
| **Módulo** | `web-informativa` \| `fantasy` \| `shared` |
| **Prioridad** | `alta` \| `media` \| `baja` |
| **Mockup** | `screens/nombre-escritorio.html`, `screens/nombre-movil.html` |
| **Dependencias** | Lista de spec IDs que deben estar `done` antes |

---

## Overview

> Una o dos frases explicando QUÉ hace esta feature y POR QUÉ existe.

---

## En scope

- Item 1
- Item 2

## Fuera de scope

- Item A (motivo)
- Item B (motivo)

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/ruta` | `NombreComponent` | lazy loaded |

---

## Modelo de datos

> Define aquí todas las interfaces TypeScript que usa esta feature. Serán creadas en `src/app/core/models/`.

```typescript
export interface INombreEntidad {
  id: string;
  // ...
}
```

### Datos mock

> Describe qué datos mock hacen falta y dónde van (`src/app/core/data/nombre.data.ts`).

---

## Árbol de componentes

> El agente implementará EXACTAMENTE esta jerarquía. No añadir ni quitar componentes.

```
NombreComponent              (features/nombre/nombre.component)
├── SharedNavbarComponent    (shared/components/navbar)
├── NombreHeroComponent      (features/nombre/components/nombre-hero)
│   └── ...
├── NombreCardComponent      (features/nombre/components/nombre-card)
│   └── ...
└── SharedFooterComponent    (shared/components/footer)
```

---

## Estados a implementar

Cada componente con estado debe manejar todos los casos:

- [ ] **Cargando** — skeleton o spinner mientras llegan datos
- [ ] **Vacío** — cuando no hay datos que mostrar
- [ ] **Error** — cuando el servicio falla
- [ ] **Poblado** — estado normal con datos

---

## Diseño y responsive

> Describe las diferencias entre escritorio y móvil. Referencia siempre al mockup.

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` (móvil) | Ver `screens/nombre-movil.html` |
| `≥ 768px` (escritorio) | Ver `screens/nombre-escritorio.html` |

---

## Criterios de aceptación

> El agente marca `[x]` en cada ítem al completarlo. La spec pasa a `done` cuando todos están marcados.

- [ ] La ruta carga el componente raíz correctamente
- [ ] El diseño coincide con el mockup en escritorio
- [ ] El diseño coincide con el mockup en móvil
- [ ] Los tokens de color son variables SCSS (no HEX hardcodeados)
- [ ] El estado de carga muestra skeleton/spinner
- [ ] El estado vacío muestra mensaje adecuado
- [ ] Criterio específico de la feature 1
- [ ] Criterio específico de la feature 2

---

## Notas para el agente

> Decisiones tomadas, aclaraciones sobre el mockup, advertencias de implementación.

- ...