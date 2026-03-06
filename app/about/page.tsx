import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Users, Award, Globe, Target, Heart, Lightbulb, Zap, GraduationCap, Star, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Về Chúng Tôi - EduLearn | Nền tảng học trực tuyến',
    description: 'Khám phá câu chuyện của EduLearn - nền tảng giáo dục trực tuyến giúp mọi người tiếp cận kiến thức chất lượng cao, mọi lúc, mọi nơi.',
};

const stats = [
    { icon: Users, value: '10,000+', label: 'Học viên', color: 'from-blue-500 to-blue-600' },
    { icon: BookOpen, value: '200+', label: 'Khóa học', color: 'from-purple-500 to-purple-600' },
    { icon: Star, value: '4.8', label: 'Đánh giá trung bình', color: 'from-amber-500 to-amber-600' },
    { icon: Globe, value: '50+', label: 'Quốc gia', color: 'from-emerald-500 to-emerald-600' },
];

const values = [
    {
        icon: Target,
        title: 'Chất lượng hàng đầu',
        description: 'Mỗi khóa học được thiết kế bởi chuyên gia hàng đầu trong ngành, đảm bảo kiến thức chính xác và cập nhật.',
        color: 'bg-blue-50 text-blue-600',
    },
    {
        icon: Heart,
        title: 'Lấy học viên làm trung tâm',
        description: 'Chúng tôi lắng nghe và hiểu nhu cầu học tập của bạn để mang đến trải nghiệm học tập tốt nhất.',
        color: 'bg-rose-50 text-rose-600',
    },
    {
        icon: Lightbulb,
        title: 'Đổi mới sáng tạo',
        description: 'Áp dụng công nghệ mới nhất để tạo ra phương pháp giảng dạy hiện đại, tương tác và hiệu quả.',
        color: 'bg-amber-50 text-amber-600',
    },
    {
        icon: Zap,
        title: 'Học tập linh hoạt',
        description: 'Học mọi lúc, mọi nơi với nội dung được tối ưu cho mọi thiết bị và phù hợp với lịch trình của bạn.',
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        icon: Award,
        title: 'Chứng chỉ uy tín',
        description: 'Nhận chứng chỉ hoàn thành khóa học được công nhận, giúp nâng cao giá trị hồ sơ nghề nghiệp.',
        color: 'bg-purple-50 text-purple-600',
    },
    {
        icon: Users,
        title: 'Cộng đồng hỗ trợ',
        description: 'Kết nối với hàng nghìn học viên khác, chia sẻ kiến thức và kinh nghiệm cùng phát triển.',
        color: 'bg-teal-50 text-teal-600',
    },
];

const team = [
    { name: 'Bùi Nam Huy', role: 'Giám đốc điều hành & Nhà sáng lập', color: 'from-blue-500 to-indigo-600' },
    { name: 'Nguyễn Huy Hoàng', role: 'Giám đốc công nghệ', color: 'from-purple-500 to-pink-600' },
    { name: 'Ngô Hoàng Hải', role: 'Giám đốc nội dung', color: 'from-emerald-500 to-teal-600' },
    { name: 'Lê Anh Chiến', role: 'Trưởng phòng thiết kế', color: 'from-amber-500 to-orange-600' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-28 overflow-hidden">
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Về Chúng Tôi
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Chúng tôi đang xây dựng{' '}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Tương Lai Giáo Dục
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Tại EduLearn, chúng tôi tin rằng giáo dục chất lượng nên được tiếp cận bởi tất cả mọi người, ở mọi nơi.
                            Sứ mệnh của chúng tôi là dân chủ hóa việc học tập và trao quyền cho mỗi cá nhân đạt được mục tiêu
                            thông qua giáo dục trực tuyến đẳng cấp thế giới.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/courses">
                                <button className="px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl cursor-pointer flex items-center">
                                    Khám phá khóa học
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </button>
                            </Link>
                            <Link href="/contact">
                                <button className="px-8 py-3.5 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer">
                                    Liên hệ với chúng tôi
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            Được tin tưởng bởi hàng nghìn người trên toàn thế giới
                        </h2>
                        <p className="text-gray-500">Những con số nói lên tất cả</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} className="text-center p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Mục tiêu & Giá trị
                            </span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Khám phá những nguyên tắc và niềm tin định hướng mọi hoạt động của chúng tôi
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                        {/* Mission */}
                        <div className="p-8 rounded-2xl bg-white shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-5">
                                <Target className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Sứ Mệnh</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Dân chủ hóa giáo dục chất lượng bằng cách làm cho nó dễ tiếp cận, giá cả phải chăng và hiệu quả
                                cho người học trên toàn thế giới. Chúng tôi nỗ lực thu hẹp khoảng cách giữa tham vọng và thành tựu
                                thông qua trải nghiệm học tập trực tuyến sáng tạo.
                            </p>
                        </div>

                        {/* Vision */}
                        <div className="p-8 rounded-2xl bg-white shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white mb-5">
                                <Lightbulb className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Tầm Nhìn</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Trở thành nền tảng hàng đầu thế giới về giáo dục chuyển đổi, trao quyền cho hàng triệu người học
                                khai phá tiềm năng và tạo ra một cộng đồng toàn cầu có tri thức, kỹ năng và kết nối hơn.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Giá trị cốt lõi
                            </span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Những nguyên tắc cốt lõi định hình văn hóa và cách chúng tôi phục vụ cộng đồng học viên
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {values.map((val, i) => {
                            const Icon = val.icon;
                            return (
                                <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                    <div className={`w-12 h-12 rounded-xl ${val.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{val.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{val.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Đội Ngũ EduLearn
                            </span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Những người đam mê và tận tâm đứng sau sứ mệnh giáo dục của chúng tôi
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {team.map((member, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    <span className="text-2xl font-bold">{member.name.charAt(0)}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                                <p className="text-gray-500 text-xs">{member.role}</p>
                            </div>
                        ))}
                    </div>

                    {/* Join Team CTA */}
                    <div className="mt-12 text-center">
                        <div className="inline-block p-8 rounded-2xl bg-white shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn muốn gia nhập đội ngũ?</h3>
                            <p className="text-gray-500 text-sm mb-4">Chúng tôi luôn tìm kiếm những tài năng đam mê giáo dục</p>
                            <Link href="/contact">
                                <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer">
                                    Liên hệ ngay
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
