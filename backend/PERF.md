# Optimización de rendimiento del backend

Reporte de la ronda de optimización centrada en: **reducir el número de consultas a
Supabase, aguantar más peticiones simultáneas y acotar el uso de RAM/conexiones.**

Mediciones tomadas en local (`uvicorn`/`gunicorn` en `127.0.0.1:8004`) contra el
Supabase real. La latencia absoluta está dominada por el round-trip a Supabase
desde local; lo relevante es la **comparación relativa** antes/después.

---

## 1. Línea base (antes de optimizar)

| Endpoint        | Round-trips a Supabase | Latencia (3 muestras)         |
| --------------- | ---------------------- | ----------------------------- |
| `/health`       | 0                      | ~1 ms                         |
| `/clasificacion`| 1                      | 56–72 ms                      |
| `/jornadas`     | 1                      | ~54 ms                        |
| `/equipos`      | 1                      | 58–103 ms                     |
| `/goleadores`   | 4 + agregación Python  | **162–235 ms** (el más lento) |
| `/cruces`       | 1                      | ~54 ms                        |

- Throughput `/health` (sin DB): ~3993 req/s, 5 ms @ concurrencia 20.
- 2 clientes Supabase (`supabase` anon + `supabase_admin`); el anon **sin uso**.
- Pool httpx por defecto: **100 conexiones / 20 keep-alive** por cliente.
- Timeout httpx: 10 s. Todos los handlers son síncronos sobre threadpool.

---

## 2. Cambios REALIZADOS (y por qué)

### Cambio 1 — Pool acotado, sin cliente anon, timeout 5 s  ·  riesgo BAJO
`app/database.py`

- **Eliminado el cliente `supabase` anon**: no lo usaba ningún router. Mantenerlo
  abría un segundo pool de conexiones y cargaba otro cliente en memoria sin uso.
- **Pool httpx acotado a 20 conexiones / 10 keep-alive** (antes 100/20). Con varios
  workers de Gunicorn, el default abría cientos de conexiones potenciales contra el
  pooler de Supabase. Keep-alive reutiliza conexiones (evita reabrir TLS por request)
  y pone techo a RAM y conexiones simultáneas.
- **Timeout 10 s → 5 s**: Supabase responde en ms; 5 s ya es un fallo de cara al
  usuario. Aguantar más solo acumula hilos colgados y satura el threadpool.

*Efecto:* sin cambio de latencia individual (esperado). Protege memoria y conexiones
bajo carga. Todos los endpoints siguen en 200.

### Cambio 2 — Caché TTL en proceso para endpoints públicos  ·  riesgo BAJO-MEDIO
`app/cache.py` (nuevo), `app/routers/liga_real.py`, `app/config.py`

- Caché en memoria (TTL 20 s, configurable con `CACHE_TTL_SECONDS`) para los 5
  endpoints públicos sin parámetros: `/clasificacion`, `/jornadas`, `/equipos`,
  `/goleadores`, `/cruces`.
- Motivo: son idénticos para todos los visitantes y cambian rara vez. Sin caché,
  N visitantes = N queries idénticas. Con caché, **1 query por endpoint cada 20 s**.
- *Trade-off aceptado:* un cambio del admin tarda hasta 20 s en verse en la web
  pública (invisible en la práctica para futsal). **Nunca** se cachean datos
  por-usuario/autenticados (fantasy, admin).

**Latencia (cache hit):**

| Endpoint        | Base (miss) | Caché (hit) | Mejora |
| --------------- | ----------- | ----------- | ------ |
| `/clasificacion`| ~72 ms      | **~1 ms**   | ~70×   |
| `/jornadas`     | ~54 ms      | **~1 ms**   | ~50×   |
| `/equipos`      | ~73 ms      | **~1 ms**   | ~70×   |
| `/goleadores`   | ~256 ms     | **~2 ms**   | ~120×  |
| `/cruces`       | ~57 ms      | **~1 ms**   | ~55×   |

**Carga concurrente** (`ab -n 1000 -c 50 /clasificacion`, gunicorn 3 workers, rate-limit off):

| Escenario          | Throughput     | Latencia media | Queries a Supabase |
| ------------------ | -------------- | -------------- | ------------------ |
| Sin caché (TTL=0)  | 335 req/s      | 149 ms         | ~1000              |
| Con caché (TTL=20) | **2506 req/s** | **20 ms**      | **~3** (1/worker)  |

➡️ **~7.5× throughput, ~7.5× menos latencia, ~1000 → ~3 consultas.** 0 fallos.
Resuelve además de paso la latencia de `/goleadores`.

---

## 3. Cambios DESCARTADOS (evaluados y rechazados, con motivo)

### `mi-miembro` reutilizando la vista `clasificacion_fantasy`  ·  descartado
La vista usa `RANK() OVER (PARTITION BY liga_id ...)` con `GROUP BY` sobre todos los
miembros de la liga. Filtrarla por un solo `miembro_id` obliga a Postgres a calcular
la ventana de toda la liga. El código actual hace `SUM` de las pocas filas de un
miembro usando el índice `idx_puntuaciones_miembro`. Reusar la vista sería un
**micro-empeoramiento**; el "problema" original (sumar <30 filas en Python) es
insignificante.

### Recortar `select("*")` a campos concretos  ·  descartado
Las tablas son **estrechas** y los `response_model` (que ya filtran la salida vía
Pydantic) necesitan casi todas las columnas: `jugadores`/`partidos`/`jornadas` se
consumen enteras; en `equipos` solo sobra `entrenador_id` (un uuid) en joins
anidados. El sobre-fetch es de bytes despreciables y recortar añade riesgo de fallo
silencioso (olvidar un campo) sin payoff real.

### `goleadores` agregado en SQL  ·  ya no necesario
Su motivación era la lentitud (256 ms). La caché (Cambio 2) lo bajó a ~2 ms en
caliente, así que el coste solo se paga 1 vez cada 20 s. No compensa el cambio.

---

## 4. Pendiente (mayor riesgo o fuera de alcance de esta ronda)

Son cambios de **escritura** o de gran superficie; requieren migración SQL + pruebas
en staging, no un commit más:

- **`fichar`/`vender` → función RPC de Postgres** (riesgo ALTO). Reduce de ~8
  round-trips a 1 por fichaje y arregla la condición de carrera de presupuesto (bug
  B4). Mueve dinero/plantilla: un error corrompe datos. Hacer con migración y pruebas.
- **`calcular_puntuaciones` en SQL** (riesgo ALTO). Arrastra los bugs B1/B9/B14;
  tocarlo solo por rendimiento puede corromper puntos de todos los usuarios. Hacer
  junto a la corrección de esos bugs, no aislado.
- **Caché en el frontend** (riesgo BAJO-MEDIO). Hoy cada navegación re-descarga
  ligas + clasificación + miembro + plantilla (ver F17 en BUGS.md). Cachear en los
  signals recorta llamadas cliente→API. No toca datos.
- **Handlers asíncronos** (decisión futura). Hoy es sync + threadpool + workers
  (≈200 peticiones en vuelo), que sobra a esta escala y la caché alivió aún más.
  Tiene sentido SOLO después de convertir `fichar`/`vender` a una sola llamada RPC:
  primero reducir round-trips, luego async.

---

## 5. Cómo reproducir las mediciones

```bash
cd backend
# arranque normal (caché 20 s, rate-limit on)
./venv/bin/uvicorn app.main:app --port 8004

# latencia / cache hit
for i in 1 2 3; do curl -s -o /dev/null -w "%{time_total}s\n" http://127.0.0.1:8004/goleadores; done

# carga concurrente sin vs con caché (rate-limit off)
RATE_LIMIT_ENABLED=false CACHE_TTL_SECONDS=0  ./venv/bin/gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 3 -b 127.0.0.1:8004 &
ab -n 1000 -c 50 http://127.0.0.1:8004/clasificacion
# ...repetir con CACHE_TTL_SECONDS=20
```
