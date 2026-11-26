// node serve.mjs [port] : serves dist/ over http on this machine and prints the address. Run node build.mjs first.
// Opened straight from disk the site works, but the browser treats each file as a place of its own: what it saves for
// one page (the stage) and whether one page may fetch another (the in-place swap, bible 10.8) both behave differently
// from a real web address. This is that address. Nothing is cached, so a rebuild shows on the next reload.
// walk.mjs imports serve() from here and serves the site itself.
import { createServer } from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };

// A file under root for a request path, or null. An address ending in / is a page: its index.html.
function fileFor(root, path) {
  let p; try { p = decodeURIComponent(path.split('?')[0].split('#')[0]); } catch { return null; }
  if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(root, p));
  if (!file.startsWith(normalize(root.endsWith(sep) ? root : root + sep))) return null;   // nothing outside dist/
  try { const st = statSync(file); return st.isFile() ? file : st.isDirectory() ? fileFor(root, p + '/') : null; } catch { return null; }
}

// The "not found" page is sent for any bad address, at any depth, so its addresses are written from the place the site
// sits on its real server (the build's base path, /echo-basin/ unless it was built with another) instead of relative to
// itself. So that it works here as well, an address under that path is served as if from the top of dist/. The path is
// read from the built page, from where it says the stylesheet is, so it is always the one the site was built with.
function builtBase(root) {
  try { const m = /<link rel="stylesheet" href="(\/[^"]*?)assets\/site\.css">/.exec(readFileSync(join(root, '404.html'), 'utf8')); return m && m[1] !== '/' ? m[1] : null; } catch { return null; }
}

// Resolves to { url, close() } once listening. Port 0 takes any free one.
export function serve({ root = DIST, port = 0, host = '127.0.0.1' } = {}) {
  const server = createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    let file = fileFor(root, req.url), status = 200;
    if (!file) { const base = builtBase(root); if (base && req.url.startsWith(base)) file = fileFor(root, req.url.slice(base.length - 1)); }
    // an address that is not on the site gets the site's own "not found" page once there is one
    if (!file) { file = fileFor(root, '/404.html'); status = 404; }
    if (!file) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found\n'); return; }
    res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve({ url: `http://${host}:${server.address().port}/`, close: () => new Promise(r => server.close(r)) }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const want = +(process.argv[2] || process.env.PORT || 8000);
  // the usual port if it is free, any other if not
  const { url } = await serve({ port: want }).catch(e => e.code === 'EADDRINUSE' ? serve({ port: 0 }) : Promise.reject(e));
  const base = builtBase(DIST);
  console.log(`Serving dist/ at ${url}   (Ctrl-C to stop)\n  ${url}?reset    starts the story over\n  ${url}?stage=3  shows stage 3 without saving`
    + `\n  ${url}${(base || '/').slice(1)}trails/no-such-trail/   any address that is not on the site shows the "not found" page`);
}
