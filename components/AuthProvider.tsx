'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string; user?: User }>;
    register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { error: data.error || 'Đăng nhập thất bại' };
            }

            setUser(data.user);
            return { user: data.user };
        } catch {
            return { error: 'Lỗi mạng' };
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { error: data.error || 'Đăng ký thất bại' };
            }

            setUser(data.user);
            return {};
        } catch {
            return { error: 'Lỗi mạng' };
        }
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
}
