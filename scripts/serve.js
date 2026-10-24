// Zero-dependency static server for local site checks. `node scripts/serve.js [port]`
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PORT = Number(process.argv[2] || process.env.PORT || 4175);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = normalize(join(ROOT, 'site', urlPath.replace(/^\/site/, '/').replace(/^\/+/, '')));
    if (!file.startsWith(normalize(join(ROOT, 'site')))) { res.writeHead(400).end('bad path'); return; }
    let s = null;
    try { s = await stat(file); } catch { /* not found below */ }
    if (s && s.isDirectory()) { res.writeHead(301, { location: urlPath + '/' }).end(); return; }
    const body = await readFile(file);
    const type = MIME[extname(file)] || 'application/octet-stream';
    const headers = { 'content-type': type, 'cache-control': 'public, max-age=600', vary: 'accept-encoding' };
    if (/text|svg|json|xml|javascript/.test(type) && (req.headers['accept-encoding'] || '').includes('gzip')) {
      headers['content-encoding'] = 'gzip';
      res.writeHead(200, headers);
      res.end(gzipSync(body));
      return;
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch (e) {
    let fallback = null;
    try { fallback = await readFile(join(ROOT, 'site', '404.html')); } catch { /* ignore */ }
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fallback || '<h1>404</h1>');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`RepoGrade site: http://127.0.0.1:${PORT}/ (ctrl-c to stop)`));
