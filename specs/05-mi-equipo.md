# Mi Equipo — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `05-mi-equipo` |
| **Status** | `revision` |
| **Módulo** | `fantasy` |
| **Prioridad** | `alta` |
| **Mockup** | `screens/mi-equipo-escritorio.html`, `screens/mi-equipo-movil.html` |
| **Dependencias** | `00-architecture`, `03-fantasy-dashboard`, `04-mercado` |

---

## Overview

Pantalla de gestión del equipo fantasy del usuario. Muestra la alineación en formato campo de fútbol sala (visual), permite cambiar titulares por reservas, ver el valor total del equipo y acceder al mercado para vender jugadores.

---

## En scope

- Vista de campo con la alineación (11 titulares en posiciones)
- Panel de reservas (4 jugadores)
- Cambiar titular ↔ reserva
- Información de cada jugador: nombre, precio, puntuación
- Valor total del equipo y presupuesto disponible
- Acceso directo a mercado para vender

## Fuera de scope

- Editor de nombre del equipo
- Cambio de formación táctica (único esquema por ahora)

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/fantasy/mi-equipo` | `MiEquipoComponent` | lazy, tema oscuro |

---

## Modelo de datos

```typescript
// Reutiliza IEquipoFantasy e IJugadorFantasy de 03-fantasy-dashboard

export interface ICambioAlineacion {
  jugadorSaliente: string; // id
  jugadorEntrante: string; // id
}
```

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
MiEquipoComponent                       (features/fantasy/mi-equipo/mi-equipo.component)
├── NavbarDarkComponent                  (shared)
├── MiEquipoHeaderComponent              (features/fantasy/mi-equipo/components/header)
│   └── — nombre equipo + presupuesto + valor total
├── MiEquipoCampoComponent               (features/fantasy/mi-equipo/components/campo)
│   └── PlayerCardComponent (x11)        (shared — modo campo, posicionados en campo)
├── MiEquipoReservasComponent            (features/fantasy/mi-equipo/components/reservas)
│   └── PlayerCardComponent (x4)         (shared)
└── FooterComponent                      (shared)
```

---

## Estados a implementar

- [ ] **Cargando** — skeleton del campo
- [ ] **Vacío** — equipo sin jugadores (primer acceso)
- [ ] **Error** — fallo de servicio
- [ ] **Poblado** — equipo completo con alineación

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Ver `screens/mi-equipo-movil.html` — campo más compacto, cards pequeñas |
| `≥ 768px` | Ver `screens/mi-equipo-escritorio.html` — campo completo con más detalle |

Tema: **oscuro**. El campo visual usa `$color-structure` como fondo del césped.

---

## Criterios de aceptación

- [ ] La ruta `/fantasy/mi-equipo` carga el componente
- [ ] Los 11 titulares aparecen posicionados en el campo (según posición)
- [ ] Las 4 reservas aparecen en el panel inferior
- [ ] Se puede intercambiar un titular con una reserva (click en jugador → seleccionar sustituto)
- [ ] El valor total del equipo se calcula correctamente
- [ ] El presupuesto disponible se muestra
- [ ] Los jugadores lesionados/sancionados tienen indicador visual
- [ ] Los colores usan variables SCSS
- [ ] En móvil el campo es visible sin scroll horizontal
- [ ] Compilación sin errores

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.
> La vista de campo requiere posicionamiento CSS absoluto/grid. Definir las zonas en la spec antes de implementar.
