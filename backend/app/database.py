import httpx
from supabase import Client, create_client

from app.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

_timeout = httpx.Timeout(10.0)
supabase.postgrest.session.timeout = _timeout
supabase_admin.postgrest.session.timeout = _timeout
