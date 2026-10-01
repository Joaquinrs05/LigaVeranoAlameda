# Liga Verano Alameda ⚽

Aplicación web completa para la Liga de Fútbol Sala Alameda: una **web pública** con calendario, clasificación y equipos de la liga, y un **juego Fantasy privado** en el que cada usuario gestiona su propio equipo con jugadores reales de la competición.

🔗 **Demo:** https://liga-verano-alameda.vercel.app  
👤 **Autor:** Joaquín Rodríguez Sánchez · [LinkedIn](https://linkedin.com/in/joaquin-rodriguez-sanchez) · [GitHub](https://github.com/Joaquinrs05) · joaquinrodsanchez@gmail.com

---

## En resumen

- **Proyecto full-stack de principio a fin:** diseño, frontend, API REST propia, base de datos, autenticación y despliegue.
- **De prototipo a aplicación desplegada** con demo pública.
- **Stack moderno:** Angular (Signals, standalone), TypeScript strict, Tailwind CSS v4, Python + FastAPI, PostgreSQL (Supabase), Docker.
- **Metodología spec-driven:** cada funcionalidad se define primero en una especificación escrita y después se implementa.

---

## Funcionalidades

### Web pública (sin registro)
- Portada con próximos partidos y resumen de la clasificación
- Clasificación completa de la liga
- Listado de equipos y ficha de detalle de cada equipo y sus jugadores

### Fantasy (con login)
- Registro e inicio de sesión con email/contraseña o **Google**
- **Mi equipo:** alineación visual sobre el campo y gestión de reservas
- **Mercado:** buscador de jugadores con filtros y fichajes
- **Dashboard:** puntuaciones por jornada y clasificación fantasy
- **Ajustes:** perfil, notificaciones y configuración de la liga

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Angular (standalone components, Signals) |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS v4 con design tokens propios |
| Backend | Python + FastAPI (API REST, verificación de JWT) |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth (email/contraseña + Google OAuth) |
| Despliegue | Docker · Vercel |
| UI | Material Symbols, tipografía Chivo |

---

## Arquitectura

```
LigaVerano/
├── web/                # Frontend Angular (SPA)
│   └── src/app/
│       ├── core/       # Modelos, servicios y guards
│       ├── shared/     # Componentes reutilizables (navbar, footer, player-card)
│       └── features/   # Una carpeta por pantalla
├── backend/            # API REST en FastAPI
├── specs/              # Especificación de cada funcionalidad
├── screens/            # Mockups HTML de referencia
└── DESIGN.md           # Sistema de diseño: colores, tipografía, reglas
```

- **Frontend y backend desacoplados:** la SPA en Angular consume la API REST propia en Python.
- **Separación clara** entre la parte pública (`/`, `/clasificacion`, `/equipos`) y la privada (`/fantasy/**`, `/ajustes`), protegida con `authGuard`.
- **Autenticación:** el frontend se autentica con Supabase y envía el JWT al backend, que lo verifica antes de servir los datos del Fantasy.
- **Sistema de diseño centralizado:** todos los colores salen de tokens definidos en `styles.css` (`@theme`), sin valores HEX en los templates.

---

## Proceso de desarrollo

El proyecto sigue un flujo **spec-driven**: antes de escribir código, cada funcionalidad tiene su especificación en `specs/`, con requisitos, pantallas y criterios. Así cada pieza está documentada y es fácil de mantener o ampliar.

| ID | Funcionalidad | Estado |
|---|---|---|
| 00 | [Arquitectura](specs/00-architecture.md) | ✅ |
| 01 | [Home](specs/01-home-dashboard.md) | ✅ |
| 02 | [Clasificación](specs/02-clasificacion.md) | ✅ |
| 03 | [Fantasy Dashboard](specs/03-fantasy-dashboard.md) | ✅ |
| 04 | [Mercado](specs/04-mercado.md) | ✅ |
| 05 | [Mi Equipo](specs/05-mi-equipo.md) | ✅ |
| 06 | [Ajustes](specs/06-ajustes.md) | ✅ |
| 07 | [Equipos](specs/07-equipos.md) | ✅ |
| 08 | [Autenticación](specs/08-auth.md) | ✅ |
| 09 | [Backend Python](specs/09-backend.md) | ✅ |

---

## Ejecutar en local

**Frontend**

```bash
cd web
npm install
ng serve        # http://localhost:4200
```

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload    # http://localhost:8000
```

Variables de entorno necesarias: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`.

---

## Diseño

Identidad visual propia, documentada en [`DESIGN.md`](DESIGN.md):

| Token | Color | Uso |
|---|---|---|
| `primary` | `#C0552A` terracota | Identidad, títulos, botones |
| `secondary` | `#FFD600` amarillo | Acentos sobre fondos oscuros |
| `tertiary` | `#1A4A2E` verde | Navbar, acentos |
| `background` | `#F5F0E8` | Fondo |
| `on-background` | `#0F1923` | Texto principal |
