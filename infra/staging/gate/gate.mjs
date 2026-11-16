// Access code for the staging site. Pure functions, tested in gate.test.mjs.
// The cookie holds "<expiry>.<signature>": nothing secret, and it can't be forged without
// GATE_SECRET. Changing the access code invalidates every cookie already handed out.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'spinema_staging';

const sign = (secret, code, value) =>
  createHmac('sha256', createHmac('sha256', secret).update(code).digest())
    .update(value)
    .digest('base64url');

const sameText = (a, b) => {
  const x = createHmac('sha256', 'compare').update(a).digest();
  const y = createHmac('sha256', 'compare').update(b).digest();
  return timingSafeEqual(x, y);
};

export function checkCode(given, expected) {
  return typeof given === 'string' && given.length > 0 && sameText(given.trim(), expected);
}

export function makeToken({ secret, code, now, days }) {
  const expiry = String(now + days * 24 * 60 * 60 * 1000);
  return `${expiry}.${sign(secret, code, expiry)}`;
}

export function isValidToken(token, { secret, code, now }) {
  if (typeof token !== 'string') return false;
  const [expiry, signature, extra] = token.split('.');
  if (!expiry || !signature || extra !== undefined || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) <= now) return false;
  return sameText(signature, sign(secret, code, expiry));
}

export function readCookie(header, name) {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

// Only same-site paths, so the login page can't be used to redirect elsewhere.
export function safeNext(next) {
  if (
    typeof next !== 'string' ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\')
  ) {
    return '/';
  }
  return next.startsWith('/_gate/') ? '/' : next;
}

// The server's Nginx appends the real client address last in X-Forwarded-For.
export function clientIp(forwardedFor, fallback) {
  const last = (forwardedFor ?? '').split(',').pop()?.trim();
  return last || fallback || 'unknown';
}

// Failed attempts per address: blocked for `windowMs` after `max` failures.
export function createLimiter({ max, windowMs }) {
  const failures = new Map();
  return {
    isBlocked(ip, now) {
      const entry = failures.get(ip);
      if (!entry || now - entry.since > windowMs) return false;
      return entry.count >= max;
    },
    fail(ip, now) {
      const entry = failures.get(ip);
      if (!entry || now - entry.since > windowMs) failures.set(ip, { count: 1, since: now });
      else entry.count += 1;
    },
    reset(ip) {
      failures.delete(ip);
    },
  };
}
