import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Minimize2, ShoppingBag, ChevronRight, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ChatMessage, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { API_BASE_URL } from '../constants'; // Only import URL, not PRODUCTS
import { Link } from 'react-router-dom';

// --- Helper Components ---

// 1. Loading Indicator (Typing bubble)
const TypingIndicator = () => (
  <div className="flex space-x-1 p-2">
    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
  </div>
);

// 2. Product Mini Card (Now accepts product data as prop)
const ProductMiniCard: React.FC<{ productId: string; allProducts: Product[] }> = ({ productId, allProducts }) => {
  // Look up product from the live fetched list, not static file
  const product = allProducts.find(p => p.id === productId);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link to={`/product/${product.id}`} className="mt-2 mb-1 p-3 bg-white border border-rose-100 rounded-xl shadow-sm flex items-center gap-3 animate-fade-in max-w-[280px] hover:shadow-md transition-shadow group">
      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-stone-800 truncate group-hover:text-rose-600 transition-colors">{product.name}</h4>
        <p className="text-rose-600 font-bold text-xs">NT$ {product.price}</p>
      </div>
      <button 
        onClick={handleAdd}
        className={`p-2 rounded-full transition-colors shrink-0 z-10 ${
          added ? 'bg-green-100 text-green-600' : 'bg-stone-900 text-white hover:bg-rose-600'
        }`}
        title="加入購物車"
      >
        <ShoppingBag size={14} />
      </button>
    </Link>
  );
};

// 3. Message Content Parser (Passes products down)
const MessageContent: React.FC<{ text: string; allProducts: Product[] }> = ({ text, allProducts }) => {
  // Regex to split by product tags like <<<p1>>>
  const parts = text.split(/(<<<.*?>>>)/g);

  return (
    <div className="space-y-1">
      {parts.map((part, index) => {
        // Check if part is a product tag
        if (part.startsWith('<<<') && part.endsWith('>>>')) {
          const productId = part.replace('<<<', '').replace('>>>', '');
          return <ProductMiniCard key={index} productId={productId} allProducts={allProducts} />;
        }

        // Parse basic markdown (Bold and Newlines)
        return (
          <span key={index} dangerouslySetInnerHTML={{ 
            __html: part
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>') // Bold with explicit class
              .replace(/\n/g, '<br />') // Newline
          }} />
        );
      })}
    </div>
  );
};

// --- Main Component ---

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '你好！我是 GlowBot 美妝顧問 🌸。請問有什麼我可以幫您的嗎？' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State to hold live product data
  const [products, setProducts] = useState<Product[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const hasInitialized = useRef(false);

  // Fetch products when ChatBot mounts (so we have data for cards)
  useEffect(() => {
    const fetchProductsForContext = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("ChatBot failed to fetch products for UI context", error);
      }
    };
    fetchProductsForContext();
  }, []);

  const PRESET_QUESTIONS = [
    "推薦適合我的保養品",
    "如何改善乾燥肌膚？",
    "有推薦的控油洗髮精嗎？",
    "目前有什麼優惠活動？"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
       // Pass user profile if available, GeminiService will fetch products internally for system prompt
       geminiService.startChat(user?.profile);
       hasInitialized.current = true;
    }
  }, [isOpen, user]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: text }]);
    setInputText('');
    setIsLoading(true);

    try {
      // Add a placeholder for streaming
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      const stream = await geminiService.sendMessageStream(text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = fullResponse;
          }
          return newMessages;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，我現在有點忙碌，請稍後再試。😢' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-rose-600/80 hover:bg-rose-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-rose-200 hover:scale-110 transition-all duration-300 z-50 opacity-70 hover:opacity-100 group"
      >
        <MessageCircle size={24} className="sm:w-7 sm:h-7 group-hover:animate-wiggle" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-rose-100 animate-slide-up font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 flex justify-between items-center text-white shadow-md z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">GlowBot 美妝顧問</h3>
            <div className="flex items-center text-[10px] text-rose-100 opacity-90">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
              在線服務中
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors hover:bg-white/20 rounded-full p-1"
        >
          <Minimize2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-stone-50 scrollbar-thin scrollbar-thumb-stone-200">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center mr-2 mt-1 text-rose-600 shrink-0 border border-rose-200">
                <Sparkles size={12} />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-rose-600 text-white rounded-br-none'
                  : 'bg-white text-stone-700 rounded-bl-none border border-stone-100'
              }`}
            >
              {/* Only render content if text is not empty (streaming logic) */}
              {/* Pass live products to the renderer */}
              {msg.text && <MessageContent text={msg.text} allProducts={products} />}
            </div>
          </div>
        ))}
        
        {/* Loading Bubble */}
        {isLoading && messages[messages.length - 1]?.text === '' && (
           <div className="flex justify-start animate-fade-in">
             <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center mr-2 mt-1 text-rose-600 shrink-0 border border-rose-200">
                <Sparkles size={12} />
             </div>
             <div className="bg-white p-2 rounded-2xl rounded-bl-none shadow-sm border border-stone-100">
                <TypingIndicator />
             </div>
           </div>
        )}

        {/* Preset Questions (Show whenever not loading) */}
        {!isLoading && (
          <div className="mt-4 grid grid-cols-1 gap-2 animate-slide-in pb-2">
            <p className="text-xs text-stone-400 ml-1 mb-1">您可以試著問...</p>
            {PRESET_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-left text-xs sm:text-sm bg-white border border-rose-100 text-stone-600 px-4 py-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex justify-between items-center group shadow-sm"
              >
                <span>{q}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-stone-100">
        <div className="flex items-center space-x-2 bg-stone-50 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-rose-100 focus-within:bg-white transition-all border border-transparent focus-within:border-rose-200">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="輸入您的問題..."
            className="flex-1 bg-transparent border-none focus:outline-none text-stone-700 text-sm placeholder-stone-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 transition-all shadow-md hover:shadow-rose-200 transform hover:scale-105"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;