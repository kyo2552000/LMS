'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[380px]">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-full duration-300
                            ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' : ''}
                            ${toast.type === 'error' ? 'bg-rose-50/90 border-rose-200 text-rose-900' : ''}
                            ${toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-900' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-900' : ''}
                        `}
                    >
                        <div className="shrink-0 mt-0.5">
                            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                            {toast.type === 'error' && <XCircle className="h-5 w-5 text-rose-600" />}
                            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                        </div>
                        <div className="flex-1 text-sm font-medium leading-tight">
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4 opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}
