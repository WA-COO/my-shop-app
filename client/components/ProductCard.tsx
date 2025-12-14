import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const { addToCart } = useCart();

  // Handle add to cart click to prevent navigation when clicking the button
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    addToCart(product);
  };

  if (layout === 'list') {
    return (
      <Link to={`/product/${product.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-stone-100 group flex flex-row h-full">
        {/* Image Section - Fixed width on mobile, larger on desktop */}
        <div className="relative w-28 sm:w-48 aspect-[3/4] sm:aspect-auto shrink-0 bg-stone-100 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name} 
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
             <span className="px-1.5 py-0.5 sm:px-2 bg-white/90 backdrop-blur-sm rounded text-[10px] font-bold text-stone-600 uppercase tracking-wide shadow-sm">
              {product.category === 'skincare' ? '保養' : product.category === 'makeup' ? '彩妝' : '美髮'}
            </span>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-2">
              <h3 className="text-sm sm:text-lg font-bold text-stone-800 leading-tight line-clamp-2 group-hover:text-rose-600 transition-colors">{product.name}</h3>
              <p className="text-rose-600 font-bold text-sm sm:text-lg whitespace-nowrap sm:ml-4 mt-1 sm:mt-0">NT$ {product.price}</p>
            </div>
            {/* Description hidden on very small screens, shown line-clamped on mobile, full on desktop */}
            <p className="text-stone-500 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">{product.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
              {product.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="text-[10px] sm:text-xs text-stone-400 bg-stone-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md border border-stone-100">
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="self-start px-3 py-1.5 sm:px-6 sm:py-2 bg-stone-900 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 hover:bg-rose-600 active:bg-rose-700 transition-colors shadow-sm hover:shadow-md z-10"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span>加入購物車</span>
          </button>
        </div>
      </Link>
    );
  }

  // Grid Layout (Default)
  return (
    <Link to={`/product/${product.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 group flex flex-col h-full">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <img 
          src={product.image} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-semibold text-stone-600 uppercase tracking-wide">
            {product.category === 'skincare' ? '保養' : product.category === 'makeup' ? '彩妝' : '美髮'}
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-bold text-stone-800 mb-1 leading-tight group-hover:text-rose-600 transition-colors">{product.name}</h3>
          <p className="text-rose-600 font-bold text-lg sm:text-xl mb-2 sm:mb-3">NT$ {product.price}</p>
          <p className="text-stone-500 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.description}</p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {product.features.map((feature, index) => (
              <span key={index} className="text-[10px] sm:text-xs text-stone-400 bg-stone-50 px-2 py-1 rounded-md">
                {feature}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleAddToCart}
          className="w-full bg-stone-900 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium flex items-center justify-center space-x-2 hover:bg-rose-600 active:bg-rose-700 transition-colors shadow-sm hover:shadow-md z-10"
        >
          <Plus size={18} />
          <span>加入購物車</span>
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
