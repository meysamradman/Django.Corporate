'use client';

import { useEffect, useState } from 'react';
import { portfoliosApi } from '@/api/portfolios/route';
import { blogsApi } from '@/api/blogs/route';

export default function Home() {
  const [stats, setStats] = useState({
    tickets: 0,
    emails: 0,
    portfolios: 0,
    blogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [portfoliosRes, blogsRes] = await Promise.all([
          portfoliosApi.getPortfolios({ limit: 1 }),
          blogsApi.getBlogs({ limit: 1 }),
        ]);

        setStats({
          tickets: 0, // Public endpoint doesn't support list
          emails: 0, // Email list requires auth
          portfolios: portfoliosRes.pagination?.count || 0,
          blogs: blogsRes.pagination?.count || 0,
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">داشبورد تست</h1>
        <p className="text-gray-600">برای تست API های بک‌اند و پنل ادمین</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="تیکت‌ها"
            value={stats.tickets}
            href="/tickets"
            color="blue"
          />
          <StatCard
            title="ایمیل‌ها"
            value={stats.emails}
            href="/emails"
            color="green"
          />
          <StatCard
            title="نمونه کارها"
            value={stats.portfolios}
            href="/portfolios"
            color="purple"
          />
          <StatCard
            title="بلاگ‌ها"
            value={stats.blogs}
            href="/blogs"
            color="orange"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
  color,
}: {
  title: string;
  value: number;
  href: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  };

  return (
    <a
      href={href}
      className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg shadow p-6 text-white transition-colors`}
    >
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value.toLocaleString('fa-IR')}</p>
    </a>
  );
}
