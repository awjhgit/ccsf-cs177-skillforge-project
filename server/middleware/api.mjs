export function apiMiddleware(handle) {
  async function middleware(req, res, next) {
    if (!req.url?.startsWith('/api/')) return next();
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) {
          res.writeHead(413, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ error: 'Request is too large.' }));
          return;
        }
        chunks.push(chunk);
      }
      const method = req.method ?? 'GET';
      const response = await handle(new Request(`${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}${req.url}`, {
        method, headers: new Headers(Object.entries(req.headers).flatMap(([key, value]) =>
          value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value]])),
        ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) }),
      }), req.socket.remoteAddress);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch (error) {
      console.error('API request failed:', error);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ error: 'Unable to complete the request. Please try again.' }));
    }
  }
  return middleware;
}
