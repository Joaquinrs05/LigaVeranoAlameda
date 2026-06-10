# Admin y Alineaciones — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `11-admin-y-alineaciones` |
| **Status** | `done` |
| **Módulo** | `admin` + `admin-equipo` + `fantasy/mi-equipo` |
| **Prioridad** | `media` |
| **Dependencias** | `08-auth`, `09-backend`, `10-backend-full`, `05-mi-equipo` |

---

## Roles de administrador

El sistema tiene **dos roles de admin completamente independientes**:

| Rol | Quién | Acceso | Ruta |
|---|---|---|---|
| **Admin Global** | Nosotros (los creadores de la plataforma) | Flag `is_superadmin` en tabla `perfiles` | `/superadmin` |
| **Admin de Equipo (Entrenador)** | El responsable de un equipo real | Campo `entrenador_id` en tabla `equipos_reales` | `/equipo/admin` |

Cada rol tiene su propio guard, su propia ruta y su propio panel. No comparten interfaz.

---

## Parte A — Panel Admin Global (Superadmin)

### Contexto

El Admin Global somos nosotros: los que creamos y operamos la plataforma. Desde este panel controlamos la estructura completa de la liga real: equipos, jugadores, jornadas, resultados y puntuaciones fantasy. Sin este panel, toda esa gestión requiere acceso directo a Supabase.

### Ruta y acceso

| Ruta | Componente raíz | Acceso |
|---|---|---|
| `/superadmin` | `SuperadminComponent` | Solo si `perfil.is_superadmin === true` |

- Si el usuario no tiene flag `is_superadmin` → redirigir a `/fantasy`
- Guard: `SuperadminGuard` comprueba `auth.usuario().is_superadmin`
- El flag `is_superadmin` **nunca** es modificable desde la propia app — solo vía Supabase directamente

### En scope — Parte A

- **Panel de ligas**: listar ligas reales de la temporada, crear nueva liga/temporada
- **Panel de equipos**: listar equipos, crear equipo nuevo, editar nombre, escudo/logo, asignar entrenador
- **Panel de jugadores**: listar todos los jugadores reales, crear jugador, editar nombre/dorsal/posición/equipo, dar de baja (soft delete)
- **Panel de jornadas**: listar, crear, cambiar estado (pendiente / en_curso / finalizada), abrir/cerrar mercado fantasy
- **Panel de resultados**: introducir marcador de cada partido de la jornada activa
- **Panel de puntuaciones**: introducir puntos por jugador en una jornada finalizada, calcular y publicar
- **Panel de participantes fantasy**: tabla de clasificación extendida de cualquier liga fantasy

### Fuera de scope — Parte A

- Edición de fotos de jugadores o equipos (eso es responsabilidad del entrenador)
- Gestión de alineaciones (eso es responsabilidad del entrenador)
- Acceso a ligas fantasy de usuarios (solo ve la tabla de clasificación)

---

### Árbol de componentes — Superadmin

```
SuperadminComponent                          (features/superadmin/superadmin.component)
├── NavbarLightComponent                     (shared)
├── SuperadminTabsComponent                  (features/superadmin/components/tabs)
│   — tabs: Equipos | Jugadores | Jornadas | Resultados | Puntuaciones | Participantes
│
├── [tab: Equipos] SuperadminEquiposComponent
│   ├── Tabla: nombre | escudo | entrenador asignado | nº jugadores
│   ├── Botón "Nuevo equipo" → modal con nombre + upload escudo
│   └── Por cada fila: botón editar (nombre, escudo, entrenador) + botón desactivar
│
├── [tab: Jugadores] SuperadminJugadoresComponent
│   ├── Buscador por nombre
│   ├── Filtro por equipo y posición
│   ├── Tabla: nombre | dorsal | equipo | posición | estado_fantasy | precio_fantasy
│   ├── Botón "Nuevo jugador" → modal con nombre, dorsal, equipo, posición
│   └── Por cada fila: selector estado (disponible/lesionado/sancionado) + input precio + botón editar + botón dar de baja
│
├── [tab: Jornadas] SuperadminJornadasComponent
│   ├── Lista de jornadas con estado badge (pendiente / en_curso / finalizada)
│   ├── Botón "Iniciar jornada" (pendiente → en_curso)
│   ├── Botón "Finalizar jornada" (en_curso → finalizada)
│   ├── Toggle "Mercado abierto / cerrado" (solo visible cuando jornada en_curso)
│   └── Botón "Crear nueva jornada" (solo si no hay ninguna en_curso)
│
├── [tab: Resultados] SuperadminResultadosComponent
│   ├── Lista de partidos de la jornada activa (o última finalizada)
│   ├── Por cada partido: inputs goles_local / goles_visitante
│   └── Botón "Guardar resultados"
│
├── [tab: Puntuaciones] SuperadminPuntuacionesComponent
│   ├── Selector de jornada (solo finalizadas)
│   ├── Por cada jugador: input puntos obtenidos en esa jornada
│   ├── Botón "Calcular y publicar" → llama endpoint que actualiza puntos_total de miembros
│   └── Indicador de estado: publicado / pendiente
│
└── [tab: Participantes] SuperadminParticipantesComponent
    ├── Selector de liga fantasy (dropdown con todas las ligas activas)
    └── Tabla: posición | nombre equipo | manager | puntos_total | presupuesto | nº jugadores
```

---

### Endpoints backend necesarios — Parte A

Todos bajo `/superadmin` con guard que verifica `is_superadmin`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/superadmin/equipos` | Tabla `equipos` completa |
| `POST` | `/superadmin/equipos` | Crear equipo nuevo en `equipos` |
| `PATCH` | `/superadmin/equipos/{id}` | Editar nombre, escudo_url, entrenador_id |
| `GET` | `/superadmin/jugadores` | Tabla `jugadores` completa con estado y precio |
| `POST` | `/superadmin/jugadores` | Crear jugador nuevo en `jugadores` |
| `PATCH` | `/superadmin/jugadores/{id}` | Editar datos, estado_fantasy, precio_fantasy |
| `DELETE` | `/superadmin/jugadores/{id}` | Soft delete (activo = false) |
| `GET` | `/superadmin/jornadas` | Lista jornadas con estado y mercado_activo |
| `POST` | `/superadmin/jornadas` | Crear nueva jornada |
| `PATCH` | `/superadmin/jornadas/{id}` | Cambiar estado o mercado_activo |
| `GET` | `/superadmin/partidos` | Partidos de la jornada activa |
| `PATCH` | `/superadmin/partidos/{id}` | Actualizar resultado (goles_local, goles_visitante) |
| `POST` | `/superadmin/ligas/{liga_id}/puntuaciones` | Calcular y publicar puntos de jornada |
| `GET` | `/superadmin/ligas/{liga_id}/participantes` | Clasificación extendida de una liga fantasy |

---

### Criterios de aceptación — Parte A

- [ ] La ruta `/superadmin` es inaccesible para usuarios sin flag `is_superadmin`
- [ ] Se puede crear un equipo nuevo con nombre y escudo
- [ ] Se puede asignar un entrenador (por email o ID) a un equipo
- [ ] Se puede crear un jugador nuevo con nombre, dorsal, equipo y posición
- [ ] Se puede editar nombre, posición y dorsal de un jugador existente
- [ ] Se puede cambiar el estado fantasy de un jugador (disponible/lesionado/sancionado)
- [ ] Se puede cambiar el precio fantasy de un jugador
- [ ] Se puede dar de baja (soft delete) a un jugador
- [ ] El buscador de jugadores filtra en tiempo real
- [ ] Se puede crear una nueva jornada cuando no hay ninguna `en_curso`
- [ ] Se puede iniciar y finalizar una jornada
- [ ] El toggle de mercado solo aparece cuando la jornada está `en_curso`
- [ ] Se pueden introducir y guardar resultados de partidos
- [ ] Se pueden publicar puntuaciones de una jornada finalizada
- [ ] La tabla de participantes muestra posición, puntos y presupuesto actualizados
- [ ] Compilación sin errores TypeScript

---

## Parte A2 — Panel Admin de Equipo (Entrenador)

### Contexto

Cada equipo real de la liga tiene un entrenador responsable. Este entrenador accede a un panel privado donde gestiona todo lo visual y táctico de su equipo: la foto del equipo, las fotos de sus jugadores, las posiciones de cada jugador y la alineación oficial para cada jornada.

El entrenador **no puede** crear ni eliminar jugadores (eso es del superadmin), pero sí puede personalizar completamente la presentación de su equipo.

### Ruta y acceso

| Ruta | Componente raíz | Acceso |
|---|---|---|
| `/equipo/admin` | `EquipoAdminComponent` | Solo si `perfil.uid === equipo.entrenador_id` |

- Si el usuario no es entrenador de ningún equipo → redirigir a `/`
- Guard: `EntrenadorGuard` que comprueba que existe un equipo donde `entrenador_id === auth.usuario().uid`
- Un usuario solo puede ser entrenador de un equipo a la vez

### En scope — Parte A2

- **Foto del equipo**: subir/reemplazar imagen que aparece en la web informativa y en el perfil del equipo
- **Fotos de jugadores**: subir foto individual para cada jugador de la plantilla
- **Posición de jugadores**: editar la posición (Portero / Defensa / Centrocampista / Delantero) de cada jugador de su equipo
- **Dorsal de jugadores**: editar el dorsal de cada jugador
- **Alineación oficial**: seleccionar los titulares de la jornada activa, elegir formación y guardar

### Fuera de scope — Parte A2

- Crear o eliminar jugadores (solo superadmin)
- Cambiar el nombre del equipo (solo superadmin)
- Modificar estado_fantasy ni precio_fantasy (solo superadmin)
- Gestionar otras jornadas que no sean la activa para la alineación
- Ver datos de otros equipos

---

### Árbol de componentes — Admin Equipo

```
EquipoAdminComponent                         (features/equipo-admin/equipo-admin.component)
├── NavbarLightComponent                     (shared)
├── EquipoAdminTabsComponent                 (features/equipo-admin/components/tabs)
│   — tabs: Plantilla | Alineación | Equipo
│
├── [tab: Plantilla] EquipoAdminPlantillaComponent
│   ├── Tabla de jugadores del equipo: foto | dorsal | nombre | posición
│   ├── Por cada jugador:
│   │   ├── Click en foto → file picker para subir nueva foto del jugador
│   │   ├── Selector posición (Portero / Defensa / Centrocampista / Delantero)
│   │   └── Input dorsal (número)
│   └── Botón "Guardar cambios"
│
├── [tab: Alineación] EquipoAdminAlineacionComponent
│   ├── Selector de formación (mismas 5 formaciones de la Parte B)
│   ├── Campo visual con slots por fila según formación
│   ├── Drag-and-drop de jugadores de la plantilla a los slots del campo
│   ├── Lista de suplentes (jugadores no en el XI)
│   ├── Indicador: jornada activa o "sin jornada activa"
│   └── Botón "Guardar alineación"
│
└── [tab: Equipo] EquipoAdminEquipoComponent
    ├── Vista previa de la foto actual del equipo
    ├── Botón "Cambiar foto" → file picker para subir nueva foto del equipo
    ├── Nombre del equipo (solo lectura, no editable por entrenador)
    └── Botón "Guardar"
```

---

### Modelo de datos adicionales — Parte A2

```typescript
// Tabla equipos — nuevos campos a añadir
interface IEquipo {
  id: string;
  nombre: string;
  escudo_url: string | null;    // gestionado por superadmin
  foto_url: string | null;      // gestionado por entrenador — ADD COLUMN
  entrenador_id: string | null; // FK a perfiles.uid — ADD COLUMN
}

// Tabla jugadores — nuevos campos a añadir
interface IJugador {
  id: string;
  nombre: string;
  dorsal: number;
  equipo_id: string;
  posicion: 'portero' | 'defensa' | 'centrocampista' | 'delantero';
  foto_url: string | null;       // gestionado por entrenador — ADD COLUMN
  estado_fantasy: 'disponible' | 'lesionado' | 'sancionado';
  precio_fantasy: number;
  activo: boolean;
}

// Nueva tabla: alineaciones_oficiales
interface IAlineacionOficial {
  id: string;
  equipo_id: string;
  jornada_id: string;
  formacion: '1-2-2-2' | '1-3-2-1' | '1-2-3-1' | '1-3-1-2' | '1-1-3-2';
  titulares: string[];   // array de jugador_id, ordenado por fila (POR, DEF, MC, DEL)
  suplentes: string[];   // array de jugador_id
  publicada: boolean;
}
```

---

### Endpoints backend necesarios — Parte A2

Todos bajo `/equipo-admin` con guard que verifica que el usuario es `entrenador_id` del equipo.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/equipo-admin/mi-equipo` | Datos del equipo del entrenador autenticado |
| `POST` | `/equipo-admin/mi-equipo/foto` | Upload foto del equipo (multipart) |
| `GET` | `/equipo-admin/mi-equipo/jugadores` | Plantilla completa del equipo |
| `PATCH` | `/equipo-admin/jugadores/{id}` | Editar posición y/o dorsal |
| `POST` | `/equipo-admin/jugadores/{id}/foto` | Upload foto del jugador (multipart) |
| `GET` | `/equipo-admin/mi-equipo/alineacion` | Alineación oficial de la jornada activa |
| `PUT` | `/equipo-admin/mi-equipo/alineacion` | Guardar/reemplazar alineación oficial |

---

### Criterios de aceptación — Parte A2

- [ ] La ruta `/equipo/admin` es inaccesible para usuarios sin `entrenador_id` en ningún equipo
- [ ] El entrenador ve únicamente los jugadores de su equipo
- [ ] Se puede subir/reemplazar la foto del equipo
- [ ] Se puede subir/reemplazar la foto de cada jugador individualmente
- [ ] Se puede cambiar la posición de un jugador de la plantilla
- [ ] Se puede cambiar el dorsal de un jugador
- [ ] Se puede seleccionar la formación y colocar jugadores en el campo (drag-and-drop o click-to-assign)
- [ ] La alineación se guarda correctamente vinculada a la jornada activa
- [ ] Si no hay jornada activa, la tab de Alineación muestra un mensaje informativo y deshabilita el guardado
- [ ] Las fotos subidas aparecen reflejadas en la web informativa del equipo
- [ ] Compilación sin errores TypeScript

---

## Parte B — Alineaciones en Mi Equipo (Fantasy)

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
