'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, AlertCircle, LogOut, KeySquare } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Mật khẩu mới không khớp');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setIsSubmittingPassword(true);
        setPasswordError('');
        setPasswordSuccess('');

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPasswordError(data.error || 'Đổi mật khẩu thất bại');
            } else {
                setPasswordSuccess('Đổi mật khẩu thành công!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setIsChangingPassword(false);
                    setPasswordSuccess('');
                }, 2000);
            }
        } catch {
            setPasswordError('Lỗi kết nối mạng');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
                        {/* Header Background */}
                    </div>
                    
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-8">
                            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-4xl text-white font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                <p className="text-gray-500 flex items-center mt-1">
                                    <Mail className="h-4 w-4 mr-2" />
                                    {user.email}
                                </p>
                            </div>

                            <div className="grid gap-6 mt-8">
                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start space-x-4">
                                    <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                                        <Shield className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">Thông tin tài khoản</h3>
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center text-gray-600">
                                                <User className="h-5 w-5 mr-3 text-gray-400 shrink-0" />
                                                <span>Vai trò: <strong className="text-gray-900">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Học viên'}</strong></span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center text-gray-600">
                                                <div className="flex items-center mb-1 sm:mb-0">
                                                    <AlertCircle className="h-5 w-5 mr-3 text-gray-400 shrink-0" />
                                                    <span className="mr-2">ID thư mục lưu trữ:</span>
                                                </div>
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm text-gray-800 break-all">{user.id}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start space-x-4">
                                    <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                                        <KeySquare className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-900 text-lg">Bảo mật</h3>
                                            {!isChangingPassword && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setIsChangingPassword(true)}
                                                    className="cursor-pointer bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                                >
                                                    Đổi mật khẩu
                                                </Button>
                                            )}
                                        </div>

                                        {isChangingPassword && (
                                            <form onSubmit={handleChangePassword} className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                                                {passwordError && (
                                                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm border border-red-100">
                                                        {passwordError}
                                                    </div>
                                                )}
                                                {passwordSuccess && (
                                                    <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm border border-green-100">
                                                        {passwordSuccess}
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                                                    <input
                                                        type="password"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Nhập mật khẩu hiện tại"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Nhập lại mật khẩu mới"
                                                    />
                                                </div>

                                                <div className="flex space-x-3 pt-2">
                                                    <Button 
                                                        type="submit" 
                                                        disabled={isSubmittingPassword}
                                                        className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {isSubmittingPassword ? 'Đang cập nhật...' : 'Lưu mật khẩu'}
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        onClick={() => {
                                                            setIsChangingPassword(false);
                                                            setPasswordError('');
                                                            setPasswordSuccess('');
                                                            setCurrentPassword('');
                                                            setNewPassword('');
                                                            setConfirmPassword('');
                                                        }}
                                                        disabled={isSubmittingPassword}
                                                        className="cursor-pointer"
                                                    >
                                                        Hủy
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>

                                {user.role === 'ADMIN' ? (
                                    <Link href="/admin">
                                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-purple-100 p-3 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                                    <Shield className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">Trang quản trị</h3>
                                                    <p className="text-purple-600 text-sm mt-1">Truy cập bảng điều khiển quản trị viên</p>
                                                </div>
                                            </div>
                                            <div className="text-purple-600 font-bold group-hover:translate-x-1 transition-transform">
                                                &rarr;
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <Link href="/dashboard">
                                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group">
                                            <div className="flex items-center space-x-4">
                                                <div className="bg-purple-100 p-3 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                                    <User className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">Khóa học của tôi</h3>
                                                    <p className="text-purple-600 text-sm mt-1">Xem tiến độ học tập và các khóa học đã đăng ký</p>
                                                </div>
                                            </div>
                                            <div className="text-purple-600 font-bold group-hover:translate-x-1 transition-transform">
                                                &rarr;
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
