import threading
import time
from typing import Any

from app.config import settings

# Caché TTL en proceso para respuestas de endpoints públicos de solo lectura.
#
# Los endpoints públicos (clasificación, jornadas, equipos, goleadores, cruces)
# son idénticos para todos los visitantes y cambian rara vez (solo cuando el
# admin mete resultados). Sin caché, 100 visitantes = 100 queries idénticas a
# Supabase. Con caché, como mucho 1 query por endpoint cada TTL segundos.
#
# Trade-off aceptado: un cambio del admin tarda hasta TTL segundos en verse en la
# web pública. Con TTL corto (20s) es invisible en la práctica. NUNCA cachear
# datos por-usuario/autenticados (fantasy, admin): esto es solo para lo público.
#
# Nota multi-worker: cada worker de Gunicorn tiene su propia copia. No buscamos
# coherencia global, solo recortar la avalancha de queries repetidas por worker.

class TTLCache:
    def __init__(self, ttl: float) -> None:
        self._ttl = ttl
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expira, valor = entry
            if time.monotonic() >= expira:
                self._store.pop(key, None)
                return None
            return valor

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + self._ttl, value)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


publico = TTLCache(ttl=settings.cache_ttl_seconds)
