# Liga Verano Alameda

Aplicación web para la Liga de Fútbol Sala Alameda. Combina una **web informativa pública** con un **módulo Fantasy privado** para gestionar equipos, fichajes y puntuaciones.

---

## Módulos

### Web informativa (modo claro)
Vista pública sin necesidad de login. Muestra la clasificación, resultados, estadísticas y fichas de equipos y jugadores reales de la liga.

### Módulo Fantasy (requiere login)
Panel privado para la competición fantasy. Gestión del equipo, mercado de fichajes, puntuaciones por jornada y clasificación fantasy.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular (standalone components, Signals, Tailwind CSS v4) |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS v4 con tokens de diseño en `styles.css` |
| Iconos | Material Symbols Outlined |
| Fuente | Chivo (Google Fonts) |
| Auth | Supabase Auth (email/contraseña + Google OAuth) |
| Base de datos | Supabase (PostgreSQL) |
| Backend | Python + FastAPI |

---

## Estructura del repositorio

```
LigaVerano/
├── web/                    # App Angular
│   └── src/app/
│       ├── core/           # Modelos, servicios, datos mock
│       ├── shared/         # Componentes reutilizables (navbar, footer, player-card)
│       └── features/       # Una carpeta por pantalla
├── specs/                  # Especificaciones de cada feature
├── screens/                # Mockups HTML de referencia
└── DESIGN.md               # Tokens de color y reglas de diseño
```

---

## Arrancar en desarrollo

```bash
cd web
npm install
ng serve
```

Abre `http://localhost:4200`

---

## Specs

Cada feature tiene su spec en `specs/`. El agente lee la spec antes de escribir código. El estado de cada spec refleja si la UI está implementada o pendiente.

| ID | Spec | Estado | Notas |
|---|---|---|---|
| `00` | [Arquitectura](specs/00-architecture.md) | ✅ listo | Decisiones de stack, estructura y tokens de diseño |
| `01` | [Home / Dashboard](specs/01-home-dashboard.md) | ✅ implementado | Portada pública con próximos partidos y clasificación |
| `02` | [Clasificación](specs/02-clasificacion.md) | ✅ implementado | Tabla de clasificación de la liga |
| `03` | [Fantasy Dashboard](specs/03-fantasy-dashboard.md) | ✅ implementado | Panel principal del módulo fantasy |
| `04` | [Mercado](specs/04-mercado.md) | ✅ implementado | Grid de jugadores con filtros y acción de fichaje |
| `05` | [Mi Equipo](specs/05-mi-equipo.md) | ✅ implementado | Alineación visual en campo + gestión de reservas |
| `06` | [Ajustes](specs/06-ajustes.md) | ✅ implementado | Perfil, notificaciones, configuración de liga |
| `07` | [Equipos](specs/07-equipos.md) | ✅ implementado | Listado de equipos y página de detalle |
| `08` | [Autenticación](specs/08-auth.md) | 🔲 pendiente | Login, registro, Google OAuth vía Supabase, guards |
| `09` | [Backend Python](specs/09-backend.md) | 🔲 pendiente | FastAPI + Supabase, verificación JWT, endpoints |

### Convención de estados

| Estado | Significado |
|---|---|
| ✅ implementado | UI Angular completa y funcionando |
| 🔲 pendiente | Spec escrita, pendiente de implementar |
| 🚧 en progreso | Implementación en curso |

---

## Rutas

| Ruta | Descripción | Auth |
|---|---|---|
| `/` | Home con próximos partidos | Pública |
| `/clasificacion` | Tabla de la liga | Pública |
| `/equipos` | Listado de equipos | Pública |
| `/equipos/:id` | Detalle de equipo | Pública |
| `/fantasy/dashboard` | Panel fantasy | 🔒 Requiere login |
| `/fantasy/mi-equipo` | Mi equipo | 🔒 Requiere login |
| `/fantasy/mercado` | Mercado de fichajes | 🔒 Requiere login |
| `/ajustes` | Ajustes de cuenta | 🔒 Requiere login |
| `/auth/login` | Login | Pública |
| `/auth/register` | Registro | Pública |
| `/auth/callback` | Callback OAuth Google | Pública |

> Las rutas `/fantasy/**` estarán protegidas por `authGuard` una vez implementada la spec `08-auth`.

---

## Diseño

Los tokens de color, tipografía y espaciado están definidos en [`DESIGN.md`](DESIGN.md) y en `web/src/styles.css` dentro del bloque `@theme`. **Nunca hardcodear colores HEX en los templates** — usar siempre clases Tailwind con los tokens.

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#C0552A` | Terracota — identidad, títulos, botones |
| `secondary` | `#FFD600` | Amarillo — solo sobre `tertiary` o `on-background` |
| `tertiary` | `#1A4A2E` | Verde — navbar, acentos |
| `background` | `#F5F0E8` | Fondo modo claro |
| `on-background` | `#0F1923` | Texto principal |
| `surface` | `#ffffff` | Cards |
| `outline` | `rgba(192,85,42,0.3)` | Bordes |
