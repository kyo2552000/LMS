'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => {
    const e = searchParams.get('error');
    if (e === 'google_cancelled') return 'Đăng nhập Google đã bị hủy.';
    if (e === 'google_token') return 'Không thể xác thực với Google. Vui lòng thử lại.';
    if (e === 'server') return 'Lỗi máy chủ. Vui lòng thử lại sau.';
    return '';
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(result.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px] -z-10 mix-blend-multiply" />

      <Card className="w-full max-w-[420px] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 bg-white/80 backdrop-blur-xl relative z-10 mx-4">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Chào mừng trở lại
          </CardTitle>
          <CardDescription className="text-base text-slate-500 mt-2">
            Đăng nhập vào tài khoản của bạn để tiếp tục
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-10 pt-4">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/80 backdrop-blur-md border border-red-100 flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
               <div className="w-1.5 h-full absolute left-0 top-0 bottom-0 bg-red-500 rounded-l-xl" />
               <span className="relative z-10 pl-2">{error}</span>
            </div>
          )}

          <Form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Email / Tài khoản</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                <Link href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                 Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center text-sm pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
                <span className="text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 mt-4 rounded-xl text-base font-bold shadow-md hover:shadow-lg bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-[0.98]"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang xử lý...</>
              ) : (
                'Đăng nhập ngay'
              )}
            </Button>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">Hoặc tiếp tục với</span>
              </div>
            </div>

            <a
              href="/api/auth/google"
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              {/* Google SVG icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Đăng nhập với Google
            </a>
          </div>

          <div className="mt-6 text-center text-sm border-t border-slate-100 pt-6">
            <span className="text-slate-500">Chưa có tài khoản? </span>
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
              Đăng ký miễn phí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Suspense } from 'react';
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid items-center justify-center">Đang tải...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
