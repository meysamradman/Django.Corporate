import React from 'react';

/**
 * Modern, SSR-friendly Homepage.
 * Replaced the legacy admin dashboard with a clean landing page baseline.
 */
export default function HomePage() {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section Placeholder */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden rounded-3xl bg-gray-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-10" />
        <div className="relative z-20 text-center space-y-6 max-w-4xl px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            خانه رویایی خود را <span className="text-primary italic">پیدا کنید</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            ما در رایان استیت به شما کمک می‌کنیم تا بهترین انتخاب را در بازار املاک داشته باشید.
            تخصص ما، آرامش شماست.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-xl">
              مشاهده املاک
            </button>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md rounded-full font-bold transition-all">
              جستجوی پیشرفته
            </button>
          </div>
        </div>
      </section>

      {/* Basic Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 px-4">
        {[
          { title: 'مشاوره تخصصی', desc: 'تیم حرفه‌ای ما در تمام مراحل خرید و فروش در کنار شماست.' },
          { title: 'املاک دست‌چین شده', desc: 'بهترین و لوکس‌ترین فایل‌های منطقه با قیمت‌های واقعی.' },
          { title: 'امنیت معاملاتی', desc: 'بررسی دقیق اسناد و تضمین سلامت کامل تمامی قراردادها.' }
        ].map((feature, i) => (
          <div key={i} className="p-8 rounded-3xl bg-card border border-br hover:shadow-2xl transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl mb-6 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              {i + 1}
            </div>
            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
            <p className="text-font-s leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}