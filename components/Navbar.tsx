'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, Search, ShoppingCart, User, Settings, ChevronDown, PencilLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import NotificationsMenu from '@/components/NotificationsMenu';

import { Suspense } from 'react';

function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const { cartCount, clearCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentSearch = (searchParams.get('search') || '').trim();

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/courses', label: 'Khóa học' },
    { href: '/about', label: 'Giới thiệu' },
    { href: '/contact', label: 'Liên hệ' },
    ...(user && user.role === 'ADMIN' ? [{ href: '/admin', label: 'Quản trị' }] : []),
    ...(user && user.role === 'INSTRUCTOR' ? [{ href: '/instructor/courses', label: 'Giảng dạy' }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    setMenuOpen(false);
    clearCart();
    await logout();
    router.push('/');
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  const goToCourseSearch = (query: string, replace = false) => {
    const trimmed = query.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) { params.set('search', trimmed); } else { params.delete('search'); }
    params.delete('page');
    const target = `/courses${params.toString() ? `?${params.toString()}` : ''}`;
    if (replace) { router.replace(target); return; }
    router.push(target);
  };

  useEffect(() => {
    if (pathname !== '/courses') return;
    const timeout = setTimeout(() => {
      if (searchQuery.trim() !== currentSearch) goToCourseSearch(searchQuery, true);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pathname, currentSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goToCourseSearch(searchQuery, pathname === '/courses');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline-block">
              EduLearn
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 shrink-0">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className="cursor-pointer font-medium"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3 shrink-0 flex-1 justify-end">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden lg:block w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
              />
            </form>

            <div className="flex items-center space-x-2 border-l pl-3 ml-2 border-gray-200">
              {/* Cart icon → /orders — only show when logged in as non-admin */}
              {!loading && user && user.role !== 'ADMIN' && (
                <Link href="/orders">
                  <Button variant="ghost" size="icon" className="relative cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Giỏ hàng & Đơn hàng">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              <NotificationsMenu />

              {/* Auth */}
              {loading ? (
                <div className="w-24 h-9 bg-gray-100 rounded-md animate-pulse" />
              ) : user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden xl:inline-block">{user.name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1.5">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                          <User className="h-4 w-4 text-gray-400" /> My Profile
                        </div>
                      </Link>
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                          <BookOpen className="h-4 w-4 text-gray-400" /> My Courses
                        </div>
                      </Link>
                      <Link href="/profile/settings" onClick={() => setMenuOpen(false)}>
                        <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                          <Settings className="h-4 w-4 text-gray-400" /> Settings
                        </div>
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 cursor-pointer font-medium">
                            <Settings className="h-4 w-4 text-purple-400" /> Admin Panel
                          </div>
                        </Link>
                      )}
                      {user.role === 'INSTRUCTOR' && (
                        <Link href="/instructor/courses" onClick={() => setMenuOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 cursor-pointer font-medium">
                            <PencilLine className="h-4 w-4 text-blue-400" /> Instructor
                          </div>
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="cursor-pointer rounded-full font-medium">Đăng nhập</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full font-medium text-white shadow-md hover:shadow-lg transition-all">Đăng ký</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-white/80" />}>
      <NavbarInner />
    </Suspense>
  );
}
