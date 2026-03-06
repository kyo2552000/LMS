'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Phone, Mail, MapPin, Clock, Send, MessageSquare, Headphones,
    ArrowRight, CheckCircle, Globe, Facebook, Instagram
} from 'lucide-react';

const contactMethods = [
    {
        icon: Phone,
        title: 'Hỗ trợ qua điện thoại',
        detail: 'T2-T6, 8:00 - 17:00',
        value: '+84 (0) 123 456 789',
        action: 'Gọi ngay',
        href: 'tel:+84123456789',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
    },
    {
        icon: Mail,
        title: 'Hỗ trợ qua email',
        detail: 'Phản hồi trong vòng 2 giờ',
        value: 'support@edulearn.com',
        action: 'Gửi email',
        href: 'mailto:support@edulearn.com',
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
    },
    {
        icon: MessageSquare,
        title: 'Chat trực tuyến',
        detail: 'Hoạt động 24/7',
        value: 'Trò chuyện với đội ngũ',
        action: 'Bắt đầu chat',
        href: '#',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
    },
];




const socials = [
    { icon: Facebook, name: 'Facebook', handle: 'EduLearn Vietnam', followers: '45K', href: '#', color: 'hover:bg-blue-50 hover:border-blue-200' },
    { icon: Globe, name: 'LinkedIn', handle: 'EduLearn', followers: '20K', href: '#', color: 'hover:bg-sky-50 hover:border-sky-200' },
    { icon: Instagram, name: 'Instagram', handle: '@edulearn_vn', followers: '30K', href: '#', color: 'hover:bg-pink-50 hover:border-pink-200' },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-28 overflow-hidden">
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                            <Headphones className="h-4 w-4 mr-2" />
                            Liên Hệ
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Hãy{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Liên Hệ
                            </span>
                            {' '}Với Chúng Tôi
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Bạn có câu hỏi về khóa học? Cần hỗ trợ kỹ thuật? Đội ngũ thân thiện của chúng tôi
                            luôn sẵn sàng giúp bạn thành công trên hành trình học tập.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#contact-form">
                                <button className="px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center">
                                    Gửi tin nhắn
                                    <Send className="h-5 w-5 ml-2" />
                                </button>
                            </a>
                            <Link href="/courses">
                                <button className="px-8 py-3.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer">
                                    Xem khóa học
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Methods */}
            <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            Chọn cách liên hệ phù hợp với bạn
                        </h2>
                        <p className="text-gray-500">Nhiều hình thức liên lạc — hãy chọn cách thuận tiện nhất</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {contactMethods.map((method, i) => {
                            const Icon = method.icon;
                            return (
                                <a key={i} href={method.href} className="group">
                                    <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 text-center h-full">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                                        <p className="text-xs text-gray-400 mb-3">{method.detail}</p>
                                        <p className="text-sm font-medium text-gray-700 mb-4">{method.value}</p>
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full ${method.bgColor} text-sm font-medium group-hover:shadow-md transition-all`}>
                                            {method.action}
                                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                        </span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Contact Form + Offices */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Form */}
                        <div id="contact-form">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gửi tin nhắn cho chúng tôi</h2>
                            <p className="text-gray-500 mb-8">Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>

                            {submitted && (
                                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center space-x-2 text-green-700">
                                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm.</span>
                                </div>
                            )}
                            

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Họ tên</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Chủ đề</label>
                                    <select
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                    >
                                        <option value="">Chọn chủ đề</option>
                                        <option value="general">Câu hỏi chung</option>
                                        <option value="course">Về khóa học</option>
                                        <option value="technical">Hỗ trợ kỹ thuật</option>
                                        <option value="payment">Thanh toán & Hoàn tiền</option>
                                        <option value="partnership">Hợp tác giảng dạy</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nội dung</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Mô tả chi tiết câu hỏi hoặc vấn đề của bạn..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Gửi tin nhắn
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
