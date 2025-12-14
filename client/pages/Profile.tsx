import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Ticket, Save, Sparkles, UserCircle, Check } from 'lucide-react';
import { UserProfile } from '../types';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'coupons'>('profile');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [profileData, setProfileData] = useState<UserProfile>({
    skinType: user?.profile?.skinType || '',
    hairType: user?.profile?.hairType || ''
  });

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    
    // updateProfile now returns the success message string
    const msg = await updateProfile(profileData);
    
    setLoading(false);
    setSuccessMessage(msg);

    // Auto clear message after 3 seconds
    setTimeout(() => {
        setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="py-8 max-w-4xl mx-auto animate-fade-in px-4">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-rose-100 p-3 rounded-full text-rose-600">
           <UserCircle size={32} />
        </div>
        <div>
           <h1 className="text-3xl font-bold text-stone-800">會員中心</h1>
           <p className="text-stone-500">管理您的個人檔案與優惠券</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-stone-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          個人資料
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'coupons'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          我的折價券
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100 animate-fade-in">
           <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center">
             <User size={20} className="mr-2 text-rose-500" />
             基本資料
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div>
               <label className="block text-sm font-medium text-stone-500 mb-1">會員姓名</label>
               <div className="w-full px-4 py-3 bg-stone-50 rounded-xl border border-stone-100 text-stone-800">
                 {user.name}
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-stone-500 mb-1">電子郵件</label>
               <div className="w-full px-4 py-3 bg-stone-50 rounded-xl border border-stone-100 text-stone-800">
                 {user.email}
               </div>
             </div>
           </div>

           <div className="border-t border-stone-100 pt-8">
             <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center">
               <Sparkles size={20} className="mr-2 text-rose-500" />
               膚質與髮質設定
             </h2>
             <p className="text-sm text-stone-500 mb-6">
               完善以下資料，我們將能為您推薦更適合的產品。
               {!user.profile?.skinType && <span className="text-rose-600 font-bold ml-1">首次填寫可獲得 $100 折價券！</span>}
             </p>

             <form onSubmit={handleSave} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-stone-700 mb-2">肌膚狀況</label>
                   <select
                     value={profileData.skinType}
                     onChange={(e) => setProfileData(prev => ({ ...prev, skinType: e.target.value as any }))}
                     className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                   >
                     <option value="">請選擇膚質</option>
                     <option value="dry">乾性肌膚 (Dry)</option>
                     <option value="oily">油性肌膚 (Oily)</option>
                     <option value="mixed">混合性肌膚 (Mixed)</option>
                     <option value="sensitive">敏感性肌膚 (Sensitive)</option>
                     <option value="normal">中性肌膚 (Normal)</option>
                   </select>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-stone-700 mb-2">髮質狀況</label>
                   <select
                     value={profileData.hairType}
                     onChange={(e) => setProfileData(prev => ({ ...prev, hairType: e.target.value as any }))}
                     className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                   >
                     <option value="">請選擇髮質</option>
                     <option value="fine">細軟髮 (Fine)</option>
                     <option value="coarse">粗硬髮 (Coarse)</option>
                     <option value="damaged">受損髮 (Damaged)</option>
                     <option value="normal">一般髮質 (Normal)</option>
                   </select>
                 </div>
               </div>

               <div className="flex items-center justify-end space-x-4">
                 {successMessage && (
                   <span className="text-sm font-medium text-green-600 flex items-center animate-fade-in">
                     <Check size={16} className="mr-1" /> {successMessage}
                   </span>
                 )}
                 <button
                   type="submit"
                   disabled={loading}
                   className="bg-stone-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center disabled:opacity-70"
                 >
                   {loading ? '儲存中...' : '儲存設定'}
                   <Save size={18} className="ml-2" />
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="animate-fade-in">
           {(!user.coupons || user.coupons.length === 0) ? (
             <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-stone-100">
               <div className="bg-stone-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-stone-400">
                 <Ticket size={32} />
               </div>
               <h3 className="text-lg font-bold text-stone-800 mb-2">目前沒有可用的折價券</h3>
               <p className="text-stone-500">請至「個人資料」完善膚質與髮質設定，即可獲得首購優惠！</p>
               <button 
                 onClick={() => setActiveTab('profile')}
                 className="mt-6 text-rose-600 font-medium hover:text-rose-700 underline"
               >
                 前往設定
               </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {user.coupons.map(coupon => (
                 <div key={coupon.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 flex relative group hover:shadow-md transition-shadow">
                   {/* Left Decoration */}
                   <div className="w-3 bg-rose-500"></div>
                   
                   {/* Content */}
                   <div className="p-5 flex-1">
                     <div className="flex justify-between items-start mb-2">
                       <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded">折價券</span>
                       <span className="text-2xl font-bold text-rose-600">NT$ {coupon.amount}</span>
                     </div>
                     <h3 className="font-bold text-stone-800 mb-1">{coupon.description}</h3>
                     <p className="text-stone-400 text-xs">適用於全站商品 • 無使用期限</p>
                     
                     <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                       <span className="text-xs text-stone-500">折扣碼：<span className="font-mono font-bold text-stone-700">{coupon.code}</span></span>
                       <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">可使用</span>
                     </div>
                   </div>

                   {/* Circle Cutouts (Visual Effect) */}
                   <div className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-stone-50 rounded-full"></div>
                   <div className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-stone-50 rounded-full"></div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Profile;