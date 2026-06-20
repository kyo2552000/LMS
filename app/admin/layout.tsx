'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, ShoppingCart,
    MessageSquare, Shield, Loader2, Tag, FolderOpen, LogOut,
    Settings, ChevronRight, Menu, X, Star, HardDrive
} from 'lucide-react';
import Image from 'next/image';

const sidebarItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/roles', label: 'Roles', icon: Shield },
    { href: '/admin/files', label: 'Files', icon: HardDrive },
];

const bottomItems = [
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') return null;

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const getPageTitle = () => {
        const item = [...sidebarItems, ...bottomItems].find(i =>
            i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)
        );
        return item?.label || 'Admin Panel';
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* ── Sidebar ───────────────────────────────────────────── */}
            <aside
                className={`flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 flex-shrink-0 relative z-20 ${sidebarOpen ? 'w-64' : 'w-[72px]'
                    }`}
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 px-5 py-6 border-b border-slate-800 ${!sidebarOpen ? 'justify-center px-0' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    {sidebarOpen && (
                        <span className="font-extrabold text-white text-lg tracking-tight">Edu Learn</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map((item) => {
                        const active = isActive(item.href, item.exact);
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    title={!sidebarOpen ? item.label : undefined}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group ${active
                                        ? 'bg-indigo-600/10 text-indigo-400'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                        } ${!sidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${active ? 'text-indigo-400' : 'group-hover:text-slate-300'}`} />
                                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                                    {sidebarOpen && active && <ChevronRight className="h-4 w-4 ml-auto text-indigo-400 opacity-50" />}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider + Settings */}
                <div className="px-3 py-4 border-t border-slate-800 space-y-1">
                    {bottomItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    title={!sidebarOpen ? item.label : undefined}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer group ${active ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0 transition-colors group-hover:text-slate-300" />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-slate-700">
                            {user.avatar ? (
                                <Image src={user.avatar} alt={user.name} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        {sidebarOpen && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                    <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => { document.cookie = 'auth_token=; Max-Age=0; path=/'; router.push('/login'); }}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main ──────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                {/* Topbar */}
                <header className="flex items-center px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex-shrink-0 z-10 sticky top-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-lg hover:text-slate-700 transition-colors cursor-pointer mr-3"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <span className="text-base font-bold text-slate-800 tracking-tight">{getPageTitle()}</span>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-slate-50 scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
