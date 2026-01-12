import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package, Sparkles, LogIn, ChevronDown, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="bg-gradient-to-tr from-rose-400 to-rose-600 text-white p-2 rounded-lg shadow-md shadow-rose-200 group-hover:shadow-rose-300 transition-all">
              <Sparkles size={18} />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-rose-900 truncate max-w-[120px] sm:max-w-none">
              Glow & Shine
            </span>
          </Link>

          {/* Actions Section */}
          <div className="flex items-center gap-4 sm:gap-6">

            {/* Cart Icon */}
            <Link to="/cart" aria-label="購物車" className="relative text-stone-600 hover:text-rose-600 transition-colors group p-2">
              <ShoppingBag size={24} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Center / Login */}
            {user ? (
              <div className="relative group z-50">
                {/* Dropdown Trigger */}
                <button aria-label="User menu" className="flex items-center space-x-2 text-stone-600 hover:text-rose-600 transition-colors py-2 focus:outline-none">
                  <div className="bg-rose-100 p-1.5 rounded-full text-rose-600">
                    <User size={20} />
                  </div>
                  <ChevronDown size={14} className="transition-transform group-hover:rotate-180 duration-300" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden ring-1 ring-black ring-opacity-5">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                      <p className="text-xs text-stone-500">登入身份</p>
                      <p className="text-sm font-bold text-stone-800 truncate">{user.name}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <UserCircle size={16} className="mr-3 text-stone-400 group-hover:text-rose-500" />
                        會員中心
                      </Link>

                      <Link
                        to="/orders"
                        className="flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Package size={16} className="mr-3 text-stone-400 group-hover:text-rose-500" />
                        我的訂單
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors text-left"
                      >
                        <LogOut size={16} className="mr-3 text-stone-400 group-hover:text-rose-500" />
                        登出
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all transform hover:-translate-y-0.5"
              >
                <span>登入</span>
                <LogIn size={16} className="ml-1.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;