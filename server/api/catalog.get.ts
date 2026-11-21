import { getCatalog } from '../utils/catalog-store';

export default defineEventHandler(async (event) => {
  // Short shared edge cache keeps public reads fast without leaving product data stale for long.
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=5, stale-while-revalidate=5');

  try {
    return await getCatalog();
  } catch (error) {
    console.error('[catalog] Failed to load catalog:', error);
    throw createError({
      statusCode: 503,
      statusMessage: 'Chưa đọc được dữ liệu từ Vercel Blob. Hãy kiểm tra kết nối Blob Store với môi trường Production hoặc Preview.',
    });
  }
});
