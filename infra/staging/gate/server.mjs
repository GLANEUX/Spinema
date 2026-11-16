// Tiny HTTP service behind the staging Nginx ("web" container), no dependencies.
// - GET  /_gate/check  204 with a valid cookie, 401 otherwise (Nginx auth_request)
// - GET  /_gate/login  the access code form
// - POST /_gate/login  checks the code, sets the cookie, goes back to the requested page
import { createServer } from 'node:http';
import {
  COOKIE_NAME,
  checkCode,
  clientIp,
  createLimiter,
  isValidToken,
  makeToken,
  readCookie,
  safeNext,
} from './gate.mjs';

const code = process.env.ACCESS_CODE ?? '';
const secret = process.env.GATE_SECRET ?? '';
const days = Number(process.env.COOKIE_DAYS ?? 30);
if (code.length < 6 || secret.length < 32) {
  console.error('ACCESS_CODE (6 caractères minimum) et GATE_SECRET (32 minimum) sont requis.');
  process.exit(1);
}
const limiter = createLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

const escapeHtml = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const page = (next, message) => `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Spinema préprod</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <main>
      <span class="logo"><i></i><b>SPINEMA</b></span>
      <form class="ticket" method="post" action="/_gate/login">
        <h1>Version de test</h1>
        <p>Entre le code qu'on t'a donné.</p>
        <input type="hidden" name="next" value="${escapeHtml(next)}" />
        <input class="code" name="code" type="password" autocomplete="current-password" required autofocus aria-label="Code d'accès" />
        ${message ? `<p class="error" role="alert">${escapeHtml(message)}</p>` : ''}
        <button class="key" type="submit">Entrer</button>
      </form>
    </main>
  </body>
</html>`;

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
};

const readForm = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2048) reject(new Error('too large'));
    });
    req.on('end', () => resolve(new URLSearchParams(body)));
    req.on('error', reject);
  });

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://gate');
  const now = Date.now();

  if (url.pathname === '/_gate/check') {
    const token = readCookie(req.headers.cookie, COOKIE_NAME);
    return send(res, isValidToken(token, { secret, code, now }) ? 204 : 401, '');
  }

  if (url.pathname === '/_gate/login' && req.method === 'GET') {
    // Nginx passes the original path raw after "next=".
    const raw = url.search.startsWith('?next=') ? url.search.slice(6) : '/';
    return send(res, 200, page(safeNext(raw), ''), { 'Content-Type': 'text/html; charset=utf-8' });
  }

  if (url.pathname === '/_gate/login' && req.method === 'POST') {
    const ip = clientIp(req.headers['x-forwarded-for'], req.socket.remoteAddress);
    let form;
    try {
      form = await readForm(req);
    } catch {
      return send(res, 413, '');
    }
    const next = safeNext(form.get('next') ?? '/');
    const html = { 'Content-Type': 'text/html; charset=utf-8' };
    if (limiter.isBlocked(ip, now)) {
      return send(res, 429, page(next, 'Trop d’essais. Réessaie dans un quart d’heure.'), html);
    }
    if (!checkCode(form.get('code'), code)) {
      limiter.fail(ip, now);
      return send(res, 401, page(next, 'Ce n’est pas le bon code.'), html);
    }
    limiter.reset(ip);
    const cookie = `${COOKIE_NAME}=${makeToken({ secret, code, now, days })}; Max-Age=${days * 24 * 60 * 60}; Path=/; HttpOnly; Secure; SameSite=Lax`;
    return send(res, 303, '', { Location: next, 'Set-Cookie': cookie });
  }

  return send(res, 404, '');
}).listen(Number(process.env.PORT ?? 8080), () => console.log('gate prêt'));
