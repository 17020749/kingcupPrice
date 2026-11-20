import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  createError,
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestURL,
  setCookie,
  type H3Event,
} from 'h3';

const COOKIE_NAME = 'kingcup_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function isAdminConfigured(event: H3Event): boolean {
  const config = useRuntimeConfig(event);
  return Boolean(
    config.adminPassword
    && config.adminSessionSecret
    && String(config.adminSessionSecret).length >= 32,
  );
}

export function assertSameOrigin(event: H3Event): void {
  const origin = getRequestHeader(event, 'origin');
  if (!origin) return;

  try {
    if (new URL(origin).origin !== getRequestURL(event).origin) {
      throw createError({ statusCode: 403, statusMessage: 'Yêu cầu không cùng nguồn.' });
    }
  } catch (error: any) {
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 403, statusMessage: 'Origin không hợp lệ.' });
  }
}

export function verifyAdminPassword(event: H3Event, password: string): boolean {
  const config = useRuntimeConfig(event);
  if (!config.adminPassword || !password) return false;
  return safeEqual(password, String(config.adminPassword));
}

export function createAdminSession(event: H3Event): void {
  const config = useRuntimeConfig(event);
  const payload = Buffer.from(JSON.stringify({
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString('base64url');

  const value = payload + '.' + sign(payload, String(config.adminSessionSecret));

  setCookie(event, COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function hasAdminSession(event: H3Event): boolean {
  const config = useRuntimeConfig(event);
  if (!config.adminSessionSecret) return false;

  const value = getCookie(event, COOKIE_NAME);
  if (!value) return false;

  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra) return false;

  const expected = sign(payload, String(config.adminSessionSecret));
  if (!safeEqual(signature, expected)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { expiresAt?: number };
    return typeof session.expiresAt === 'number'
      && session.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function assertAdmin(event: H3Event): void {
  if (!hasAdminSession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }
}

export function clearAdminSession(event: H3Event): void {
  deleteCookie(event, COOKIE_NAME, { path: '/' });
}
