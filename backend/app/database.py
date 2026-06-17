import httpx
from supabase import Client, create_client

from app.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

# Timeout por petición: una llamada lenta a Supabase no debe retener un hilo
# indefinidamente (eso satura el threadpool del worker y cascada en 5xx).
# La concurrencia real de conexiones hacia Supabase queda acotada por el número
# de workers de Gunicorn × el threadpool de cada uno (handlers síncronos),
# y multiplexada por el pooler (PgBouncer) de Supabase.
_timeout = httpx.Timeout(10.0)
supabase.postgrest.session.timeout = _timeout
supabase_admin.postgrest.session.timeout = _timeout
