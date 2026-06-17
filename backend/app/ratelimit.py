from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings


def _client_ip(request: Request) -> str:
    """IP real del cliente.

    Detrás de Nginx / Render / Vercel la IP del socket es la del proxy, así que
    usamos la primera entrada de X-Forwarded-For (la añade el proxy de confianza
    que tenemos delante). Sin proxy, caemos a la IP del socket.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Limiter compartido. Aplicamos los límites por decorador (@limiter.limit) en los
# endpoints públicos sin auth, que son la superficie real de flood. Así el 429
# pasa por nuestro exception handler y devuelve el envelope {data, error}.
# El límite global/autenticado se aplica en la capa de Nginx (VPS) / Cloudflare.
# headers_enabled=False: con headers activos, slowapi exige que el endpoint
# devuelva un Response para inyectar X-RateLimit-*; los nuestros devuelven dict,
# así que lo desactivamos (el límite se sigue aplicando igual).
limiter = Limiter(
    key_func=_client_ip,
    enabled=settings.rate_limit_enabled,
    headers_enabled=False,
)
