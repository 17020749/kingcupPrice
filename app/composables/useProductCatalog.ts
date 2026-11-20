import { computed, ref } from 'vue';
import { categories as fallbackCategories, sampleProducts } from '~/data/products';
import type { CatalogData } from '~/types/product';

export async function useProductCatalog() {
  const { data: catalog, refresh } = await useFetch<CatalogData>('/api/catalog', {
    key: 'kingcup-product-catalog',
    default: () => ({
      categories: fallbackCategories,
      products: sampleProducts,
      updatedAt: '',
    }),
  });

  const query = ref('');
  const category = ref('all');
  const sort = ref('featured');
  const products = computed(() => catalog.value?.products ?? sampleProducts);
  const categories = computed(() => catalog.value?.categories ?? fallbackCategories);

  const normalise = (value: string) => value
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('vi-VN');

  const filtered = computed(() => {
    let rows = products.value.filter((product) => {
      const matchesCategory = category.value === 'all' || product.categoryId === category.value;
      const searchable = [product.name, product.sku, product.category, product.description].join(' ');
      return matchesCategory && (!query.value || normalise(searchable).includes(normalise(query.value.trim())));
    });

    if (sort.value === 'asc') rows = [...rows].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort.value === 'desc') rows = [...rows].sort((a, b) => b.priceFrom - a.priceFrom);
    return rows;
  });

  function setCatalog(next: CatalogData) {
    catalog.value = next;
  }

  return { products, categories, query, category, sort, filtered, refresh, setCatalog };
}
