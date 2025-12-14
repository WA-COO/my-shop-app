import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Package, Calendar, ChevronDown, ChevronUp, MapPin, CreditCard, Check, Circle, Truck, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Orders: React.FC = () => {
  const { orders } = useCart();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'paid': return 2;     // 理貨確認
      case 'shipping': return 3; // 出貨準備
      case 'completed': return 4; // 配送完成
      default: return 1;
    }
  };

  const getStatusText = (status: string) => {
     switch (status) {
        case 'pending': return '等待付款';
        case 'paid': return '理貨準備';
        case 'shipping': return '出貨中';
        case 'completed': return '配送完成';
        default: return '處理中';
     }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
         <div className="bg-stone-100 p-6 rounded-full mb-6 text-stone-400">
            <Package size={48} />
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">尚無訂單記錄</h2>
        <p className="text-stone-500 mb-8">快去挑選您喜歡的商品吧！</p>
        <Link 
          to="/" 
          className="bg-stone-900 text-white px-8 py-3 rounded-full font-medium hover:bg-stone-700 transition-colors"
        >
          前往購物
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 animate-fade-in max-w-4xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 px-4 gap-4">
        <h1 className="text-3xl font-bold text-stone-800">我的訂單</h1>
        
        {/* Order Search */}
        <div className="relative w-full sm:w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-4 w-4 text-stone-400" />
           </div>
           <input
             type="text"
             className="block w-full pl-9 pr-9 py-2 border border-stone-200 rounded-xl leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm transition-all"
             placeholder="搜尋單號或商品..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
             >
               <X className="h-4 w-4" />
             </button>
           )}
        </div>
      </div>
      
      <div className="space-y-6 px-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-100">
             <p className="text-stone-500">找不到符合 "{searchQuery}" 的訂單。</p>
             <button onClick={() => setSearchQuery('')} className="mt-2 text-rose-600 text-sm font-bold">清除搜尋</button>
          </div>
        ) : (
          filteredOrders.map(order => {
            const currentStep = getStatusStep(order.status);
            const orderDate = new Date(order.date);
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                
                {/* 1. Header: Status (Mobile First) & ID */}
                <div className="bg-stone-50 px-5 py-3 border-b border-stone-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  
                  {/* Mobile: Row 1 (Status) / Desktop: Right Side */}
                  <div className="self-start sm:self-auto sm:order-last">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipping' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'paid' ? 'bg-stone-200 text-stone-700' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  {/* Mobile: Row 2 (ID & Date) / Desktop: Left Side */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 sm:order-first">
                    <span className="font-bold text-stone-800 tracking-wide text-sm sm:text-base">訂單編號：{order.id}</span>
                    <span className="text-xs text-stone-400 flex items-center">
                      <Calendar size={12} className="mr-1" />
                      {orderDate.toLocaleDateString()}
                    </span>
                  </div>

                </div>

                {/* 2. Product Items (Always Visible) */}
                <div className="p-5 space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-100 shrink-0">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-stone-800 text-sm line-clamp-2">{item.name}</h4>
                          <span className="font-medium text-stone-600 text-sm ml-2">NT$ {item.price}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Footer: Total & Actions */}
                <div className="px-5 py-4 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-stone-800">
                    <span className="text-sm">訂單金額：</span>
                    <span className="text-lg font-bold text-rose-600">NT$ {order.total}</span>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(order.id)}
                    className="w-full sm:w-auto px-6 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center justify-center gap-2"
                  >
                    {isExpanded ? '收起詳情' : '查看詳情'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* 4. Expandable Details: Timeline, Address, Price Breakdown */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-stone-50/50 ${isExpanded ? 'max-h-[800px] border-t border-stone-100' : 'max-h-0'}`}>
                  <div className="p-5 sm:p-8 space-y-8">
                    
                    {/* Timeline */}
                    <div className="relative flex items-center justify-between z-0 px-2 sm:px-8">
                      {/* Background Line (Restricted width with mx-4) */}
                      <div className="absolute left-0 right-0 mx-4 top-3.5 h-0.5 bg-stone-200 -z-10"></div>
                      
                      {/* Active Line (Calculated width) */}
                      <div 
                        className="absolute left-0 mx-4 top-3.5 h-0.5 bg-stone-800 -z-10 transition-all duration-1000 ease-out" 
                        style={{ width: `${((currentStep - 1) / 3) * 100}%` }} 
                      ></div>

                      {[
                        { step: 1, label: '訂單成立' },
                        { step: 2, label: '理貨準備' },
                        { step: 3, label: '出貨中' },
                        { step: 4, label: '配送完成' }
                      ].map((s) => (
                        <div key={s.step} className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-[3px] border-white z-10 ${currentStep >= s.step ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-400'}`}>
                            {currentStep >= s.step ? <Check size={12} /> : <Circle size={10} />}
                          </div>
                          <span className={`text-[10px] sm:text-xs mt-2 font-bold ${currentStep >= s.step ? 'text-stone-800' : 'text-stone-400'}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200/50">
                      {/* Shipping Info */}
                      {order.shippingDetails && (
                        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                          <h4 className="font-bold text-stone-700 mb-3 text-sm flex items-center">
                            <MapPin size={16} className="mr-2 text-rose-500" /> 收件資訊
                          </h4>
                          <div className="text-sm space-y-1 text-stone-600">
                            <p><span className="text-stone-400 mr-2">收件人:</span> {order.shippingDetails.lastName}{order.shippingDetails.firstName}</p>
                            <p><span className="text-stone-400 mr-2">電話:</span> {order.shippingDetails.phone}</p>
                            <p><span className="text-stone-400 mr-2">地址:</span> {order.shippingDetails.city}{order.shippingDetails.address}</p>
                            <p><span className="text-stone-400 mr-2">付款:</span> {order.shippingDetails.paymentMethod === 'credit_card' ? '綠界支付 (ECPay)' : '其他'}</p>
                          </div>
                        </div>
                      )}

                      {/* Price Breakdown */}
                      <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-center">
                        <h4 className="font-bold text-stone-700 mb-3 text-sm flex items-center">
                          <CreditCard size={16} className="mr-2 text-rose-500" /> 金額明細
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-stone-500">
                            <span>商品小計</span>
                            <span>NT$ {order.subtotal || 0}</span>
                          </div>
                          
                          {(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-rose-600">
                              <span>折價券折扣</span>
                              <span>- NT$ {order.discount}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-stone-500">
                            <span>運費</span>
                            <span>NT$ {order.shippingFee || 0}</span>
                          </div>
                          
                          <div className="border-t border-stone-100 mt-2 pt-2 flex justify-between items-center">
                            <span className="font-bold text-stone-800">總付款金額</span>
                            <span className="font-bold text-rose-600 text-lg">NT$ {order.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
