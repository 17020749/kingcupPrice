import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { readMultipartFormData } from 'h3';
import { assertAdmin, assertSameOrigin } from '../../utils/admin-auth';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

function hasValidSignature(data: Buffer, contentType: string): boolean {
  if (contentType === 'image/jpeg') {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (contentType === 'image/png') {
    return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (contentType === 'image/webp') {
    return data.toString('ascii', 0, 4) === 'RIFF'
      && data.toString('ascii', 8, 12) === 'WEBP';
  }
  if (contentType === 'image/avif') {
    return data.toString('ascii', 4, 12).includes('avif')
      || data.toString('ascii', 4, 12).includes('avis');
  }
  return false;
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event);
  assertAdmin(event);

  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === 'file' && Boolean(part.filename));

  if (!file?.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Vui lòng chọn một file ảnh.' });
  }

  const contentType = String(file.type || '').toLowerCase();
  const extension = IMAGE_TYPES[contentType];

  if (!extension || !hasValidSignature(file.data, contentType)) {
    throw createError({
      statusCode: 415,
      statusMessage: 'File không phải ảnh JPG, PNG, WebP hoặc AVIF hợp lệ.',
    });
  }

  if (file.data.length > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Ảnh vượt quá 4 MB. Hãy nén ảnh trước khi tải lên.',
    });
  }

  const pathname = 'images/products/' + Date.now() + '-' + randomUUID() + '.' + extension;

  try {
    const blob = await put(pathname, file.data, {
      access: 'public',
      addRandomSuffix: false,
      contentType,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error('[admin/upload] Blob upload failed:', error);
    throw createError({
      statusCode: 502,
      statusMessage: 'Không thể tải ảnh lên Vercel Blob. Hãy kiểm tra kết nối Blob Store.',
    });
  }
});
