import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { API_BASE_URL } from '../constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => Promise<string>;
  useCoupon: (code: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. 初始化時嘗試從 localStorage 讀取使用者資料
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Failed to parse user from local storage', error);
      return null;
    }
  });

  // Helper to update state and localStorage
  const saveUser = (userData: User | null, token: string | null = null) => {
    setUser(userData);
    if (userData && token) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  // Backend Integration: Login
  const login = async (email: string, password?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登入失敗');
      }

      // 2. 登入成功，儲存到 LocalStorage
      saveUser(data.user, data.token);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  // Backend Integration: Register
  const register = async (email: string, name: string, password?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '註冊失敗');
      }

      // 3. 註冊成功自動登入，儲存到 LocalStorage
      saveUser(data.user, data.token);
    } catch (error) {
      console.error("Register Error:", error);
      throw error;
    }
  };

  // Backend Integration: Update Profile
  const updateProfile = async (profile: UserProfile): Promise<string> => {
    if (!user) return '請先登入';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skinType: profile.skinType, // Remove email from body, use token
          hairType: profile.hairType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新失敗');
      }

      // 4. 更新資料時同步更新 LocalStorage
      // Note: We don't get a new token here, but we keep the old one
      saveUser(data.user, token);

      return data.message;
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      return error.message || '更新失敗';
    }
  };

  // Backend Integration: Use Coupon
  const useCoupon = async (code: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/coupon/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code // Remove email from body, use token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '折價券使用失敗');
      }

      // 5. 更新資料時同步更新 LocalStorage (因為折價券被用掉了)
      const updatedUser = { ...user, coupons: data.coupons };
      saveUser(updatedUser, token);

    } catch (error) {
      console.error("Use Coupon Error:", error);
    }
  };

  const logout = () => {
    // 6. 登出時清除 LocalStorage
    saveUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, useCoupon, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};