require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// 這是從你的 constants.ts 複製過來的初始資料
const INITIAL_PRODUCTS = [
  {
    id: 'p1',
    name: '極致保濕玻尿酸精華',
    category: 'skincare',
    price: 1280,
    description: '深層補水，修復乾燥肌膚，讓肌膚重現水嫩光澤。',
    image: 'https://picsum.photos/400/400?random=1',
    features: ['高濃度玻尿酸', '無酒精', '敏感肌適用']
  },
  {
    id: 'p2',
    name: '絲絨柔霧持久粉底液',
    category: 'makeup',
    price: 1580,
    description: '輕薄服貼，24小時長效持妝，打造完美無瑕奶油肌。',
    image: 'https://picsum.photos/400/400?random=2',
    features: ['控油', '遮瑕', '不致痘']
  },
  {
    id: 'p3',
    name: '摩洛哥堅果修護髮油',
    category: 'hair',
    price: 980,
    description: '修護受損髮質，撫平毛躁，讓秀髮柔順亮麗。',
    image: 'https://picsum.photos/400/400?random=3',
    features: ['快速吸收', '不油膩', '花果香調']
  },
  {
    id: 'p4',
    name: '光采煥膚維他命C凍膜',
    category: 'skincare',
    price: 880,
    description: '改善暗沉，均勻膚色，夜間修護首選。',
    image: 'https://picsum.photos/400/400?random=4',
    features: ['亮白', '淡斑', '溫和不刺激']
  },
  {
    id: 'p5',
    name: '豐盈捲翹睫毛膏',
    category: 'makeup',
    price: 450,
    description: '根根分明，捲翹不塌，防水抗暈染。',
    image: 'https://picsum.photos/400/400?random=5',
    features: ['防水', '溫水可卸', '添加滋養成分']
  },
  {
    id: 'p6',
    name: '茶樹頭皮淨化洗髮精',
    category: 'hair',
    price: 680,
    description: '深層清潔頭皮，平衡油脂分泌，帶來清涼舒爽感。',
    image: 'https://picsum.photos/400/400?random=6',
    features: ['涼感', '控油', '舒緩頭皮癢']
  }
];

const seedDB = async () => {
  try {
    // 1. 連線資料庫
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 資料庫連線成功');

    // 2. 清空 Products 表 (這就是刪除語法)
    await Product.deleteMany({});
    console.log('🗑️  舊商品資料已清除');

    // 3. 插入新資料
    await Product.insertMany(INITIAL_PRODUCTS);
    console.log('✅ 初始商品資料已匯入');

    process.exit(0);
  } catch (err) {
    console.error('❌ 初始化失敗:', err);
    process.exit(1);
  }
};

seedDB();