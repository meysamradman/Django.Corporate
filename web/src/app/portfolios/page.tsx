'use client';

import { useEffect, useState } from 'react';
import { portfoliosApi, Portfolio } from '@/api/portfolios/route';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  async function loadPortfolios() {
    try {
      setLoading(true);
      setError(null);
      const response = await portfoliosApi.getPortfolios({ limit: 50 });
      
      if (response.success && Array.isArray(response.data)) {
        setPortfolios(response.data);
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        setPortfolios((response.data as any).results || []);
      } else {
        setPortfolios([]);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری نمونه کارها');
      console.error('Error loading portfolios:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری نمونه کارها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadPortfolios}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">نمونه کارها</h1>
          <p className="text-gray-600">لیست تمام نمونه کارها</p>
        </div>
        <button
          onClick={loadPortfolios}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            هیچ نمونه کاری یافت نشد
          </div>
        ) : (
          portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{portfolio.title}</h3>
                  {portfolio.is_featured && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      ویژه
                    </span>
                  )}
                </div>
                {portfolio.short_description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {portfolio.short_description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      portfolio.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {portfolio.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(portfolio.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

