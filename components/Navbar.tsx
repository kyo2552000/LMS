'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Menu, User, LogOut, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const currentSearch = (searchParams.get('search') || '').trim();

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/courses', label: 'Khóa học' },
    { href: '/about', label: 'Giới thiệu' },
    { href: '/contact', label: 'Liên hệ' },
    ...(user && user.role === 'ADMIN' ? [{ href: '/admin', label: 'Quản trị' }] : []),
    ...(user && user.role !== 'ADMIN' ? [{ href: '/dashboard', label: 'Khóa học của tôi' }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    setSearchQuery(currentSearch);
  }, [currentSearch]);

  const goToCourseSearch = (query: string, replace = false) => {
    const trimmed = query.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }

    params.delete('page');

    const target = `/courses${params.toString() ? `?${params.toString()}` : ''}`;
    if (replace) {
      router.replace(target);
      return;
    }
    router.push(target);
  };

  useEffect(() => {
    if (pathname !== '/courses') return;

    const timeout = setTimeout(() => {
      if (searchQuery.trim() !== currentSearch) {
        goToCourseSearch(searchQuery, true);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery, pathname, currentSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goToCourseSearch(searchQuery, pathname === '/courses');
    setMobileMenuOpen(false);
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

          {/* Right Actions (Search, Cart, Auth) */}
          <div className="hidden md:flex items-center space-x-3 shrink-0 flex-1 justify-end">

            {/* Search Bar */}
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
              {/* Cart Icon */}
              {(!user || user.role !== 'ADMIN') && (
                <Link href="/orders">
                  <Button variant="ghost" size="icon" className="relative cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Giỏ hàng">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              {/* Auth Buttons / User Menu */}
              {loading ? (
                <div className="w-24 h-9 bg-gray-100 rounded-md animate-pulse" />
              ) : user ? (
                <div className="relative flex items-center space-x-2 ml-1">
                  <Link href="/settings">
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 border hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden xl:inline-block">
                        {user.name}
                      </span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="cursor-pointer text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                    title="Đăng xuất"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="cursor-pointer rounded-full font-medium">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full font-medium text-white shadow-md hover:shadow-lg transition-all">
                      Đăng ký
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - Also added cart icon for mobile */}
          <div className="md:hidden flex items-center space-x-1 shrink-0">
            {/* Mobile Cart Icon */}
            {(!user || user.role !== 'ADMIN') && (
              <Link href="/orders">
                <Button variant="ghost" size="icon" className="cursor-pointer text-gray-600" title="Giỏ hàng">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {user && (
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="cursor-pointer text-gray-600">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="cursor-pointer text-gray-600"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-3">
            {/* Mobile Search */}
            <div className="px-2">
              <form onSubmit={handleSearch} className="relative w-full">
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
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? 'default' : 'ghost'}
                    className="w-full justify-start cursor-pointer rounded-lg text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>

            <div className="pt-3 space-y-2 border-t px-2 border-gray-100">
              {user ? (
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 justify-start"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button
                      className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg border-0"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
