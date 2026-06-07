# Autenticación — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `08-auth` |
| **Status** | `done` |
| **Módulo** | `shared` |
| **Prioridad** | `alta` |
| **Mockup** | Sin mockup — diseñar desde cero siguiendo el sistema de diseño |
| **Dependencias** | `00-architecture` |

---

## Overview

Sistema de autenticación que protege el módulo Fantasy. La web informativa (home, clasificación, equipos) es pública. `/fantasy/**` requiere login.

**Stack de autenticación:**
- **Supabase Auth** gestiona identidades (email/contraseña + Google OAuth)
- **Python backend** recibe el JWT de Supabase en cada petición y lo verifica
- **Angular** usa `@supabase/supabase-js` para todo lo relacionado con sesiones

Supabase actúa como Identity Provider: emite JWTs firmados que el backend Python puede verificar sin llamar a Supabase en cada request.

---

## En scope

- Página de login (`/auth/login`) — email/contraseña + botón Google
- Página de registro (`/auth/register`) — nombre, email, contraseña, confirmar + botón Google
- `AuthCallbackComponent` (`/auth/callback`) — procesa el redirect de Google OAuth
- `AuthService` con signals — estado global de sesión
- `authGuard` — protege `/fantasy/**`, guarda `returnUrl`
- Persistencia automática de sesión (Supabase SDK la gestiona en `localStorage`)
- Envío del JWT en cada llamada al backend Python (`Authorization: Bearer <token>`)
- Logout

## Fuera de scope

- Recuperación de contraseña (solo enlace visual de momento)
- Verificación de email obligatoria (Supabase lo soporta, activar en Dashboard cuando haya backend)
- Roles / permisos avanzados
- Refresh token manual (Supabase SDK lo renueva automáticamente)

---

## Rutas

| Ruta | Componente raíz | Notas |
|---|---|---|
| `/auth/login` | `LoginComponent` | Redirige a `/fantasy/dashboard` si ya hay sesión |
| `/auth/register` | `RegisterComponent` | Redirige a `/fantasy/dashboard` si ya hay sesión |
| `/auth/callback` | `AuthCallbackComponent` | Destino del redirect de Google OAuth |

**Rutas protegidas** — añadir `canActivate: [authGuard]` en `app.routes.ts`:

```typescript
{
  path: 'fantasy',
  canActivate: [authGuard],
  children: [
    { path: 'dashboard',  loadComponent: ... },
    { path: 'mercado',    loadComponent: ... },
    { path: 'mi-equipo',  loadComponent: ... },
  ]
}
```

---

## Modelo de datos

```typescript
// core/models/auth.model.ts

export interface IUsuario {
  uid: string;           // Supabase user.id (UUID)
  nombre: string;        // user_metadata.full_name o user_metadata.name
  email: string;
  fotoPerfil: string | null;
  proveedor: 'email' | 'google';
}

export interface ICredencialesLogin {
  email: string;
  contrasena: string;
}

export interface ICredencialesRegistro {
  nombre: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
}
```

---

## Árbol de componentes

```
LoginComponent               (features/auth/login/login.component)
RegisterComponent            (features/auth/register/register.component)
AuthCallbackComponent        (features/auth/callback/auth-callback.component)

SupabaseService              (core/services/supabase.service)   ← cliente singleton
AuthService                  (core/services/auth.service)       ← providedIn: 'root'
authGuard                    (core/guards/auth.guard.ts)        ← functional guard
```

> Las tres pantallas de auth no usan `NavbarLightComponent` ni `FooterComponent`. Son páginas autónomas centradas.

---

## Diseño y responsive

```
┌────────────────────────────────────────┐
│  bg-background, patrón de rayas body   │
│                                        │
│   ⚽  Liga Verano Alameda              │
│       Temporada 2026                   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  bg-surface border border-outline│  │
│  │  rounded-lg shadow-sm  max-w-md  │  │
│  │                                  │  │
│  │  Bienvenido de vuelta            │  │
│  │  Accede a tu equipo fantasy      │  │
│  │                                  │  │
│  │  [───────── Email ───────────]   │  │
│  │  [──────── Contraseña ───────]   │  │
│  │                                  │  │
│  │  [ bg-primary  Iniciar sesión ]  │  │
│  │                                  │  │
│  │  ──────────── o ────────────     │  │
│  │                                  │  │
│  │  [G  Continuar con Google    ]   │  │
│  │                                  │  │
│  │  ¿No tienes cuenta? Regístrate   │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` | Card a casi todo el ancho (`mx-margin-mobile`) |
| `≥ 768px` | Card centrado `max-w-md mx-auto`, logo grande difuminado de fondo |

**Tokens:**
- Fondo página: `bg-background` (crema) con el patrón del body
- Card: `bg-surface border border-outline rounded-lg shadow-sm p-xl`
- Botón primario: `bg-primary text-background`
- Botón Google: `bg-white border border-outline text-on-background` + SVG oficial de Google
- Errores de campo: `text-red-500 text-[11px]`
- Error global: banner `bg-red-50 border border-red-200 text-red-700 rounded p-sm`

---

## Estados a implementar

- [ ] **Idle** — formulario vacío listo
- [ ] **Validando** — errores inline al perder foco o al submit
- [ ] **Cargando** — botón con spinner, inputs deshabilitados
- [ ] **Error de servidor** — banner de error bajo el formulario
- [ ] **Éxito** — redirige automáticamente (sin estado visual extra)

**AuthCallbackComponent:**
- [ ] **Procesando** — spinner "Autenticando con Google…"
- [ ] **Error** — mensaje si el callback falla + link a `/auth/login`

---

## Validaciones

| Campo | Regla |
|---|---|
| Email | Formato `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Contraseña | Mínimo 6 caracteres |
| Confirmar contraseña | Debe coincidir exactamente (solo en registro) |
| Nombre | Mínimo 2 caracteres (solo en registro) |

Errores inline bajo el campo en `text-red-500 text-[11px]`. Se activan en `(blur)` o en el primer intento de submit.

---

## Integración Supabase — Frontend Angular

### Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → nuevo proyecto
2. Guardar: `Project URL` y `anon/public key` (van a `environment.ts`)
3. En **Authentication → Providers → Google**: activar y añadir credenciales OAuth de Google Cloud Console
4. En **Authentication → URL Configuration**:
   - Site URL: `http://localhost:4200` (dev) / dominio de producción
   - Redirect URLs: `http://localhost:4200/auth/callback`

### Paso 2 — Credenciales Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Crear **OAuth 2.0 Client ID** (tipo: Web application)
3. Authorized redirect URIs: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
4. Copiar Client ID y Client Secret → pegarlos en Supabase Dashboard → Auth → Providers → Google

### Paso 3 — Instalar SDK

```bash
npm install @supabase/supabase-js
```

### Paso 4 — Variables de entorno

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl:     'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIs...',
  apiUrl:          'http://localhost:8000',    // Python backend
};
```

> La `anonKey` de Supabase es pública por diseño — Row Level Security (RLS) controla el acceso a los datos. Nunca usar la `service_role` key en el frontend.

### Paso 5 — SupabaseService (cliente singleton)

```typescript
// core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );
}
```

### Paso 6 — AuthService

```typescript
// core/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { IUsuario, ICredencialesLogin, ICredencialesRegistro } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router   = inject(Router);

  readonly usuario     = signal<IUsuario | null>(null);
  readonly cargando    = signal(true);
  readonly error       = signal<string | null>(null);
  readonly autenticado = computed(() => this.usuario() !== null);

  constructor() {
    // Restaurar sesión al arrancar (Supabase la guarda en localStorage)
    this.supabase.auth.getSession().then(({ data }) => {
      this.actualizarUsuario(data.session);
      this.cargando.set(false);
    });

    // Escuchar cambios de sesión (login, logout, token refresh)
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.actualizarUsuario(session);
    });
  }

  async loginConEmail(creds: ICredencialesLogin): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    const { error } = await this.supabase.auth.signInWithPassword({
      email:    creds.email,
      password: creds.contrasena,
    });
    this.cargando.set(false);
    if (error) this.error.set(this.traducirError(error));
  }

  async registrarConEmail(creds: ICredencialesRegistro): Promise<void> {
    this.error.set(null);
    this.cargando.set(true);
    const { error } = await this.supabase.auth.signUp({
      email:    creds.email,
      password: creds.contrasena,
      options:  { data: { full_name: creds.nombre } },
    });
    this.cargando.set(false);
    if (error) this.error.set(this.traducirError(error));
  }

  async loginConGoogle(returnUrl = '/fantasy/dashboard'): Promise<void> {
    this.error.set(null);
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnUrl=${returnUrl}`,
      },
    });
    if (error) this.error.set(this.traducirError(error));
    // La página redirige a Google — no hay más código aquí
  }

  logout(): void {
    this.supabase.auth.signOut();
    this.router.navigate(['/']);
  }

  // Devuelve el access token actual para adjuntar a peticiones al backend Python
  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private actualizarUsuario(session: Session | null): void {
    if (!session) { this.usuario.set(null); return; }
    const u = session.user;
    this.usuario.set({
      uid:        u.id,
      nombre:     u.user_metadata['full_name'] ?? u.user_metadata['name'] ?? u.email ?? 'Usuario',
      email:      u.email ?? '',
      fotoPerfil: u.user_metadata['avatar_url'] ?? null,
      proveedor:  u.app_metadata['provider'] === 'google' ? 'google' : 'email',
    });
  }

  private traducirError(error: AuthError): string {
    const mensajes: Record<string, string> = {
      'Invalid login credentials':       'Email o contraseña incorrectos',
      'Email not confirmed':             'Confirma tu email antes de entrar',
      'User already registered':         'Ese email ya tiene una cuenta',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
      'Unable to validate email address': 'El formato del email no es válido',
    };
    return mensajes[error.message] ?? 'Error inesperado. Inténtalo de nuevo.';
  }
}
```

### Paso 7 — AuthCallbackComponent

```typescript
// Procesa el redirect de Google OAuth
@Component({ ... })
export class AuthCallbackComponent implements OnInit {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Supabase procesa automáticamente el hash/query de la URL
    // onAuthStateChange en AuthService actualiza el usuario
    // Solo necesitamos esperar y redirigir
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';

    setTimeout(() => {
      if (this.auth.autenticado()) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.error.set('No se pudo completar la autenticación con Google.');
      }
    }, 1500);
  }
}
```

---

## Integración con el backend Python

El backend Python recibe el JWT de Supabase en el header `Authorization: Bearer <token>` y lo verifica.

### Frontend — interceptor HTTP

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = async (req, next) => {
  const auth  = inject(AuthService);
  const token = await auth.getAccessToken();

  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// Registrar en app.config.ts:
provideHttpClient(withInterceptors([authInterceptor]))
```

### Backend Python (FastAPI) — verificación del JWT

```python
# Opción A: verificar con la JWT Secret de Supabase (sin llamada de red)
import jwt  # pip install PyJWT

SUPABASE_JWT_SECRET = "tu-jwt-secret"  # Supabase Dashboard → Settings → API → JWT Settings

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload  # contiene: sub (user UUID), email, role, exp...
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Opción B: verificar con el cliente admin de Supabase (llamada de red)
from supabase import create_client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)  # lanza error si inválido
    return user.user
```

> **Recomendación:** Usar Opción A (verificación local con JWT Secret) — es más rápida y no depende de disponibilidad de Supabase en cada request. Usar Opción B solo si se necesita validar la revocación de tokens en tiempo real.

La JWT Secret de Supabase está en: **Dashboard → Settings → API → JWT Settings → JWT Secret**

---

## authGuard

```typescript
// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

> Si el `AuthService` aún está resolviendo la sesión inicial (`cargando() === true`), hay que esperar antes de ejecutar el guard. Ver nota implementación abajo.

---

## Criterios de aceptación

- [x] La ruta `/auth/login` carga `LoginComponent`
- [x] La ruta `/auth/register` carga `RegisterComponent`
- [x] `authGuard` bloquea `/fantasy/**` sin sesión y redirige a `/auth/login?returnUrl=...`
- [x] Tras login exitoso se navega a `returnUrl` o `/fantasy/dashboard`
- [x] Botón "Iniciar sesión" muestra spinner y desactiva el formulario durante la petición
- [x] Errores de validación aparecen bajo el campo al perder foco
- [x] Error de Supabase aparece en el banner global bajo el formulario
- [x] "Continuar con Google" redirige al flujo OAuth de Supabase
- [x] `/auth/callback` procesa el redirect de Google y navega a `returnUrl`
- [x] Si el usuario ya tiene sesión, `/auth/login` redirige a `/fantasy/dashboard`
- [x] Logout limpia la sesión (Supabase) y navega a `/`
- [x] La sesión persiste entre recargas (Supabase SDK gestiona localStorage)
- [x] Peticiones al backend Python incluyen `Authorization: Bearer <token>`
- [x] Compilación sin errores

---

## Notas para el agente

- **Fase 1 (mock):** implementar `AuthService` con señales y `localStorage` puro, sin instalar `@supabase/supabase-js`. Validar que la UI y los guards funcionan. La API del servicio no cambia entre fases.
- **Fase 2:** instalar el SDK, crear `SupabaseService`, sustituir el cuerpo de `AuthService`. Los componentes no cambian.
- El `SupabaseService` es un singleton que expone el `SupabaseClient`. Nunca llamar a `createClient()` desde un componente.
- El `authGuard` puede ejecutarse antes de que `onAuthStateChange` haya respondido. Solución: en el guard, esperar a que `cargando()` sea `false` usando `toObservable(auth.cargando).pipe(filter(v => !v), take(1))` antes de evaluar `autenticado()`.
- El botón de Google debe usar el SVG del logo oficial de Google, no Material Symbols. Consultar [developers.google.com/identity/branding-guidelines](https://developers.google.com/identity/branding-guidelines).
- La `service_role` key de Supabase tiene acceso total sin RLS — solo usarla en el backend Python, nunca en el frontend.
- En desarrollo, Supabase ofrece un proyecto gratuito en `supabase.com`. La URL de callback local debe estar en la lista de "Redirect URLs" del Dashboard.
