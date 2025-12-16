export interface Product {
  id: string;
  name: string;
  category: 'skincare' | 'makeup' | 'hair';
  price: number;
  description: string;
  image: string;
  gallery?: string[]; // 新增：額外的商品圖片
  features: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  amount: number;
  description: string;
}

export interface UserProfile {
  skinType: 'dry' | 'oily' | 'mixed' | 'sensitive' | 'normal' | '';
  hairType: 'fine' | 'coarse' | 'damaged' | 'normal' | '';
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
  coupons?: Coupon[];
}

export interface ShippingDetails {
  lastName: string;
  firstName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: string;
}

export interface Order {
  id: string;
  date: string;       // 下單時間 (Created At)
  paidAt?: string;    // 新增：付款時間
  shippedAt?: string; // 新增：出貨時間
  completedAt?: string; // 新增：完成時間
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: 'pending' | 'paid' | 'shipping' | 'completed';
  shippingDetails?: ShippingDetails;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}