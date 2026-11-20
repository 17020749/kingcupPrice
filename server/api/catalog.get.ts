import { getCatalog } from '../utils/catalog-store';

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=15');

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
