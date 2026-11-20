export type ProductVisual = 'box'|'tape'|'film'|'pouch'|'bubble'|'bag';
export interface Product { id:string; sku:string; name:string; categoryId:string; category:string; description:string; priceFrom:number; unit:string; minOrder:number; leadTime:string; visual:ProductVisual; badge?:string; }
export interface QuoteLine { product:Product; quantity:number; }