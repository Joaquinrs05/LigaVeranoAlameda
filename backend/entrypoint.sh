#!/bin/sh
set -e

echo "Iniciando API..."

# Gunicorn gestiona varios workers Uvicorn: cada uno tiene su propio threadpool,
# así que multiplicamos la concurrencia sin reescribir los handlers a async.
# - WEB_CONCURRENCY: nº de workers (por defecto 3; en Render/VPS ajustar a ~2*vCPU+1)
# - PORT: lo inyecta Render; en VPS/Docker usamos 8004 (Nginx hace de proxy delante)
# - max-requests: recicla workers periódicamente para acotar el crecimiento de memoria
exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w "${WEB_CONCURRENCY:-3}" \
  -b "0.0.0.0:${PORT:-8004}" \
  --timeout 30 \
  --graceful-timeout 30 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --access-logfile - \
  --error-logfile -
