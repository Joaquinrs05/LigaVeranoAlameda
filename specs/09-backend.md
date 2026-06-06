# Backend Python — Spec

## Metadata

| Campo | Valor |
|---|---|
| **ID** | `09-backend` |
| **Status** | `draft` |
| **Tipo** | Arquitectura de servidor — independiente del frontend Angular |
| **Prioridad** | `alta` |
| **Dependencias** | `08-auth` (Supabase Auth ya configurado) |

---

## Overview

API REST en Python que actúa como capa de negocio entre el frontend Angular y la base de datos Supabase. Verifica los JWTs emitidos por Supabase Auth en cada petición protegida y expone los endpoints que la app necesita.

> Este documento es la base de la arquitectura. Las secciones de endpoints se irán completando a medida que se definan las features.

---

## Stack

| Pieza | Tecnología | Motivo |
|---|---|---|
| Framework | **FastAPI** | Async, tipado con Pydantic, genera OpenAPI automático |
| Base de datos | **Supabase** (PostgreSQL) | Ya elegido para auth, usamos el mismo proyecto |
| Cliente DB | **supabase-py** (`supabase`) | SDK oficial, soporta RLS y Auth admin |
| Verificación JWT | **PyJWT** | Verificación local del token de Supabase sin llamada de red |
| Variables de entorno | **python-dotenv** | Carga `.env` en desarrollo |
| Servidor | **Uvicorn** | ASGI, compatible con FastAPI |

---

## Estructura de carpetas

```
backend/
├── app/
│   ├── main.py              # Entrada, CORS, routers
│   ├── config.py            # Variables de entorno (Settings con Pydantic)
│   ├── auth.py              # Middleware / dependencia de verificación JWT
│   ├── database.py          # Cliente Supabase singleton
│   └── routers/
│       ├── __init__.py
│       └── ...              # Un archivo por dominio (se añaden según features)
├── .env                     # Local — nunca en git
├── .env.example             # Plantilla sin valores reales — sí en git
├── requirements.txt
└── README.md
```

---

## Variables de entorno

```bash
# .env.example

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...          # Para operaciones públicas
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # Para operaciones admin (sin RLS)
SUPABASE_JWT_SECRET=tu-jwt-secret     # Dashboard → Settings → API → JWT Settings
ALLOWED_ORIGINS=http://localhost:4200  # CORS — separar por comas si hay varios
```

> `SUPABASE_JWT_SECRET` y `SUPABASE_SERVICE_ROLE_KEY` son secretos — solo en el servidor, nunca en el frontend ni en un repo público.

---

## Configuración base (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="Liga Verano Alameda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers aquí cuando se añadan:
# from app.routers import jugadores, fantasy, jornadas
# app.include_router(jugadores.router, prefix="/jugadores", tags=["jugadores"])
```

---

## Verificación JWT (`auth.py`)

Dependencia de FastAPI reutilizable en cualquier endpoint protegido:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config import settings

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload  # sub = UUID del usuario, email, role, exp...
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

# Uso en un endpoint protegido:
# @router.get("/mi-equipo")
# def get_mi_equipo(user: dict = Depends(get_current_user)):
#     user_id = user["sub"]  # UUID del usuario en Supabase
#     ...
```

---

## Cliente Supabase (`database.py`)

```python
from supabase import create_client, Client
from app.config import settings

# Cliente con anon key — respeta Row Level Security
supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)

# Cliente admin — sin RLS, solo para operaciones de servidor
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
```

---

## Endpoints — por definir

> Esta sección se irá completando. Cada dominio tendrá su propio router en `app/routers/`.

| Dominio | Prefijo | Estado | Notas |
|---|---|---|---|
| — | — | pendiente | Por definir con el usuario |

---

## Patrones de respuesta

Todas las respuestas siguen el mismo esquema:

```python
# Éxito
{ "data": <payload>, "error": null }

# Error
{ "data": null, "error": { "message": "...", "code": "..." } }
```

Los errores HTTP usan los códigos estándar: `400` validación, `401` no autenticado, `403` sin permiso, `404` no encontrado, `500` error interno.

---

## Arrancar en desarrollo

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva generada automáticamente: `http://localhost:8000/docs`

---

## requirements.txt (base)

```
fastapi
uvicorn[standard]
supabase
PyJWT
python-dotenv
pydantic-settings
```

---

## Criterios de aceptación — base

- [ ] `uvicorn app.main:app --reload` arranca sin errores
- [ ] CORS configurado — el frontend Angular puede hacer fetch sin bloqueos
- [ ] Endpoint `GET /health` devuelve `{ "status": "ok" }` (sin auth)
- [ ] Dependencia `get_current_user` rechaza tokens inválidos con 401
- [ ] Dependencia `get_current_user` acepta tokens válidos de Supabase
- [ ] `.env.example` en el repo, `.env` en `.gitignore`

---

## Notas

- Ampliar esta spec con nuevas secciones de endpoints cuando el usuario defina qué lógica de negocio va en el backend.
- Las tablas de Supabase se definirán en el Dashboard o mediante migraciones SQL — documentarlas aquí cuando se creen.
- Si en algún momento se necesita lógica en tiempo real (websockets, puntuaciones en vivo), FastAPI lo soporta nativamente.
