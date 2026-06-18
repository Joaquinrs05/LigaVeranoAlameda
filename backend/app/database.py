import httpx
from supabase import Client, create_client

from app.config import settings

# Solo usamos el cliente con service_role en toda la API. El antiguo cliente
# `supabase` anon no lo consumía ningún router (se eliminó): mantenerlo abría un
# segundo pool de conexiones y cargaba otro cliente en memoria sin uso.
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

# Timeout por petición: una llamada lenta a Supabase no debe retener un hilo
# indefinidamente (eso satura el threadpool del worker y cascada en 5xx).
# Supabase responde en ms; 5s ya es un fallo de cara al usuario, así que no
# tiene sentido aguantar más y acumular hilos colgados.
_timeout = httpx.Timeout(5.0)

# Acotamos el pool de conexiones httpx. Por defecto httpx permite 100 conexiones
# por cliente; con varios workers de Gunicorn eso son cientos de conexiones
# potenciales contra el pooler de Supabase. Limitarlo + keep-alive reutiliza
# conexiones (evita reabrir TLS en cada request) y pone un techo a la RAM y a las
# conexiones simultáneas. El pool se fija al construir el transporte, así que lo
# sustituimos (la sesión es un httpx.Client estándar).
_limits = httpx.Limits(max_connections=20, max_keepalive_connections=10)

_session = supabase_admin.postgrest.session
_old_transport = _session._transport
_session._transport = httpx.HTTPTransport(limits=_limits)
_old_transport.close()
_session.timeout = _timeout
