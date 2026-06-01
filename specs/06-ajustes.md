# Ajustes — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `06-ajustes` |
| **Status** | `draft` |
| **Módulo** | `shared` |
| **Prioridad** | `baja` |
| **Mockup** | `screens/ajustes-escritorio.html` |
| **Dependencias** | `00-architecture` |

---

## Overview

Pantalla de configuración de la cuenta y preferencias del usuario. Al ser solo frontend sin backend, la mayoría de ajustes serán simulados (guardados en localStorage o estado mock).

---

## En scope

- Secciones de ajustes visibles en el mockup
- Formularios con validación visual
- Guardado simulado (localStorage o signal global)

## Fuera de scope

- Persistencia real (no hay backend)
- Cambio de contraseña real
- Notificaciones push reales

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/ajustes` | `AjustesComponent` | lazy |

---

## Modelo de datos

> Revisar el mockup para determinar qué secciones hay (perfil, notificaciones, privacidad, etc.).

```typescript
export interface IAjustesUsuario {
  nombre: string;
  email: string;
  notificaciones: {
    jornada: boolean;
    mercado: boolean;
    resultados: boolean;
  };
}
```

---

## Árbol de componentes

> Completar revisando el mockup antes de implementar.

```
AjustesComponent                      (features/ajustes/ajustes.component)
├── NavbarDarkComponent                (shared — verificar en mockup si es dark o light)
├── AjustesPerfilComponent             (features/ajustes/components/perfil)
├── AjustesNotificacionesComponent     (features/ajustes/components/notificaciones)
├── [otras secciones según mockup]
└── FooterComponent                    (shared)
```

---

## Estados a implementar

- [ ] **Cargando** — breve skeleton mientras se carga la configuración
- [ ] **Guardando** — feedback visual al guardar cambios
- [ ] **Guardado** — confirmación de éxito
- [ ] **Poblado** — formulario con datos actuales

---

## Diseño y responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Adaptación del escritorio (no hay mockup móvil — usar criterio del diseñador) |
| `≥ 768px` | Ver `screens/ajustes-escritorio.html` |

---

## Criterios de aceptación

- [ ] La ruta `/ajustes` carga el componente
- [ ] Las secciones del mockup están implementadas
- [ ] Los formularios tienen validación visual
- [ ] El botón guardar muestra feedback (spinner → confirmación)
- [ ] Los ajustes se persisten en localStorage entre recargas
- [ ] Los colores usan variables SCSS
- [ ] Compilación sin errores

---

## Notas para el agente

> Completar al refinar la spec tras leer el mockup.
> Al no haber mockup móvil, aplicar las mismas reglas responsive del resto de pantallas del módulo correspondiente.
