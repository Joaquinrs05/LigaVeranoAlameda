# Arquitectura del Sistema — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `00-architecture` |
| **Status** | `done` |
| **Tipo** | Decisiones de arquitectura — implementar ANTES que cualquier feature |

---

## Decisiones fundamentales

### 1. Dos módulos, dos temas visuales

| Módulo | Modo | Clase en `<body>` | Ruta base |
|---|---|---|---|
| Web informativa | Claro | `theme-light` | `/` |
| Fantasy | Oscuro | `theme-dark` | `/fantasy` |

El cambio de tema lo gestiona el `AppComponent` en función de la ruta activa. Tailwind usa `darkMode: 'class'`, aplicado en el elemento raíz del módulo.

### 2. Routing — estructura lazy

```
/                         → HomeComponent              (lazy)
/clasificacion            → ClasificacionComponent     (lazy)
/equipos                  → EquiposComponent           (lazy)
/equipos/:id              → EquipoDetalleComponent     (lazy)
/fantasy                  → redirect → /fantasy/dashboard
/fantasy/dashboard        → FantasyDashboardComponent  (lazy)
/fantasy/mercado          → MercadoComponent           (lazy)
/fantasy/mi-equipo        → MiEquipoComponent          (lazy)
/ajustes                  → AjustesComponent           (lazy)
```

Cada ruta usa `loadComponent` (no `loadChildren` ya que todos son standalone).

### 3. Estructura de carpetas definitiva

```
web/src/
├── app/
│   ├── core/
│   │   ├── data/
│   │   │   ├── jugadores.data.ts
│   │   │   ├── partidos.data.ts
│   │   │   ├── equipos.data.ts
│   │   │   └── clasificacion.data.ts
│   │   ├── models/
│   │   │   ├── jugador.model.ts
│   │   │   ├── partido.model.ts
│   │   │   ├── equipo.model.ts
│   │   │   └── clasificacion.model.ts
│   │   └── services/
│   │       ├── jugadores.service.ts
│   │       ├── partidos.service.ts
│   │       └── fantasy.service.ts
│   ├── shared/
│   │   └── components/
│   │       ├── navbar/
│   │       │   ├── navbar-light/
│   │       │   └── navbar-dark/
│   │       ├── footer/
│   │       └── player-card/
│   ├── features/
│   │   ├── home/
│   │   ├── clasificacion/
│   │   ├── equipos/
│   │   │   └── equipo-detalle/
│   │   ├── fantasy/
│   │   │   ├── dashboard/
│   │   │   ├── mercado/
│   │   │   └── mi-equipo/
│   │   └── ajustes/
│   ├── app.component.ts
│   ├── app.component.html
│   └── app.routes.ts
├── index.html             # ← fuente Chivo + Material Symbols aquí
└── styles.css             # ← @import tailwindcss; globals mínimos
```

### 4. Tailwind v4 — diseño del sistema en CSS

Tailwind v4 usa configuración basada en CSS, no `tailwind.config.js`. Los tokens están en `web/src/styles.css` dentro del bloque `@theme`.

Archivo: `web/postcss.config.mjs`
```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

Archivo: `web/src/styles.css` (extracto de tokens clave):
```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary:       #C0552A;
  --color-secondary:     #FFD600;
  --color-tertiary:      #1A4A2E;
  --color-background:    #F5F0E8;
  --color-on-background: #0F1923;
  --color-surface:       #ffffff;
  --color-outline:       rgba(192, 85, 42, 0.3);

  --font-sans: 'Chivo', sans-serif;

  --text-display-lg: 3rem;       /* → text-display-lg */
  --text-headline-lg: 2rem;      /* → text-headline-lg */
  --text-headline-md: 1.25rem;   /* → text-headline-md */
  --text-body-lg: 1rem;          /* → text-body-lg */
  --text-body-md: 0.875rem;      /* → text-body-md */
  --text-label-bold: 0.75rem;    /* → text-label-bold */
  --text-data-mono: 0.875rem;    /* → text-data-mono */

  --radius-DEFAULT: 0.25rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  --spacing-margin-mobile: 1rem;
  --spacing-margin-desktop: 2rem;
}
```

**Cómo usar los tokens en templates Angular:**
- Colores: `bg-primary`, `text-secondary`, `border-tertiary`, `bg-background`
- Tipografía: `text-headline-lg font-bold`, `text-body-md font-normal`
- Espaciado: `p-md`, `px-margin-desktop`, `gap-sm`
- Dark mode: añadir clase `dark` en el elemento raíz del módulo fantasy

### 5. `index.html` — fuentes externas

```html
<!-- Google Fonts: Chivo -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600;700&display=swap" rel="stylesheet">
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

### 6. `styles.css` — globals

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Scrollbar custom */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #C0552A; border-radius: 3px; }

/* Glow utility reutilizable */
.glow-active { box-shadow: 0 4px 20px rgba(192, 85, 42, 0.1); }
```

### 7. Servicios de datos (mock)

Patrón de servicio — latencia simulada de 300ms para testear estados de carga:

```typescript
@Injectable({ providedIn: 'root' })
export class JugadoresService {
  readonly jugadores = signal<IJugador[]>([]);
  readonly loading   = signal(false);

  load(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.jugadores.set(JUGADORES_DATA);
      this.loading.set(false);
    }, 300);
  }
}
```

### 8. Componentes shared — implementar en sprint 0

| Componente | Pantallas | Mockup referencia |
|---|---|---|
| `NavbarLightComponent` | Home, Clasificación | `screens/dashboard-escritorio-2.html` |
| `NavbarDarkComponent` | Fantasy (todas) | `screens/dashboard-fantasy-league-escritorio.html` |
| `FooterComponent` | Todas | Cualquier mockup |
| `PlayerCardComponent` | Mercado, Mi Equipo | `screens/mercado-escritorio.html` |

### 9. Animaciones (roadmap futuro)

GSAP se añadirá en un sprint posterior solo para la web informativa (transiciones de entrada). **No instalar todavía.**

---

## Criterios de aceptación — Sprint 0

- [ ] `web/` scaffoldeado con Angular
- [ ] Tailwind CSS instalado y configurado con los tokens exactos del punto 4
- [ ] `index.html` con Chivo y Material Symbols
- [ ] `styles.css` con directivas Tailwind + globals
- [ ] `app.routes.ts` con todas las rutas lazy (componentes stub temporales)
- [ ] Modelos TypeScript creados para todas las entidades (jugador, partido, equipo, clasificacion)
- [ ] Servicios mock con datos de ejemplo (≥5 jugadores, ≥2 equipos, ≥1 jornada)
- [ ] `NavbarLightComponent` implementado con Tailwind
- [ ] `NavbarDarkComponent` implementado con Tailwind
- [ ] `FooterComponent` implementado
- [ ] `ng build` sin errores ni warnings de TypeScript

---

## Notas para el agente

- Los mockups usan el CDN de Tailwind — el proyecto usa Tailwind instalado vía npm, misma config.
- Los mockups NO son la fuente de verdad de colores: `DESIGN.md` y `tailwind.config.js` son los únicos refs.
- La fuente es Chivo (no Inter ni Oswald — esos eran de los mockups anteriores).
- `borderRadius` tiene todo a `0.25rem` — estética cuadrada, deliberada.
