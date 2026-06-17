// Proxy con failover hacia los VPS del backend.
// El orden de la lista = prioridad: intenta el primero y, si falla
// (error de red o respuesta 502/503/504), reintenta con el siguiente.
// Ambos VPS comparten la misma base de datos, así que el failover es seguro.
const BACKENDS = [
  'http://92.112.127.238:8004',
  'http://141.11.100.166:8004',
];

const PER_BACKEND_TIMEOUT_MS = 8000;

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export default async function handler(req, res) {
  const targetPath = req.url.replace(/^\/api/, '') || '/';

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await readRawBody(req) : undefined;

  const forwardHeaders = { ...req.headers };
  delete forwardHeaders.host;
  delete forwardHeaders['content-length'];
  // fetch (undici) descomprime la respuesta automáticamente; evitamos
  // pedir gzip para no tener que reescribir content-encoding.
  delete forwardHeaders['accept-encoding'];

  let lastError = null;

  for (const base of BACKENDS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PER_BACKEND_TIMEOUT_MS);

    try {
      const upstream = await fetch(base + targetPath, {
        method: req.method,
        headers: forwardHeaders,
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Si el propio backend devuelve un error de gateway, probamos el siguiente.
      if (upstream.status >= 502 && upstream.status <= 504) {
        lastError = new Error(`${base} respondió ${upstream.status}`);
        continue;
      }

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (k === 'content-encoding' || k === 'transfer-encoding' || k === 'content-length') {
          return;
        }
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
      return;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      // error de red o timeout: probamos el siguiente backend
    }
  }

  res.status(502).json({
    error: 'Ningún backend disponible',
    detail: lastError ? String(lastError) : 'desconocido',
  });
}
