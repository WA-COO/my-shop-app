import { Product } from './types';

// Backend API URL Logic
const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction ? '/api' : 'http://localhost:3000/api';

export default API_BASE_URL;

export const TAIWAN_CITIES = [
  '台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '苗栗縣',
  '台中市', '彰化縣', '南投縣', '雲林縣', '嘉義市', '嘉義縣', '台南市',
  '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
];

// NOTE: 請保持這裡的連結與 server/seed.js 一致
export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '極致保濕玻尿酸精華',
    category: 'skincare',
    price: 1280,
    description: '深層補水，修復乾燥肌膚，讓肌膚重現水嫩光澤。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p1_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p1_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p1_3.png'
    ],
    features: ['高濃度玻尿酸', '無酒精', '敏感肌適用']
  },
  {
    id: 'p2',
    name: '絲絨柔霧持久粉底液',
    category: 'makeup',
    price: 1580,
    description: '輕薄服貼，24小時長效持妝，打造完美無瑕奶油肌。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p2_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p2_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p2_3.png'
    ],
    features: ['控油', '遮瑕', '不致痘']
  },
  {
    id: 'p3',
    name: '摩洛哥堅果修護髮油',
    category: 'hair',
    price: 980,
    description: '修護受損髮質，撫平毛躁，讓秀髮柔順亮麗。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p3_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p3_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p3_3.png'
    ],
    features: ['快速吸收', '不油膩', '花果香調']
  },
  {
    id: 'p4',
    name: '光采煥膚維他命C凍膜',
    category: 'skincare',
    price: 880,
    description: '改善暗沉，均勻膚色，夜間修護首選。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p4_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p4_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p4_3.png'
    ],
    features: ['亮白', '淡斑', '溫和不刺激']
  },
  {
    id: 'p5',
    name: '豐盈捲翹睫毛膏',
    category: 'makeup',
    price: 450,
    description: '根根分明，捲翹不塌，防水抗暈染。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p5_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p5_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p5_3.png'
    ],
    features: ['防水', '溫水可卸', '添加滋養成分']
  },
  {
    id: 'p6',
    name: '茶樹頭皮淨化洗髮精',
    category: 'hair',
    price: 680,
    description: '深層清潔頭皮，平衡油脂分泌，帶來清涼舒爽感。',
    image: 'https://storage.googleapis.com/glow-and-shine-product-images/p6_1.png',
    gallery: [
      'https://storage.googleapis.com/glow-and-shine-product-images/p6_2.png',
      'https://storage.googleapis.com/glow-and-shine-product-images/p6_3.png'
    ],
    features: ['涼感', '控油', '舒緩頭皮癢']
  }
];

export const MOCK_USER = {
  id: 'u1',
  name: '愛美小仙女',
  email: 'beauty@example.com'
};