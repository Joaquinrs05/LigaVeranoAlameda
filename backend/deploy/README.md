# Despliegue y fiabilidad — backend Liga Verano Alameda

Mismo código `backend/` desplegado en dos sitios:

- **Render (primario)** — `https://ligaveranoalameda.onrender.com`. El frontend en
  Vercel le llega vía el rewrite `/api/*` de `web/vercel.json`.
- **VPS (standby manual)** — `141.11.100.166`. Se mantiene **apagado o tras firewall**
  mientras no se use, para que no sea superficie de ataque.

## Render

1. Aplicar `backend/render.yaml` como Blueprint.
2. Definir los secretos (`SUPABASE_*`, `ALLOWED_ORIGINS`, `CLOUDINARY_*`) en el dashboard.
3. `WEB_CONCURRENCY` ≈ 2×vCPU+1 del tier elegido. Vigilar RAM: cada worker carga la app.
4. Health check en `/health` (ya configurado) → Render reinicia instancias colgadas.

## VPS (cuando toque levantar el standby)

1. Backend solo en localhost: `docker compose up` (ya publica en `127.0.0.1:8004`).
   Auto-reinicio: `restart: unless-stopped` o el unit `deploy/liga-api.service`.
2. Nginx delante con TLS + rate limit: copiar `deploy/nginx.conf`, ajustar el dominio,
   emitir certificado con certbot, `nginx -t && systemctl reload nginx`.
3. Firewall: `sh deploy/ufw.sh` (cierra todo menos 22/80/443; el `:8004` queda interno).
4. Variables de entorno: copiar `.env` (no versionado) al VPS.

## Runbook de failover manual (Render caído)

1. Levantar el VPS (pasos de arriba) y comprobar `https://api.tudominio.com/health`.
2. En `web/vercel.json`, apuntar el rewrite al **dominio TLS** del VPS:
   ```json
   { "source": "/api/:path*", "destination": "https://api.tudominio.com/:path*" }
   ```
   Nunca a `http://141.11.100.166:8004` (sin TLS, salta el proxy y el rate-limit).
3. Redeploy del frontend en Vercel.
4. **Fail-back:** revertir el rewrite a `https://ligaveranoalameda.onrender.com` y
   volver a apagar/cerrar el VPS.

## Pendiente (hardening futuro, requiere acceso a Supabase)

- Cambiar las lecturas públicas de `liga_real.py` al cliente **anon** para que RLS
  sea backstop real. Antes verificar que el rol `anon` tiene `SELECT` sobre las vistas
  (`clasificacion`) y tablas públicas; si falta un grant, romper­ía la web pública.
- Migrar handlers a `async` + cliente Supabase async (hoy son síncronos sobre threadpool).
- Rate limit con almacenamiento compartido (Redis) si se quieren límites globales exactos
  entre workers (hoy slowapi cuenta por worker; Nginx hace el límite duro en el VPS).
