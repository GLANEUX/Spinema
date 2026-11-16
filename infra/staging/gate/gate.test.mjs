import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  checkCode,
  clientIp,
  createLimiter,
  isValidToken,
  makeToken,
  readCookie,
  safeNext,
} from './gate.mjs';

const secret = 'x'.repeat(32);
const code = 'cassette';
const now = 1_000_000;

test('accepts the right code, trimmed, and nothing else', () => {
  assert.equal(checkCode('cassette', code), true);
  assert.equal(checkCode('  cassette ', code), true);
  assert.equal(checkCode('Cassette', code), false);
  assert.equal(checkCode('', code), false);
  assert.equal(checkCode(undefined, code), false);
});

test('a token is valid until it expires', () => {
  const token = makeToken({ secret, code, now, days: 30 });
  assert.equal(isValidToken(token, { secret, code, now }), true);
  assert.equal(isValidToken(token, { secret, code, now: now + 29 * 86_400_000 }), true);
  assert.equal(isValidToken(token, { secret, code, now: now + 30 * 86_400_000 }), false);
});

test('a token is refused if forged, malformed, or if the code or secret changed', () => {
  const token = makeToken({ secret, code, now, days: 30 });
  const [expiry, signature] = token.split('.');
  assert.equal(isValidToken(`${Number(expiry) + 1}.${signature}`, { secret, code, now }), false);
  assert.equal(isValidToken(`${expiry}.AAAA`, { secret, code, now }), false);
  assert.equal(isValidToken(`${token}.more`, { secret, code, now }), false);
  assert.equal(isValidToken('abc.def', { secret, code, now }), false);
  assert.equal(isValidToken(undefined, { secret, code, now }), false);
  assert.equal(isValidToken(token, { secret, code: 'autre-code', now }), false);
  assert.equal(isValidToken(token, { secret: 'y'.repeat(32), code, now }), false);
});

test('reads one cookie among others', () => {
  assert.equal(readCookie('a=1; spinema_staging=v.s; b=2', 'spinema_staging'), 'v.s');
  assert.equal(readCookie('a=1', 'spinema_staging'), undefined);
  assert.equal(readCookie(undefined, 'spinema_staging'), undefined);
});

test('only redirects to paths of the same site', () => {
  assert.equal(safeNext('/i/abc?x=1'), '/i/abc?x=1');
  assert.equal(safeNext('https://evil.test'), '/');
  assert.equal(safeNext('//evil.test'), '/');
  assert.equal(safeNext('/\\evil.test'), '/');
  assert.equal(safeNext('/_gate/login'), '/');
  assert.equal(safeNext(undefined), '/');
});

test('takes the client address added last by the server Nginx', () => {
  assert.equal(clientIp('6.6.6.6, 1.2.3.4', '10.0.0.1'), '1.2.3.4');
  assert.equal(clientIp(undefined, '10.0.0.1'), '10.0.0.1');
});

test('blocks an address after 5 failures for 15 minutes', () => {
  const limiter = createLimiter({ max: 5, windowMs: 900_000 });
  for (let i = 0; i < 5; i += 1) limiter.fail('1.2.3.4', now);
  assert.equal(limiter.isBlocked('1.2.3.4', now), true);
  assert.equal(limiter.isBlocked('5.6.7.8', now), false);
  assert.equal(limiter.isBlocked('1.2.3.4', now + 900_001), false);
  limiter.reset('1.2.3.4');
  assert.equal(limiter.isBlocked('1.2.3.4', now), false);
});
