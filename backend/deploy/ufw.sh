#!/bin/sh
# Lockdown del firewall del VPS. El backend (8004) NO debe ser accesible desde
# fuera: solo lo alcanza Nginx por 127.0.0.1. Exponer el :8004 al mundo es lo
# que permite floodear directamente saltándose el proxy/rate-limit.
set -e

ufw --force reset
ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp     # SSH (restríngelo a tu IP si puedes: ufw allow from <IP> to any port 22)
ufw allow 80/tcp     # HTTP (redirige a HTTPS)
ufw allow 443/tcp    # HTTPS (Nginx)

# Importante: NO abrir 8004. Asegúrate de que uvicorn/gunicorn o el contenedor
# publican solo en 127.0.0.1 (no en 0.0.0.0 expuesto a la red).

ufw --force enable
ufw status verbose
