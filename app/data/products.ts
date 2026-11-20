import type { Product } from '~/types/product';
export const categories = [{id:'all',label:'Tất cả'},{id:'carton',label:'Thùng carton'},{id:'tape',label:'Băng keo'},{id:'film',label:'Màng & vật liệu'},{id:'bag',label:'Túi đóng gói'}];
export const sampleProducts:Product[] = [
{id:'box5',sku:'KC-BOX-005',name:'Thùng carton 5 lớp',categoryId:'carton',category:'Thùng carton',description:'Kết cấu chắc chắn, phù hợp đóng gói và vận chuyển hàng hóa.',priceFrom:12500,unit:'thùng',minOrder:100,leadTime:'3–5 ngày',visual:'box',badge:'Được quan tâm'},
{id:'tape48',sku:'KC-TAPE-048',name:'Băng keo OPP 48mm',categoryId:'tape',category:'Băng keo',description:'Độ bám dính ổn định, dùng cho đóng gói thường ngày.',priceFrom:18500,unit:'cuộn',minOrder:50,leadTime:'2–4 ngày',visual:'tape'},
{id:'film17',sku:'KC-FILM-017',name:'Màng PE quấn pallet',categoryId:'film',category:'Màng & vật liệu',description:'Màng co giãn hỗ trợ cố định kiện hàng khi lưu kho.',priceFrom:52000,unit:'cuộn',minOrder:20,leadTime:'2–4 ngày',visual:'film',badge:'Giá theo số lượng'},
{id:'pouch26',sku:'KC-BAG-026',name:'Túi zipper kraft',categoryId:'bag',category:'Túi đóng gói',description:'Thiết kế gọn nhẹ, khóa kéo tiện dụng cho bán lẻ.',priceFrom:2450,unit:'túi',minOrder:500,leadTime:'5–7 ngày',visual:'pouch'},
{id:'bubble10',sku:'KC-WRAP-010',name:'Xốp hơi chống sốc',categoryId:'film',category:'Màng & vật liệu',description:'Lớp đệm khí bảo vệ sản phẩm dễ vỡ khi vận chuyển.',priceFrom:39000,unit:'cuộn',minOrder:30,leadTime:'2–4 ngày',visual:'bubble'},
{id:'bag42',sku:'KC-BAG-042',name:'Bao PP dệt',categoryId:'bag',category:'Túi đóng gói',description:'Bao bì đa dụng, có thể tùy chỉnh kích thước.',priceFrom:3200,unit:'bao',minOrder:300,leadTime:'5–7 ngày',visual:'bag'}
];