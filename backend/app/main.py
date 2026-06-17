import logging
import uuid

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.auth import get_current_user
from app.config import settings
from app.ratelimit import limiter
from app.routers import admin, equipo_admin, fantasy, liga_real

logger = logging.getLogger("liga.api")

app = FastAPI(title="Liga Verano Alameda API", version="0.2.0")

# Rate limiting: el limiter va en app.state y los endpoints públicos lo aplican
# por decorador (@limiter.limit). El 429 pasa por rate_limit_handler (abajo) y
# devuelve el envelope estándar {data, error}.
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin", "")
    if origin in settings.allowed_origins_list:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"data": None, "error": {"message": "Demasiadas peticiones, espera un momento", "type": "RateLimitExceeded"}},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Loguea el error completo en el servidor y devuelve un mensaje genérico.

    No exponemos str(exc) ni el tipo de excepción al cliente para no filtrar
    detalles internos (consultas, conexiones, etc.). El error_id permite cruzar
    la respuesta con los logs del servidor.
    """
    error_id = uuid.uuid4().hex[:12]
    logger.exception("Unhandled error [%s] on %s %s", error_id, request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": {"message": "Error interno del servidor", "error_id": error_id}},
        headers=_cors_headers(request),
    )


app.include_router(liga_real.router)
app.include_router(fantasy.router)
app.include_router(admin.router)
app.include_router(equipo_admin.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return {"data": {"uid": user.get("sub"), "email": user.get("email")}, "error": None}
