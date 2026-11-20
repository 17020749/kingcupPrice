import { assertAdmin, assertSameOrigin } from '../../utils/admin-auth';
import { saveCatalog } from '../../utils/catalog-store';

export default defineEventHandler(async (event) => {
  assertSameOrigin(event);
  assertAdmin(event);

  const body = await readBody(event);

  try {
    const catalog = await saveCatalog(body);
    setHeader(event, 'Cache-Control', 'no-store');
    return { success: true, catalog };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    console.error('[admin/catalog] Failed to save catalog:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Không thể lưu dữ liệu danh mục.',
    });
  }
});
