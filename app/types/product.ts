export type ProductVisual = 'box'|'tape'|'film'|'pouch'|'bubble'|'bag';

export interface ProductCategory {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category: string;
  description: string;
  priceFrom: number;
  unit: string;
  minOrder: number;
  leadTime: string;
  visual: ProductVisual;
  badge?: string;
  imageUrl?: string;
}

export interface QuoteLine {
  product: Product;
  quantity: number;
}

export interface CatalogData {
  categories: ProductCategory[];
  products: Product[];
  updatedAt: string;
}
