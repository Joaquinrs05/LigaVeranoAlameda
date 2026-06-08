from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import PyJWKClient

from app.config import settings

bearer_scheme = HTTPBearer()

# Cliente JWKS — descarga y cachea las claves públicas de Supabase automáticamente
_jwks_client = PyJWKClient(settings.jwks_url, cache_keys=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )


def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    from app.database import supabase_admin

    uid = user.get("sub", "")
    result = (
        supabase_admin.table("perfiles")
        .select("es_admin")
        .eq("uid", uid)
        .maybe_single()
        .execute()
    )
    if not result.data or not result.data.get("es_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador",
        )
    return user
