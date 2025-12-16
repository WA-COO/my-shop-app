import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { API_BASE_URL } from '../constants';
import { ArrowLeft, Minus, Plus, ShoppingBag, Loader2, Share2, ShieldCheck, Truck } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Since backend currently only supports get all, we fetch all and find. 
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products: Product[] = await response.json();
        const found = products.find(p => p.id === id);
        
        if (found) {
          setProduct(found);
          setMainImage(found.image);
        } else {
          setError('找不到此商品');
        }
      } catch (err) {
        setError('無法載入商品資料');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      // Add quantity times
      for(let i=0; i<quantity; i++) {
        addToCart(product);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="animate-spin text-rose-600 w-8 h-8" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-stone-500">
        <p className="mb-4 text-lg">{error || '商品不存在'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-700 transition-colors"
        >
          返回首頁
        </button>
      </div>
    );
  }

  // 使用資料庫中的 gallery，如果沒有則只顯示主圖
  const thumbnails = product.gallery && product.gallery.length > 0 
    ? [product.image, ...product.gallery] 
    : [product.image];

  return (
    <div className="py-8 animate-fade-in pb-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb / Back */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-stone-500 hover:text-rose-600 transition-colors mb-6 group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          返回
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-stone-50 rounded-2xl overflow-hidden border border-stone-100">
              <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
              />
            </div>
            {/* Thumbnails */}
            {thumbnails.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                 {thumbnails.map((img, idx) => (
                   <button 
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-rose-500 ring-2 ring-rose-100' : 'border-transparent hover:border-stone-200'}`}
                   >
                     <img src={img} alt="" className="w-full h-full object-cover" />
                   </button>
                 ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                {product.category === 'skincare' ? '臉部保養' : product.category === 'makeup' ? '時尚彩妝' : '秀髮護理'}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2 leading-tight">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                 <span className="text-3xl font-bold text-rose-600">NT$ {product.price}</span>
                 <span className="text-sm text-stone-400 line-through">NT$ {Math.round(product.price * 1.2)}</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-lg">{product.description}</p>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h3 className="font-bold text-stone-800 mb-3 text-sm uppercase tracking-wider">商品特色</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-b border-stone-100 py-6 mb-8 space-y-4">
               <div className="flex items-center text-sm text-stone-500">
                  <Truck size={18} className="mr-3 text-stone-400" />
                  <span>全館滿 NT$ 1,000 免運費</span>
               </div>
               <div className="flex items-center text-sm text-stone-500">
                  <ShieldCheck size={18} className="mr-3 text-stone-400" />
                  <span>100% 正品保證，7天鑑賞期</span>
               </div>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-stone-50 rounded-xl border border-stone-200 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-white rounded-lg transition-colors text-stone-500"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-white rounded-lg transition-colors text-stone-500"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-200 flex items-center justify-center space-x-2 active:scale-[0.98]"
                >
                  <ShoppingBag size={20} />
                  <span>加入購物車</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;