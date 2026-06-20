'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, BookOpen, Settings, LogOut, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const navItems = [
    { href: '/profile', label: 'Account', icon: User, exact: true },
    { href: '/dashboard', label: 'My Courses', icon: BookOpen },
    { href: '/profile/settings', label: 'Settings', icon: Settings },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) return null;

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const handleLogout = () => {
        document.cookie = 'auth_token=; Max-Age=0; path=/';
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-6xl mx-auto px-4 flex gap-6">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* User Info */}
                        <div className="p-6 text-center border-b border-gray-100">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                                {user.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{user.name}</h3>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>

                        {/* Nav */}
                        <nav className="p-3 space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href, item.exact);
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${active
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}>
                                            <item.icon className="h-4 w-4 flex-shrink-0" />
                                            {item.label}
                                        </div>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full cursor-pointer transition-all mt-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
