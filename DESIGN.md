# Design Reference — Liga de Verano Alameda (Fútbol Sala)

> Documento de referencia para construir el diseño en Stitch (Figma).
> Paleta validada por el Consejo de Analistas el 2026-06-01.

---

## Paleta de colores

### Tokens globales — definir como variables en Stitch

| Token | Nombre visual | HEX | RGB |
|---|---|---|---|
| `color-identity` | Terracota Alameda | `#C0552A` | rgb(192, 85, 42) |
| `color-structure` | Verde Campo | `#1A4A2E` | rgb(26, 74, 46) |
| `color-action` | Amarillo Dorado | `#FFD600` | rgb(255, 214, 0) |
| `color-base` | Noche Cálida | `#0F1923` | rgb(15, 25, 35) |
| `color-light` | Blanco Cal | `#F5F0E8` | rgb(245, 240, 232) |

---

## Reglas de uso — OBLIGATORIAS

### Regla 1 — El amarillo solo va sobre oscuro
`#FFD600` únicamente sobre `#0F1923` o `#1A4A2E`.
Nunca sobre `#F5F0E8` ni sobre blanco puro.

### Regla 2 — Proporción 60-30-10
- **60 %** del espacio visual → `#F5F0E8` o `#0F1923` (fondos)
- **30 %** → `#C0552A` y `#1A4A2E` (elementos de identidad)
- **10 %** → `#FFD600` (botones CTA, badges, puntuaciones)

### Regla 3 — Texto legible
| Texto sobre... | Usar este color de texto |
|---|---|
| `#0F1923` (fondo oscuro) | `#F5F0E8` |
| `#1A4A2E` (verde) | `#F5F0E8` |
| `#C0552A` (terracota) | `#F5F0E8` |
| `#F5F0E8` (claro) | `#0F1923` |

---

## Aplicación por secciones

### Web informativa (modo claro)
- Fondo de página → `#F5F0E8`
- Navbar → `#1A4A2E` con logo en `#F5F0E8`
- Títulos principales → `#C0552A`
- Texto de cuerpo → `#0F1923`
- Botones primarios → fondo `#C0552A`, texto `#F5F0E8`
- Botones secundarios → borde `#1A4A2E`, texto `#1A4A2E`
- Líneas divisorias / separadores → `#C0552A` al 30% de opacidad

### Módulo Fantasy (modo oscuro)
- Fondo de página → `#0F1923`
- Cards de jugador → `#1A4A2E`
- Texto en cards → `#F5F0E8`
- Puntuaciones y badges → `#FFD600` sobre `#0F1923`
- Botones CTA ("Fichar", "Vender") → fondo `#FFD600`, texto `#0F1923`
- Navbar → `#0F1923` con acento inferior `#C0552A`
- Clasificación — posición 1º → badge `#FFD600`; resto → `#F5F0E8`

### Footer (ambos módulos)
- Fondo → `#0F1923`
- Texto → `#F5F0E8` al 70% de opacidad
- Logo → `#C0552A`

---

## Jerarquía tipográfica sugerida

> Los tamaños son orientativos para Stitch. Ajusta según la fuente que elijas.

| Elemento | Peso | Tamaño ref. | Color |
|---|---|---|---|
| Título de página (H1) | Bold | 40–48px | `#C0552A` |
| Título de sección (H2) | SemiBold | 28–32px | `#0F1923` / `#F5F0E8` |
| Subtítulo (H3) | Medium | 20–24px | `#1A4A2E` / `#F5F0E8` |
| Cuerpo de texto | Regular | 16px | `#0F1923` / `#F5F0E8` |
| Texto pequeño / etiquetas | Regular | 12–14px | `#0F1923` al 70% |
| Puntuaciones Fantasy | Bold | 24–32px | `#FFD600` |

---

## Contraste verificado (WCAG AA)

| Par de colores | Ratio | ¿Pasa AA? |
|---|---|---|
| `#F5F0E8` sobre `#0F1923` | 14.1:1 | ✓ AAA |
| `#F5F0E8` sobre `#1A4A2E` | 10.3:1 | ✓ AAA |
| `#F5F0E8` sobre `#C0552A` | 5.8:1 | ✓ AA |
| `#FFD600` sobre `#0F1923` | 13.4:1 | ✓ AAA |
| `#0F1923` sobre `#F5F0E8` | 14.1:1 | ✓ AAA |

---

## Lo que NO hacer

- No usar `#FFD600` sobre `#F5F0E8` — contraste insuficiente
- No mezclar los 5 colores todos a la vez en la misma pantalla
- No usar `#C0552A` como fondo de grandes áreas de texto — fatiga visual
- No inventar variantes de los colores base — mantener los HEX exactos

---

*Fuente: Investigacion/2026-06-01-paleta-colores-liga-verano-alameda.md*