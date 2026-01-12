import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../pages/Login';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock AuthContext values
const mockLogin = vi.fn();
const mockRegister = vi.fn();

const renderLogin = () => {
    return render(
        <AuthContext.Provider value={{
            user: null,
            login: mockLogin,
            register: mockRegister,
            logout: vi.fn(),
            updateProfile: vi.fn(),
            useCoupon: vi.fn(),
            isAuthenticated: false
        }}>
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        </AuthContext.Provider>
    );
};

describe('Login Component', () => {
    it('renders login form by default', () => {
        renderLogin();
        expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();

        // Check for button text which might be inside "登入" span or similar
        // Using getAllByText to be safe or checking button specifically
        expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
    });

    it('switches between login and register', () => {
        renderLogin();
        const switchButton = screen.getByText('還沒有帳號？ 點此註冊');
        fireEvent.click(switchButton);
        expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
        expect(screen.getByText('已經有帳號？ 點此登入')).toBeInTheDocument();
    });

    it('calls login function on submit', async () => {
        renderLogin();
        const emailInput = screen.getByPlaceholderText('Email address');
        const passwordInput = screen.getByPlaceholderText('Password');
        // The button text is "登入"
        const submitButton = screen.getByRole('button', { name: /登入/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
});
