import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem, Product, Order, ShippingDetails, Coupon } from '../types';
import { useToast } from './ToastContext';
import { API_BASE_URL } from '../constants';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  selectedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon | null) => void;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
  placeOrder: (shippingDetails: ShippingDetails) => Promise<string>;
  orders: Order[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  // Effect: Fetch orders when user logs in
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user?.email) {
        setOrders([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/orders/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          // IMPORTANT: Map backend 'orderId' to frontend 'id' to ensure keys are unique and visible
          const mappedOrders = data.map((order: any) => ({
            ...order,
            id: order.orderId // Ensure frontend uses the readable Order ID
          }));
          setOrders(mappedOrders);
        }
      } catch (error) {
        console.error("Failed to fetch history orders:", error);
      }
    };

    fetchUserOrders();
  }, [user?.email]);

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    addToast(`已加入購物車：${product.name}`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setSelectedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
  };

  // Logic: Subtotal calculations
  const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Logic: Discount
  const discountAmount = selectedCoupon ? selectedCoupon.amount : 0;

  // Logic: Subtotal after discount
  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);

  // Logic: Free shipping if (subtotal - discount) >= 1000, otherwise 100
  const shippingFee = (items.length > 0 && discountedSubtotal < 1000) ? 100 : 0;
  
  const finalTotal = discountedSubtotal + shippingFee;

  // Backend Integration: placeOrder
  const placeOrder = async (shippingDetails: ShippingDetails): Promise<string> => {
    try {
      const orderPayload = {
        userId: user?.id || 'guest',
        userEmail: user?.email || 'guest',
        items: items,
        subtotal: cartSubtotal,
        discount: discountAmount,
        shippingFee: shippingFee,
        total: finalTotal,
        shippingDetails: shippingDetails
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '訂單建立失敗');
      }

      const newOrder: Order = {
         id: data.orderId || `ORD-${Date.now()}`,
         date: new Date().toISOString(),
         items: [...items],
         subtotal: cartSubtotal,
         discount: discountAmount,
         shippingFee: shippingFee,
         total: finalTotal,
         status: 'pending',
         shippingDetails: shippingDetails
      };
      
      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      addToast('訂單已送出！', 'success');
      return newOrder.id;
    } catch (e: any) {
      console.error(e);
      addToast(e.message || '訂單送出失敗', 'error');
      throw e;
    }
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartSubtotal,
      selectedCoupon,
      applyCoupon,
      discountAmount,
      shippingFee,
      finalTotal,
      placeOrder,
      orders
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};