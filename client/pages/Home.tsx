import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Filter, LayoutGrid, List, Loader2, AlertCircle, Search, X } from 'lucide-react';

const Home: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'skincare' | 'makeup' | 'hair'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile UI States
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // State for fetching data
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
          throw new Error('無法取得商品資料');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError('無法連線到伺服器，請確認後端是否已啟動。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter Logic: Category AND Smart Fuzzy Search
  const filteredProducts = products.filter(p => {
    // 1. Category Match
    const matchesCategory = filter === 'all' || p.category === filter;

    // 2. Search Logic
    const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    
    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => {
      const lowerName = p.name.toLowerCase();
      const lowerDesc = p.description.toLowerCase();
      // Combine features into a single string for easier searching
      const lowerFeatures = p.features.map(f => f.toLowerCase());
      
      // A. Standard Exact Match (Substring)
      const basicMatch = lowerName.includes(term) || 
                         lowerDesc.includes(term) || 
                         lowerFeatures.some(f => f.includes(term));
      
      if (basicMatch) return true;

      // B. Smart Fuzzy Match for Chinese (e.g., "保濕精華" matches "保濕...精華")
      // Only apply if the term contains Chinese characters and is longer than 1 char
      if (term.length > 1 && /[\u4e00-\u9fa5]/.test(term)) {
        try {
           // Create a regex that allows any characters between the search characters
           // e.g. "保濕精華" -> /保.*濕.*精.*華/
           const escapedTerm = term.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
           const regex = new RegExp(escapedTerm);
           
           return regex.test(lowerName) || 
                  regex.test(lowerDesc) || 
                  lowerFeatures.some(f => regex.test(f));
        } catch (e) {
           return false;
        }
      }
      
      return false;
    });

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'skincare', label: '臉部保養' },
    { id: 'makeup', label: '時尚彩妝' },
    { id: 'hair', label: '美髮護理' },
  ] as const;

  const HERO_IMAGE_URL = "https://storage.googleapis.com/glow-and-shine-product-images/logo.png";

  return (
    <div className="py-8 animate-fade-in relative">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-rose-900 text-white mb-8 md:mb-12 shadow-2xl h-[300px] md:h-[400px]">
        <img 
          src={HERO_IMAGE_URL}
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" // 調整 opacity 可改變亮度
        />
        {/* 深色漸層遮罩，確保文字清晰 */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-gradient-to-t from-rose-900/90 to-transparent">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight shadow-sm">煥發自信光采</h1>
          <p className="text-lg md:text-xl text-rose-100 max-w-2xl font-light shadow-sm">
            探索我們精選的頂級保養與彩妝系列，為您的肌膚注入自然活力。
          </p>
        </div>
      </div>

      {/* ==================================================================
          MOBILE TOOLBAR (Inline Expansion)
         ================================================================== */}
      <div className="md:hidden mb-8">
        <div className="flex justify-between items-center px-1 h-12 relative">
          
          {/* State A: Normal Toolbar */}
          <div className={`flex w-full justify-between items-center transition-all duration-300 absolute inset-0 ${isMobileSearchOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="flex-1 mr-3 flex items-center space-x-2 text-stone-500 bg-white px-4 py-2.5 rounded-full shadow-sm border border-stone-100 active:scale-95 transition-transform"
            >
              <Search size={18} />
              <span className="text-sm font-medium">搜尋商品...</span>
            </button>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className={`p-2.5 rounded-full shadow-sm border transition-colors ${
                  isMobileFilterOpen || filter !== 'all' 
                    ? 'bg-rose-600 text-white border-rose-600' 
                    : 'bg-white text-stone-500 border-stone-100'
                }`}
              >
                <Filter size={18} />
              </button>
              
              <button
                onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                className="p-2.5 rounded-full bg-white text-stone-500 shadow-sm border border-stone-100 active:scale-95"
              >
                {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
              </button>
            </div>
          </div>

          {/* State B: Expanded Search Input */}
          <div className={`flex w-full items-center transition-all duration-300 absolute inset-0 ${isMobileSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}`}>
            <div className="flex-1 relative">
              <input
                type="text"
                autoFocus={isMobileSearchOpen}
                className="w-full bg-white text-stone-800 rounded-full py-2.5 pl-10 pr-10 border border-rose-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
                placeholder="輸入關鍵字"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-stone-400" size={18} />
              {searchQuery ? (
                 <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-stone-400"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <button 
              onClick={() => {
                setIsMobileSearchOpen(false);
                if (!searchQuery) setIsMobileFilterOpen(false); 
              }}
              className="ml-3 font-medium text-stone-500 hover:text-stone-800"
            >
              取消
            </button>
          </div>

        </div>

        {/* Collapsible Filter Drawer */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMobileFilterOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === cat.id
                    ? 'bg-stone-800 text-white shadow-md'
                    : 'bg-white text-stone-600 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================================
          DESKTOP TOOLBAR (Fixed Jitter)
         ================================================================== */}
      <div className="hidden md:flex flex-row justify-between items-center gap-4 mb-8 bg-transparent">
        {/* Search Bar */}
        <div className="relative w-72 lg:w-96 order-1">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-stone-400" />
           </div>
           <input
             type="text"
             className="block w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-full leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
             placeholder="搜尋商品..."
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

        {/* Right Actions */}
        <div className="flex flex-row w-auto items-center gap-4 order-2">
          {/* Filter Tabs - Fixed width/border to prevent jitter */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center mr-1 text-stone-500 font-medium lg:flex">
              <Filter size={18} className="mr-2" />
              <span className="hidden lg:inline">篩選：</span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                  filter === cat.id
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 border-transparent'
                    : 'bg-white text-stone-600 hover:bg-rose-50 border-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              title="網格模式"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              title="列表模式"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-rose-600 w-10 h-10" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
          <AlertCircle className="w-10 h-10 mb-4 text-rose-400" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Active Filter Tags (Mobile Only Visual Cue) */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {searchQuery && (
               <span className="flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 whitespace-nowrap">
                 搜尋: {searchQuery}
                 <button onClick={() => setSearchQuery('')} className="ml-2"><X size={12}/></button>
               </span>
            )}
            {filter !== 'all' && (
               <span className="flex items-center px-3 py-1 rounded-full bg-stone-800 text-white text-xs font-bold whitespace-nowrap">
                 {categories.find(c => c.id === filter)?.label}
                 <button onClick={() => setFilter('all')} className="ml-2"><X size={12}/></button>
               </span>
            )}
          </div>

          {/* Product Grid/List */}
          <div className={`grid gap-4 md:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} layout={viewMode} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
              <p className="text-stone-400 text-lg">找不到符合條件的商品。</p>
              {(searchQuery || filter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="mt-4 text-rose-600 font-medium hover:underline"
                >
                  清除所有篩選條件
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;