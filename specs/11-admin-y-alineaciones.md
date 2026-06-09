# Admin y Alineaciones — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `11-admin-y-alineaciones` |
| **Status** | `draft` |
| **Módulo** | `admin` + `fantasy/mi-equipo` |
| **Prioridad** | `media` |
| **Dependencias** | `08-auth`, `09-backend`, `10-backend-full`, `05-mi-equipo` |

---

## Parte A — Vista de administración

### Contexto

El creador de una liga fantasy (campo `creador_id` en `ligas_fantasy`) necesita un panel para gestionar la liga: controlar jornadas, abrir/cerrar el mercado, introducir resultados, actualizar el estado de los jugadores reales y calcular puntuaciones. Sin este panel, toda esa gestión requiere acceso directo a Supabase.

### Ruta y acceso

| Ruta | Componente raíz | Acceso |
|---|---|---|
| `/admin` | `AdminComponent` | Solo si el usuario es `creador_id` de al menos una liga |

- Si el usuario no es admin de ninguna liga → redirigir a `/fantasy`
- Guard: `AdminGuard` que comprueba `fantasy.ligaActiva().creador_id === auth.usuario().uid`

### En scope — Parte A

- Panel de jornadas (listar, crear, cambiar estado, abrir/cerrar mercado)
- Panel de resultados (introducir marcador de cada partido de la jornada activa)
- Panel de jugadores (cambiar `estado_fantasy`: disponible / lesionado / sancionado)
- Panel de puntuaciones (calcular y publicar puntos de la jornada finalizada)
- Vista de participantes (tabla con todos los miembros de la liga, puntos y presupuesto)

### Fuera de scope — Parte A

- Gestión de equipos reales (nombres, escudos)
- Creación/eliminación de jugadores reales
- Múltiples ligas simultáneas en el panel (gestiona solo `ligaActiva`)
- Sistema de roles granular (solo creador = admin)

---

### Árbol de componentes — Admin

```
AdminComponent                          (features/admin/admin.component)
├── NavbarLightComponent                (shared)
├── AdminTabsComponent                  (features/admin/components/tabs)
│   — tabs: Jornada | Resultados | Jugadores | Puntuaciones | Participantes
│
├── [tab: Jornada] AdminJornadaComponent
│   ├── Lista de jornadas con estado badge (pendiente / en_curso / finalizada)
│   ├── Botón "Iniciar jornada" (pendiente → en_curso)
│   ├── Botón "Finalizar jornada" (en_curso → finalizada)
│   ├── Toggle "Mercado abierto / cerrado" (mercado_activo en jornada en_curso)
│   └── Botón "Crear nueva jornada" (solo si no hay ninguna en_curso)
│
├── [tab: Resultados] AdminResultadosComponent
│   ├── Lista de partidos de la jornada activa (o última finalizada)
│   ├── Por cada partido: inputs goles_local / goles_visitante
│   └── Botón "Guardar resultados"
│
├── [tab: Jugadores] AdminJugadoresComponent
│   ├── Buscador por nombre
│   ├── Filtro por posición y equipo
│   ├── Tabla: nombre | equipo | posición | estado_fantasy | precio_fantasy
│   └── Por cada fila: selector estado (disponible / lesionado / sancionado) + input precio
│
├── [tab: Puntuaciones] AdminPuntuacionesComponent
│   ├── Selector de jornada (solo finalizadas)
│   ├── Por cada jugador: input puntos obtenidos en esa jornada
│   ├── Botón "Calcular y publicar" → llama endpoint que actualiza puntos_total de miembros
│   └── Indicador de estado: publicado / pendiente
│
└── [tab: Participantes] AdminParticipantesComponent
    └── Tabla: posición | nombre equipo | manager | puntos_total | presupuesto | nº jugadores
```

---

### Endpoints backend necesarios — Parte A

Todos bajo `/admin` con guard que verifica que el usuario es `creador_id` de la liga.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/ligas/{liga_id}/jornadas` | Lista jornadas con estado y mercado_activo |
| `POST` | `/admin/ligas/{liga_id}/jornadas` | Crear nueva jornada |
| `PATCH` | `/admin/ligas/{liga_id}/jornadas/{id}` | Cambiar estado o mercado_activo |
| `GET` | `/admin/ligas/{liga_id}/partidos` | Partidos de la jornada activa |
| `PATCH` | `/admin/partidos/{id}` | Actualizar resultado (goles_local, goles_visitante) |
| `GET` | `/admin/jugadores` | Todos los jugadores reales con estado y precio |
| `PATCH` | `/admin/jugadores/{id}` | Actualizar estado_fantasy o precio_fantasy |
| `POST` | `/admin/ligas/{liga_id}/puntuaciones` | Calcular y publicar puntos de jornada |
| `GET` | `/admin/ligas/{liga_id}/participantes` | Tabla de clasificación extendida |

---

### Criterios de aceptación — Parte A

- [ ] La ruta `/admin` es inaccesible para usuarios que no sean creadores de liga
- [ ] Se puede crear una nueva jornada cuando no hay ninguna `en_curso`
- [ ] Se puede iniciar y finalizar una jornada
- [ ] El toggle de mercado solo aparece cuando la jornada está `en_curso`
- [ ] Se pueden introducir y guardar resultados de partidos
- [ ] Se puede cambiar el estado de un jugador (disponible/lesionado/sancionado)
- [ ] Se puede cambiar el precio fantasy de un jugador
- [ ] El buscador de jugadores filtra en tiempo real
- [ ] Se pueden publicar puntuaciones de una jornada finalizada
- [ ] La tabla de participantes muestra posición, puntos y presupuesto actualizados
- [ ] Compilación sin errores TypeScript

---

## Parte B — Alineaciones en Mi Equipo

### Contexto

Actualmente Mi Equipo usa formación fija 1-2-2-2 (fútbol 7). El usuario necesita poder elegir entre distintas formaciones para adaptar su equipo al estilo de juego. La elección de formación cambia el número de slots por fila en el campo, redistribuye los huecos vacíos, y ajusta la validación de posiciones.

### Formaciones disponibles (fútbol 7)

Los 7 titulares son siempre: 1 portero + 6 de campo. Las formaciones difieren en cómo se reparten esos 6.

| ID | Nombre | POR | DEF | MC | DEL |
|---|---|---|---|---|---|
| `1-2-2-2` | Equilibrada | 1 | 2 | 2 | 2 |
| `1-3-2-1` | Defensiva | 1 | 3 | 2 | 1 |
| `1-2-3-1` | Control | 1 | 2 | 3 | 1 |
| `1-3-1-2` | Contraataque | 1 | 3 | 1 | 2 |
| `1-1-3-2` | Ofensiva | 1 | 1 | 3 | 2 |

### En scope — Parte B

- Selector de formación visible en la cabecera de Mi Equipo
- El campo re-renderiza con el número correcto de slots por fila al cambiar formación
- La validación de slots respeta los límites de la formación activa
- Si al cambiar de formación un titular queda "sobrante" (p.ej. pasar de 3 DEF a 2 DEF con 3 DEF titulares), el sobrante se mueve automáticamente a reservas y se persiste
- La formación elegida se guarda en `localStorage` (no en backend por ahora)
- Nombre de la formación visible junto al selector

### Fuera de scope — Parte B

- Guardar formación en backend
- Restricciones de formación por jornada
- Formaciones con portero variable

### Cambios en `mi-equipo.component.ts`

```typescript
type Formacion = '1-2-2-2' | '1-3-2-1' | '1-2-3-1' | '1-3-1-2' | '1-1-3-2';

const FORMACIONES: Record<Formacion, { portero: number; defensa: number; centrocampista: number; delantero: number }> = {
  '1-2-2-2': { portero: 1, defensa: 2, centrocampista: 2, delantero: 2 },
  '1-3-2-1': { portero: 1, defensa: 3, centrocampista: 2, delantero: 1 },
  '1-2-3-1': { portero: 1, defensa: 2, centrocampista: 3, delantero: 1 },
  '1-3-1-2': { portero: 1, defensa: 3, centrocampista: 1, delantero: 2 },
  '1-1-3-2': { portero: 1, defensa: 1, centrocampista: 3, delantero: 2 },
};

// Signal de formación activa (persiste en localStorage)
readonly formacion = signal<Formacion>('1-2-2-2');

// Al cambiar formación: auto-demote titulares sobrantes y persistir
cambiarFormacion(f: Formacion): void { ... }
```

### Selector de formación — UI

- Posición: cabecera de Mi Equipo, junto al nombre del equipo
- Componente: `<select>` o pill-buttons con los 5 nombres de formación
- Al seleccionar: el campo se anima (re-render de slots), los sobrantes aparecen en reservas con un badge "movido a reservas" temporal

### Criterios de aceptación — Parte B

- [ ] El selector de formación aparece en la cabecera de Mi Equipo
- [ ] Cambiar formación re-renderiza el campo con el número correcto de slots
- [ ] Los slots vacíos respetan los límites de la formación activa
- [ ] La validación de swap y slot respeta la formación activa (no la formación fija 1-2-2-2)
- [ ] Al reducir slots de una posición, los titulares sobrantes pasan a reservas automáticamente
- [ ] La formación activa se persiste en `localStorage` y se restaura al volver a la página
- [ ] Con 0 jugadores de una posición, los slots vacíos siguen mostrándose
- [ ] Compilación sin errores TypeScript

---

## Parte C — Clasificación Fantasy

### Contexto

El dashboard muestra la clasificación de la liga fantasy inline, pero es limitada (máximo 5 entradas, sin detalle por equipo). Se necesita una vista dedicada con la tabla completa y la capacidad de ver el equipo de cualquier participante.

### Ruta y acceso

| Ruta | Componente raíz | Acceso |
|---|---|---|
| `/fantasy/clasificacion` | `ClasificacionFantasyComponent` | Autenticado + miembro de `ligaActiva` |
| `/fantasy/clasificacion/:miembroId` | `EquipoRivalComponent` | Autenticado + miembro de `ligaActiva` |

- Si `!enLiga` → redirigir a `/fantasy/dashboard`

### En scope — Parte C

- Tabla completa de clasificación de la `ligaActiva` (todos los participantes)
- Indicador visual del equipo propio (fila resaltada)
- Cada fila es navegable → va a `/fantasy/clasificacion/:miembroId`
- Vista de equipo rival: alineación en campo (solo lectura, sin drag) con titular/reserva
- Cabecera de equipo rival: nombre del equipo, puntos totales, presupuesto restante
- Código de invitación de la liga visible con botón copiar (para compartir fácil)
- Enlace a `/fantasy/ligas` para gestionar ligas

### Fuera de scope — Parte C

- Histórico de puntos por jornada
- Chat entre participantes
- Comparativa directa entre dos equipos

### Árbol de componentes — Parte C

```
ClasificacionFantasyComponent              (features/fantasy/clasificacion-fantasy)
├── NavbarLightComponent                   (shared)
├── Hero: nombre de la liga + código       (inline)
│   └── Botón copiar código de invitación
├── TablaClasificacionComponent            (inline)
│   ├── Cabecera: # | Equipo | Pts totales | Presupuesto
│   ├── @for fila de clasificacion()
│   │   ├── Badge posición (🥇 si es 1º)
│   │   ├── Nombre equipo + nombre manager
│   │   ├── Puntos totales (destacados en secondary si es el usuario)
│   │   ├── Presupuesto restante
│   │   └── Flecha → navega a /fantasy/clasificacion/:miembroId
│   └── Fila propia resaltada con bg-tertiary/5 + ring
└── FooterComponent                        (shared)

EquipoRivalComponent                       (features/fantasy/clasificacion-fantasy/equipo-rival)
├── NavbarLightComponent                   (shared)
├── Cabecera: nombre equipo + puntos + presupuesto
├── Campo de alineación (solo lectura)     — mismo layout que mi-equipo pero sin interacción
│   ├── Fila portero
│   ├── Fila defensas
│   ├── Fila centrocampistas
│   └── Fila delanteros
├── Lista de reservas (solo lectura)
└── FooterComponent                        (shared)
```

### Datos necesarios del backend

- `GET /fantasy/ligas/{liga_id}` — ya existe: devuelve `clasificacion[]` con `miembro_id`, `nombre_equipo`, `puntos_total`, `presupuesto`, `posicion`
- `GET /fantasy/ligas/{liga_id}/miembros/{miembro_id}/equipo` — **nuevo**: devuelve la plantilla de un miembro concreto (mismo formato que `mi-equipo`, pero de cualquier miembro de la liga)

#### Schema del nuevo endpoint

```python
# GET /fantasy/ligas/{liga_id}/miembros/{miembro_id}/equipo
# Guard: requiere que el usuario sea miembro de la liga (no solo el propietario del equipo)
# Respuesta: ApiResponse[list[PlantillaItemOut]]  (mismo schema que mi-equipo)
```

### Criterios de aceptación — Parte C

- [ ] La ruta `/fantasy/clasificacion` muestra la tabla completa de la liga activa
- [ ] La fila del usuario propio está visualmente diferenciada
- [ ] El código de invitación de la liga es visible y se puede copiar con un clic
- [ ] Cada fila navega a `/fantasy/clasificacion/:miembroId`
- [ ] `/fantasy/clasificacion/:miembroId` muestra el campo con la alineación del rival (solo lectura)
- [ ] La cabecera del equipo rival muestra nombre, puntos totales y presupuesto
- [ ] Si se intenta acceder sin estar en una liga, redirige a `/fantasy/dashboard`
- [ ] Compilación sin errores TypeScript
