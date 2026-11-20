import { computed, ref } from 'vue';
import { categories } from '~/data/products';
import { productRepository } from '~/repositories/productRepository';
const products = productRepository.getAll();
const norm = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLocaleLowerCase('vi-VN');
export function useProductCatalog(){
 const query=ref(''); const category=ref('all'); const sort=ref('featured');
 const filtered=computed(()=>{let rows=products.filter(p=>(category.value==='all'||p.categoryId===category.value)&&(!query.value||norm([p.name,p.sku,p.category,p.description].join(' ')).includes(norm(query.value.trim())))); if(sort.value==='asc') rows=[...rows].sort((a,b)=>a.priceFrom-b.priceFrom); if(sort.value==='desc') rows=[...rows].sort((a,b)=>b.priceFrom-a.priceFrom); return rows;});
 return {products,categories,query,category,sort,filtered};
}