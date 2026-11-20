import { hasAdminSession, isAdminConfigured } from '../../utils/admin-auth';

export default defineEventHandler((event) => ({
  authenticated: hasAdminSession(event),
  configured: isAdminConfigured(event),
}));
