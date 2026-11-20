import { sampleProducts } from '~/data/products';
import type { Product } from '~/types/product';
// Replace this implementation with an API-backed repository when a backend is added.
export const productRepository = { getAll():Product[] { return [...sampleProducts]; } };