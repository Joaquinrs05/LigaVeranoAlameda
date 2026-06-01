# Liga Verano Alameda — Instrucciones para Agentes

## Qué es este proyecto

Aplicación web para la Liga de Fútbol Sala Alameda. Tiene dos módulos diferenciados:

- **Web informativa** — vista pública, modo claro. Clasificación, resultados, estadísticas reales de la liga.
- **Módulo Fantasy** — panel privado, modo oscuro. Gestión de equipos fantasy, mercado de jugadores, puntuaciones.

El código Angular está en `web/`. Las specs en `specs/`. Los mockups HTML de referencia en `screens/`.

---

## Stack

- **Framework**: Angular (standalone components)
- **Lenguaje**: TypeScript strict (no `any`, no `as unknown`)
- **Estilos**: Tailwind CSS con tokens de diseño en `web/tailwind.config.js`
- **Estado**: Signals (`signal()`, `computed()`, `effect()`) — no RxJS para estado local
- **Backend**: Sin backend por ahora — datos mock en `web/src/app/core/data/`
- **Iconos**: Material Symbols Outlined (Google Fonts)
- **Fuente**: Chivo (Google Fonts) — única fuente del proyecto
- **Animaciones** (futuro): GSAP para transiciones de entrada en la web informativa

---

## Sistema de diseño — Tailwind tokens

La paleta viene del mockup `screens/dashboard-escritorio-2.html`. Los tokens están configurados en `tailwind.config.js`:

| Token Tailwind | HEX / valor | Uso |
|---|---|---|
| `primary` | `#C0552A` | Terracota — identidad, botones, títulos |
| `secondary` | `#FFD600` | Amarillo — CTAs, puntuaciones, badges |
| `tertiary` | `#1A4A2E` | Verde — navbar, cards fantasy |
| `background` | `#F5F0E8` | Fondo modo claro |
| `on-background` | `#0F1923` | Texto sobre fondo claro |
| `surface` | `#ffffff` | Cards modo claro |
| `on-surface` | `#0F1923` | Texto sobre cards |
| `outline` | `rgba(192,85,42,0.3)` | Bordes sutiles |

Clases de texto por escala: `text-display-lg`, `text-headline-lg`, `text-headline-md`, `text-body-lg`, `text-body-md`, `text-label-bold`, `text-data-mono`.

Espaciado custom: `p-xs` (4px), `p-sm` (8px), `p-md` (16px), `p-lg` (24px), `p-xl` (48px), `px-margin-mobile` (16px), `px-margin-desktop` (32px).

**Reglas de uso obligatorias — ver `DESIGN.md`:**
- `secondary` (#FFD600) SOLO sobre `tertiary` o `on-background` — nunca sobre `background`
- Proporción 60-30-10: fondos / identidad / acción
- El modo oscuro (fantasy) usa `on-background` (#0F1923) como fondo

---

## Cómo trabajar con las specs

Cada feature tiene su spec en `specs/`. **Antes de escribir una sola línea de código:**

1. Leer la spec completa de la feature (`specs/0X-nombre.md`)
2. Leer el mockup HTML de referencia en `screens/`
3. Consultar `DESIGN.md` si hay dudas de color o tipografía
4. Verificar que las specs dependientes están en status `done`
5. Implementar siguiendo el árbol de componentes de la spec — ni más ni menos
6. Marcar cada criterio de aceptación como `[x]` al completarlo
7. Cambiar `status` de la spec a `done` cuando todos los criterios estén marcados

**Si algo del mockup contradice DESIGN.md, prevalece DESIGN.md. Si algo es ambiguo, detente y pregunta.**

---

## Estructura del proyecto Angular (`web/`)

```
web/src/app/
├── core/
│   ├── data/          # Datos mock (.data.ts)
│   ├── models/        # Interfaces TypeScript
│   └── services/      # Servicios inyectables (providedIn: 'root')
├── shared/
│   └── components/
│       ├── navbar/
│       │   ├── navbar-light/
│       │   └── navbar-dark/
│       ├── footer/
│       └── player-card/
├── features/
│   ├── home/
│   ├── clasificacion/
│   ├── fantasy/
│   │   ├── dashboard/
│   │   ├── mercado/
│   │   └── mi-equipo/
│   └── ajustes/
├── app.component.ts
└── app.routes.ts
```

---

## Convenciones Angular

- **Standalone components siempre** — nunca `NgModule`
- **Signals** para todo estado reactivo — no `Subject` ni `BehaviorSubject`
- **Control flow nuevo**: `@if`, `@for`, `@switch` — nunca `*ngIf`, `*ngFor`
- **inject()** para DI — nunca constructor injection
- **Archivos**: un componente = `.ts` + `.html` en su carpeta (sin `.scss` separado — estilos en Tailwind)
- **Naming**: `feature-name.component.ts`, `feature-name.service.ts`, `IFeatureName` para interfaces
- **Sin comentarios** salvo que el WHY no sea obvio

---

## Lo que NO hacer

- No hardcodear colores HEX en templates — siempre clases Tailwind con los tokens
- No usar `*ngIf` ni `*ngFor`
- No usar `NgModule`
- No inventar componentes no especificados en el árbol de la spec correspondiente
- No usar `any` ni `as unknown`
- No añadir librerías de terceros sin que esté en la spec o aprobado explícitamente
- No instalar GSAP todavía — está marcado como futuro
