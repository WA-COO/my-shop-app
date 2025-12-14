import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, CreditCard, MapPin, Truck, Ticket } from 'lucide-react';
import { TAIWAN_CITIES, API_BASE_URL } from '../constants';
import { ShippingDetails } from '../types';

const Checkout: React.FC = () => {
  const { items, cartSubtotal, shippingFee, finalTotal, placeOrder, selectedCoupon, applyCoupon, discountAmount } = useCart();
  const { user, useCoupon } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Remove step 3 (success) because we will redirect to ECPay
  const [step, setStep] = useState(1); 

  // Form State
  const [formData, setFormData] = useState<ShippingDetails>({
    lastName: '',
    firstName: '',
    phone: '',
    city: '台北市',
    address: '',
    paymentMethod: 'credit_card'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    setLoading(true);

    try {
      // 1. 建立資料庫訂單 (MongoDB)
      const orderId = await placeOrder(formData);
      
      // 2. 消耗折價券
      if (selectedCoupon) {
        await useCoupon(selectedCoupon.code);
      }

      // 3. 呼叫後端取得綠界付款表單 HTML
      const response = await fetch(`${API_BASE_URL}/payment/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId })
      });

      if (!response.ok) {
        throw new Error('無法連接金流服務');
      }

      const html = await response.text();

      // 4. 將 HTML 寫入文件並自動送出 (跳轉到綠界)
      document.body.innerHTML = html;
      // 執行表單內的 script (有些瀏覽器 innerHTML 不會執行 script，需手動處理)
      // 但上面的後端回傳包含 <script>document.getElementById("ecpay-form").submit();</script>
      // 為了保險，我們手動尋找 form 並 submit
      const form = document.getElementById('ecpay-form') as HTMLFormElement;
      if (form) {
        form.submit();
      } else {
        // 如果 innerHTML 沒效，我們用更暴力的方式
        // 重新 eval script 部分
        const scriptContent = html.match(/<script>(.*?)<\/script>/)?.[1];
        if (scriptContent) {
           // eslint-disable-next-line no-eval
           eval(scriptContent); 
        }
      }

    } catch (error) {
      console.error(error);
      setLoading(false);
      setStep(1); // 回到表單
      alert('結帳發生錯誤，請稍後再試');
    }
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const couponCode = e.target.value;
    if (!couponCode) {
      applyCoupon(null);
      return;
    }
    const coupon = user?.coupons?.find(c => c.code === couponCode);
    if (coupon) {
      applyCoupon(coupon);
    }
  };

  if (items.length === 0 && step === 1) {
    navigate('/');
    return null;
  }

  if (step === 2) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Loader2 size={48} className="animate-spin text-rose-600 mb-4" />
        <h2 className="text-2xl font-bold text-stone-800 mb-2">正在前往綠界付款...</h2>
        <p className="text-stone-500">請勿關閉視窗，即將跳轉至安全支付頁面。</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-4xl mx-auto animate-fade-in px-4 sm:px-0 pb-24 sm:pb-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-8 text-center sm:text-left">結帳資訊</h1>

      {/* Main Layout Container */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column (Desktop) / Top Section (Mobile): Form */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-stone-100 order-1">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-stone-100">
            <MapPin className="text-rose-500" />
            <h2 className="text-lg font-bold text-stone-800">收件資訊</h2>
          </div>
          
          <form id="checkout-form" onSubmit={handlePayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">姓氏</label>
                <input 
                  type="text" 
                  name="lastName"
                  required 
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                  placeholder="王" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">名字</label>
                <input 
                  type="text" 
                  name="firstName"
                  required 
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                  placeholder="小美" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">電話號碼</label>
              <input 
                type="tel" 
                name="phone"
                required 
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                placeholder="0912-345-678" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">縣市</label>
              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none appearance-none bg-white"
                >
                  {TAIWAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">詳細地址</label>
              <input 
                type="text" 
                name="address"
                required 
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" 
                placeholder="信義路五段7號89樓" 
              />
            </div>

            <div className="pt-6 mt-6 border-t border-stone-100">
              <div className="flex items-center space-x-2 mb-6">
                <CreditCard className="text-rose-500" />
                <h2 className="text-lg font-bold text-stone-800">付款方式</h2>
              </div>
              
              <div className="space-y-3">
                 <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-stone-50 transition-colors has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="credit_card"
                      checked={formData.paymentMethod === 'credit_card'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500" 
                    />
                    <span className="ml-3 font-medium text-stone-700">綠界支付 (信用卡/ATM)</span>
                 </label>
                 {/* 暫時隱藏 LINE Pay，統一走綠界 */}
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (Desktop) / Bottom Section (Mobile): Summary */}
        <div className="w-full md:w-80 space-y-6 order-2">
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center">
              <Truck className="mr-2 text-stone-600" size={20} />
              訂單內容
            </h2>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1 mr-2">
                    <span className="block font-medium text-stone-800">{item.name}</span>
                    <span className="text-stone-500">x {item.quantity}</span>
                  </div>
                  <span className="font-bold text-stone-700 whitespace-nowrap">NT$ {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-stone-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>商品小計</span>
                <span>NT$ {cartSubtotal}</span>
              </div>

              {/* Coupon Selector */}
              <div className="py-2">
                <label className="block text-xs font-bold text-stone-500 mb-1 flex items-center">
                   <Ticket size={12} className="mr-1" /> 使用折價券
                </label>
                <select 
                  className="w-full text-sm p-2 rounded-lg border border-stone-300 bg-white"
                  onChange={handleCouponChange}
                  value={selectedCoupon?.code || ''}
                >
                  <option value="">不使用折價券</option>
                  {user?.coupons?.map(coupon => (
                    <option key={coupon.id} value={coupon.code}>
                      {coupon.description} (-NT${coupon.amount})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCoupon && (
                 <div className="flex justify-between text-rose-600 font-medium">
                   <span>折扣金額</span>
                   <span>- NT$ {discountAmount}</span>
                 </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>運費</span>
                {shippingFee === 0 ? (
                  <span className="text-rose-600 font-medium">免運費</span>
                ) : (
                   <span>NT$ {shippingFee}</span>
                )}
              </div>
              
              {shippingFee > 0 && (
                <div className="text-xs text-stone-400 text-right">
                  (折扣後滿 $1000 免運)
                </div>
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-stone-200">
                <span className="font-bold text-lg text-stone-800">結帳金額</span>
                <span className="font-bold text-2xl text-rose-600">NT$ {finalTotal}</span>
              </div>
            </div>
          </div>

          <button 
            form="checkout-form"
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-600 shadow-xl shadow-stone-200 hover:shadow-rose-200 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
          >
            {loading ? '處理中...' : `確認付款 (NT$ ${finalTotal})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;