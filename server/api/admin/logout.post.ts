import { assertSameOrigin, clearAdminSession } from '../../utils/admin-auth';

export default defineEventHandler((event) => {
  assertSameOrigin(event);
  clearAdminSession(event);
  return { success: true };
});
