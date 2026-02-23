/**
 * Blog Detail Print View Component
 * 
 * Professional, document-style view for printing a single blog post.
 * Features: High-quality headers, image full-width, clean typography, metadata.
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns-jalali';
import { blogApi } from '@/api/blogs/blogs';
import { Loader2 } from 'lucide-react';
import { mediaService } from '@/components/media/services';
import { useEffect } from 'react';

interface BlogDetailPrintViewProps {
    blogId: number;
}

export function BlogDetailPrintView({ blogId }: BlogDetailPrintViewProps) {
    const { data: blog, isLoading, error } = useQuery({
        queryKey: ['blog', 'print', blogId],
        queryFn: () => blogApi.getBlogById(blogId),
        enabled: !!blogId,
    });

    useEffect(() => {
        if (blog) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [blog]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-bold">خطا در دریافت اطلاعات مقاله</p>
                <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded">بستن</button>
            </div>
        );
    }

    const mainImageUrl = blog.main_image?.file_url
        ? mediaService.getMediaUrlFromObject({ file_url: blog.main_image.file_url } as any)
        : null;

    return (
        <div className="min-h-screen bg-white text-right p-8 md:p-12" dir="rtl">
            <div className="no-print fixed top-0 left-0 right-0 bg-slate-50 border-b p-4 flex justify-between items-center z-50">
                <button
                    onClick={() => window.print()}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md flex items-center gap-2"
                >
                    🖨️ چاپ این مقاله
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-bold"
                >
                    بستن
                </button>
            </div>

            <div className="max-w-[210mm] mx-auto pt-16">
                <div className="border-b-4 border-slate-900 pb-6 mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">{blog.title}</h1>
                        <p className="text-lg text-slate-400 font-bold italic">Official Documentation / Article Export</p>
                    </div>
                    <div className="text-[11px] text-slate-700 font-bold space-y-1 text-left">
                        <div>تاریخ چاپ: {format(new Date(), 'yyyy/MM/dd')}</div>
                        <div>شناسه سند: {blog.id}</div>
                    </div>
                </div>

                {mainImageUrl && (
                    <div className="mb-10 w-full overflow-hidden rounded-3xl border-2 border-slate-100 shadow-sm">
                        <img
                            src={mainImageUrl}
                            alt={blog.title}
                            className="w-full h-auto object-cover max-h-125"
                        />
                    </div>
                )}

                <div className="grid grid-cols-4 gap-4 mb-10 bg-slate-50 p-6 rounded-4xl border border-slate-100">
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">دسته‌بندی</div>
                        <div className="text-xs font-black text-slate-800">
                            {blog.categories?.map((c: any) => c.name).join('، ') || 'متفرقه'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">تاریخ انتشار اصلی</div>
                        <div className="text-xs font-black text-slate-800">
                            {format(new Date(blog.created_at), 'yyyy/MM/dd')}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">وضعیت سیستم</div>
                        <div className="text-xs font-black text-green-600">
                            {blog.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">آمار بازدید</div>
                        <div className="text-xs font-black text-blue-600">
                            {blog.views_count || 0} مشاهده
                        </div>
                    </div>
                </div>

                {blog.short_description && (
                    <div className="mb-12 p-8 bg-blue-50/30 rounded-4xl border-r-8 border-blue-600 italic text-blue-900 text-lg leading-relaxed font-bold">
                        {blog.short_description}
                    </div>
                )}

                <div
                    className="prose prose-slate max-w-none text-slate-800 text-lg leading-[2.2] text-justify mb-20"
                    dangerouslySetInnerHTML={{ __html: blog.description }}
                />

                {blog.tags && blog.tags.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-slate-100">
                        <div className="text-sm font-black text-slate-400 mb-4 uppercase tracking-widest">موضوعات مرتبط (برچسب‌ها)</div>
                        <div className="flex flex-wrap gap-2">
                            {blog.tags.map((t: any) => (
                                <span key={t.id} className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200">
                                    # {t.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-32 pt-10 border-t-2 border-slate-900 flex justify-between items-center text-[11px] text-slate-400 font-black italic">
                    <div>سند رسمی استخراج شده از درگاه مدیریت محتوا</div>
                    <div className="text-slate-900 font-black uppercase not-italic tracking-widest px-10">Corporate Management System</div>
                    <div>صفحه 1 از 1</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { background: white !important; font-family: Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact !important; }
                    .prose { font-size: 14pt !important; line-height: 2 !important; }
                }
                .prose img { max-width: 100%; border-radius: 1rem; margin: 2rem 0; }
                .prose h2 { font-size: 1.8rem; font-weight: 900; color: #0f172a; border-right: 4px solid #3b82f6; padding-right: 1rem; margin-top: 3rem; margin-bottom: 2rem; }
            `}</style>
        </div>
    );
}
