#!/bin/sh
set -e

echo "Sincronizando datos desde Supabase..."
python sync.py

echo "Iniciando API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8004
