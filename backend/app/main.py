import traceback

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import get_current_user
from app.config import settings
from app.routers import admin, equipo_admin, fantasy, liga_real

app = FastAPI(title="Liga Verano Alameda API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Captura excepciones no controladas, las loguea y devuelve CORS headers."""
    traceback.print_exc()
    origin = request.headers.get("origin", "")
    cors_headers: dict[str, str] = {}
    if origin in settings.allowed_origins_list:
        cors_headers["Access-Control-Allow-Origin"] = origin
        cors_headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": {"message": str(exc), "type": type(exc).__name__}},
        headers=cors_headers,
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
