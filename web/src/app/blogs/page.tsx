'use client';

import { useEffect, useState } from 'react';
import { blogsApi, Blog } from '@/api/blogs/route';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  async function loadBlogs() {
    try {
      setLoading(true);
      setError(null);
      const response = await blogsApi.getBlogs({ limit: 50 });
      
      if (response.success && Array.isArray(response.data)) {
        setBlogs(response.data);
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        setBlogs((response.data as any).results || []);
      } else {
        setBlogs([]);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری بلاگ‌ها');
      console.error('Error loading blogs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری بلاگ‌ها...</p>
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
            onClick={loadBlogs}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">بلاگ‌ها</h1>
          <p className="text-gray-600">لیست تمام بلاگ‌ها</p>
        </div>
        <button
          onClick={loadBlogs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            هیچ بلاگی یافت نشد
          </div>
        ) : (
          blogs.map((blog) => (
            <div
              key={blog.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{blog.title}</h3>
                  {blog.is_featured && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      ویژه
                    </span>
                  )}
                </div>
                {blog.short_description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {blog.short_description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      blog.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {blog.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(blog.created_at).toLocaleDateString('fa-IR')}
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

