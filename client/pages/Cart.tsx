import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, CreditCard, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, cartSubtotal, shippingFee, finalTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-stone-100 p-6 rounded-full mb-6 text-stone-400">
            <CreditCard size={48} />
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">您的購物車是空的</h2>
        <p className="text-stone-500 mb-8 max-w-sm">
          看起來您還沒有挑選任何商品。去逛逛我們的精選好物吧！
        </p>
        <Link 
          to="/" 
          className="bg-rose-600 text-white px-8 py-3 rounded-full font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
        >
          開始購物
        </Link>
      </div>
    );
  }

  const freeShippingLeft = Math.max(0, 1000 - cartSubtotal);

  return (
    <div className="py-8 animate-fade-in pb-24 sm:pb-8">
      <Link to="/" className="inline-flex items-center text-stone-500 hover:text-rose-600 mb-6 transition-colors">
        <ArrowLeft size={18} className="mr-1" />
        繼續購物
      </Link>
      
      <h1 className="text-3xl font-bold text-stone-800 mb-8">我的購物車 ({items.length})</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Shipping Progress */}
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-4 flex items-center">
            <Truck className="text-rose-600 mr-3" size={20} />
            <div className="flex-1">
               {freeShippingLeft > 0 ? (
                 <p className="text-rose-800 text-sm">
                   再消費 <span className="font-bold">NT$ {freeShippingLeft}</span> 即可享免運優惠！
                 </p>
               ) : (
                 <p className="text-rose-800 text-sm font-bold">
                   恭喜！您已符合免運資格 🎉
                 </p>
               )}
               <div className="w-full bg-rose-200 rounded-full h-1.5 mt-2">
                 <div 
                   className="bg-rose-600 h-1.5 rounded-full transition-all duration-500" 
                   style={{ width: `${Math.min(100, (cartSubtotal / 1000) * 100)}%` }}
                 ></div>
               </div>
            </div>
          </div>

          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-row items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 bg-stone-50 rounded-xl overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col sm:block">
                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-stone-800 leading-tight">{item.name}</h3>
                  <p className="text-stone-500 text-xs sm:text-sm mt-1">{item.category === 'skincare' ? '臉部保養' : item.category === 'makeup' ? '彩妝' : '髮品'}</p>
                </div>
                <div className="font-bold text-rose-600 sm:hidden">NT$ {item.price}</div>
              </div>

              <div className="font-bold text-rose-600 hidden sm:block text-lg">NT$ {item.price}</div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-1 sm:space-x-3 bg-stone-50 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-md hover:bg-white hover:shadow-sm text-stone-500 transition-all disabled:opacity-30"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-bold text-stone-700 text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-md hover:bg-white hover:shadow-sm text-stone-500 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                  title="移除商品"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-lg border border-rose-50 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-stone-800 mb-6">訂單摘要</h2>
            
            <div className="space-y-3 text-sm text-stone-600 mb-6 border-b border-stone-100 pb-6">
              <div className="flex justify-between">
                <span>小計</span>
                <span>NT$ {cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>運費</span>
                {shippingFee === 0 ? (
                  <span className="text-rose-600 font-medium">免運費</span>
                ) : (
                  <span>NT$ {shippingFee}</span>
                )}
              </div>
              {shippingFee === 0 && (
                <div className="flex justify-between text-rose-600 text-xs">
                  <span>(已達 $1000 免運門檻)</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-stone-800">總金額</span>
              <span className="text-2xl font-bold text-rose-600">NT$ {finalTotal}</span>
            </div>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-stone-900 text-white py-4 rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-lg hover:shadow-xl hover:shadow-rose-100 flex items-center justify-center"
            >
              <span>{user ? '前往結帳' : '登入後結帳'}</span>
              <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;