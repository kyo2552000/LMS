'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormLabel, FormControl } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Lock, Check, AlertCircle, User, Mail, Shield } from 'lucide-react';

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(t);
        }
    }, [message]);

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        if (currentPassword === newPassword) {
            setMessage({ type: 'error', text: 'New password must be different from current password' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            } else {
                setMessage({ type: 'success', text: 'Password changed successfully! 🎉' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) return null;

    // Password strength indicator
    const getPasswordStrength = (pw: string) => {
        if (!pw) return { level: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 6) score++;
        if (pw.length >= 10) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;

        if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
        if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
        if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-green-500' };
        return { level: 5, label: 'Very Strong', color: 'bg-emerald-500' };
    };

    const strength = getPasswordStrength(newPassword);

    return (
        <div className="py-12 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Cài đặt 
                    </h1>
                    <p className="text-muted-foreground">Quản lý tài khoản và bảo mật</p>
                </div>

                {/* Profile Info Card */}
                <Card className="rounded-2xl shadow-md border-0 mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <User className="h-5 w-5 text-blue-500" />
                            <span>Thông tin cá nhân</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-2xl font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{user.name}</h3>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm mt-1">
                                        <Shield className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card className="rounded-2xl shadow-md border-0">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <Lock className="h-5 w-5 text-purple-500" />
                            <span>Thay đổi mật khẩu</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Message */}
                        {message && (
                            <div
                                className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm ${message.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                            >
                                {message.type === 'success' ? (
                                    <Check className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <Form onSubmit={handleChangePassword}>
                            <FormField>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl
                                    type="password"
                                    placeholder="Enter your current password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </FormField>

                            <div className="border-t my-4" />

                            <FormField>
                                <FormLabel>Mật khẩu mới</FormLabel>
                                <FormControl
                                    type="password"
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                {/* Password Strength */}
                                {newPassword && (
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Strength: <span className="font-medium">{strength.label}</span>
                                        </p>
                                    </div>
                                )}
                            </FormField>

                            <FormField>
                                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                <FormControl
                                    type="password"
                                    placeholder="Xác nhận mật khẩu mới"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
                                )}
                                {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                                    <p className="text-xs text-green-500 mt-1 flex items-center space-x-1">
                                        <Check className="h-3 w-3" />
                                        <span>Mật khẩu khớp</span>
                                    </p>
                                )}
                            </FormField>

                            <Button
                                type="submit"
                                disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                className="w-full mt-6 cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang thay đổi mật khẩu...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Thay đổi mật khẩu
                                    </>
                                )}
                            </Button>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
