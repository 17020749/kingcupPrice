import {
  assertSameOrigin,
  createAdminSession,
  isAdminConfigured,
  verifyAdminPassword,
} from '../../utils/admin-auth';

export default defineEventHandler(async (event) => {
  assertSameOrigin(event);

  if (!isAdminConfigured(event)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Máy chủ chưa cấu hình NUXT_ADMIN_PASSWORD và NUXT_ADMIN_SESSION_SECRET.',
    });
  }

  const body = await readBody<{ password?: string }>(event);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!verifyAdminPassword(event, password)) {
    throw createError({ statusCode: 401, statusMessage: 'Mật khẩu quản trị không chính xác.' });
  }

  createAdminSession(event);
  return { success: true };
});
