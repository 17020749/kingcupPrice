import { get, head, put } from '@vercel/blob';
import { categories, sampleProducts } from '../../app/data/products';
import type { CatalogData, Product, ProductCategory, ProductVisual } from '../../app/types/product';

const CATALOG_PATH = 'data/catalog.json';
const VALID_VISUALS: ProductVisual[] = ['box', 'tape', 'film', 'pouch', 'bubble', 'bag'];
const CACHE_TTL_MS = 10_000;

// Module memory is reused by warm serverless instances. It is an optimization only;
// Blob remains the source of truth because Vercel may create or recycle instances.
let cachedCatalog: { value: CatalogData; expiresAt: number } | null = null;
let pendingRead: Promise<CatalogData> | null = null;

function cloneCatalog(value: CatalogData): CatalogData {
  return {
    categories: value.categories.map((item) => ({ ...item })),
    products: value.products.map((item) => ({ ...item })),
    updatedAt: value.updatedAt,
  };
}

function setMemoryCache(value: CatalogData) {
  cachedCatalog = {
    value: cloneCatalog(value),
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

function makeDefaultCatalog(): CatalogData {
  return {
    categories: categories as ProductCategory[],
    products: sampleProducts.map((product) => ({ ...product })),
    updatedAt: new Date().toISOString(),
  };
}

async function downloadCatalog(): Promise<CatalogData | null> {
  // get(pathname) resolves the known object directly; unlike list(), it does not
  // enumerate the store before reading the catalog.
  const result = await get(CATALOG_PATH, { access: 'public' });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const input = await new Response(result.stream).json();
  return normaliseCatalog(input);
}

export function normaliseCatalog(input: unknown): CatalogData {
  if (!input || typeof input !== 'object') {
    throw new Error('Dữ liệu danh mục không hợp lệ.');
  }

  const source = input as { categories?: unknown; products?: unknown };
  if (!Array.isArray(source.products) || source.products.length > 500) {
    throw new Error('Danh sách sản phẩm không hợp lệ hoặc vượt quá 500 sản phẩm.');
  }

  const rawCategories = Array.isArray(source.categories) ? source.categories : categories;
  const safeCategories: ProductCategory[] = rawCategories
    .slice(0, 40)
    .filter((item: any) => item && typeof item.id === 'string' && typeof item.label === 'string')
    .map((item: any) => ({
      id: item.id.trim().slice(0, 40),
      label: item.label.trim().slice(0, 60),
    }))
    .filter((item: ProductCategory) => item.id && item.label);

  const categoryIds = new Set(safeCategories.map((item) => item.id));
  if (!safeCategories.length || categoryIds.size !== safeCategories.length) {
    throw new Error('Danh mục bị trống hoặc có ID trùng lặp.');
  }

  const categoryMap = new Map(safeCategories.map((item) => [item.id, item.label]));
  const productIds = new Set<string>();
  const productSkus = new Set<string>();

  const safeProducts: Product[] = source.products.map((item: any) => {
    if (!item || typeof item !== 'object') throw new Error('Một sản phẩm có dữ liệu không hợp lệ.');

    const id = String(item.id ?? '').trim().slice(0, 80);
    const name = String(item.name ?? '').trim().slice(0, 140);
    const sku = String(item.sku ?? '').trim().slice(0, 60);
    const categoryId = String(item.categoryId ?? '').trim().slice(0, 40);

    if (!id || !name || !sku) throw new Error('Mỗi sản phẩm cần có ID, tên và SKU.');
    if (productIds.has(id)) throw new Error('ID sản phẩm bị trùng: ' + id);
    if (productSkus.has(sku.toLowerCase())) throw new Error('SKU sản phẩm bị trùng: ' + sku);
    if (!categoryMap.has(categoryId)) throw new Error('Danh mục không tồn tại cho sản phẩm ' + name);

    productIds.add(id);
    productSkus.add(sku.toLowerCase());

    const price = Number(item.priceFrom);
    const minimum = Number(item.minOrder);
    const imageUrl = typeof item.imageUrl === 'string'
      && /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(item.imageUrl)
      ? item.imageUrl.slice(0, 2000)
      : undefined;

    return {
      id,
      sku,
      name,
      categoryId,
      category: categoryMap.get(categoryId) ?? 'Khác',
      description: String(item.description ?? '').trim().slice(0, 400),
      priceFrom: Number.isFinite(price) ? Math.max(0, Math.floor(price)) : 0,
      unit: String(item.unit ?? 'cái').trim().slice(0, 24) || 'cái',
      minOrder: Number.isFinite(minimum) ? Math.max(1, Math.floor(minimum)) : 1,
      leadTime: String(item.leadTime ?? 'Liên hệ').trim().slice(0, 50),
      visual: VALID_VISUALS.includes(item.visual) ? item.visual : 'box',
      ...(typeof item.badge === 'string' && item.badge.trim()
        ? { badge: item.badge.trim().slice(0, 40) }
        : {}),
      ...(imageUrl ? { imageUrl } : {}),
    };
  });

  return {
    categories: safeCategories,
    products: safeProducts,
    updatedAt: new Date().toISOString(),
  };
}

export async function getCatalog(): Promise<CatalogData> {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cloneCatalog(cachedCatalog.value);
  }

  if (pendingRead) return cloneCatalog(await pendingRead);

  pendingRead = (async () => {
    const existing = await downloadCatalog();
    if (existing) {
      setMemoryCache(existing);
      return existing;
    }

    // First-run bootstrap only. Subsequent reads use direct get(pathname).
    const initial = makeDefaultCatalog();
    await put(CATALOG_PATH, JSON.stringify(initial), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 60,
    });
    setMemoryCache(initial);
    return initial;
  })();

  try {
    return cloneCatalog(await pendingRead);
  } finally {
    pendingRead = null;
  }
}

export async function saveCatalog(input: unknown): Promise<CatalogData> {
  const nextCatalog = normaliseCatalog(input);

  try {
    // One metadata request replaces the previous list() operation. Keep the ETag
    // precondition so concurrent admin writes cannot silently overwrite each other.
    const currentBlob = await head(CATALOG_PATH);
    await put(CATALOG_PATH, JSON.stringify(nextCatalog), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json; charset=utf-8',
      cacheControlMaxAge: 60,
      ifMatch: currentBlob.etag,
    });
  } catch (error: any) {
    if (error?.name === 'BlobNotFoundError') {
      // Catalog may not exist yet in a fresh store.
      await put(CATALOG_PATH, JSON.stringify(nextCatalog), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json; charset=utf-8',
        cacheControlMaxAge: 60,
      });
    } else if (error?.name === 'BlobPreconditionFailedError') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Dữ liệu vừa được thay đổi ở nơi khác. Hãy tải lại trang quản trị rồi thử lại.',
      });
    } else {
      throw error;
    }
  }

  // Update the current warm instance immediately; other instances refresh within
  // CACHE_TTL_MS and the public API edge cache has a short TTL as well.
  setMemoryCache(nextCatalog);
  return cloneCatalog(nextCatalog);
}
