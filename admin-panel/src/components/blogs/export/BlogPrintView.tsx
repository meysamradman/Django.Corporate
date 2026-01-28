/**
 * Blog Print View Component
 * 
 * Precision Mirror View: Matches the Management Table columns exactly.
 * Columns: Title, Status, Featured, Public, Categories, Created At, Active.
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns-jalali';
import { getBlogsByIds } from '@/api/blogs/blogs';
import { Loader2 } from 'lucide-react';

interface BlogPrintViewProps {
    blogIds: number[];
}

/**
 * Helper to convert Latin digits to Persian digits
 */
const toPersianDigits = (str: string | number): string => {
    return str.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

export function BlogPrintView({ blogIds }: BlogPrintViewProps) {
    const { data: blogs, isLoading, error } = useQuery({
        queryKey: ['blogs', 'print', blogIds],
        queryFn: () => getBlogsByIds(blogIds),
        enabled: blogIds.length > 0,
    });

    /**
     * Exact Table Column Definitions
     */
    const COLUMNS = [
        {
            key: 'index',
            label: '#',
            width: '4%',
            align: 'center' as const,
            render: (_: any, index: number) => toPersianDigits(index + 1)
        },
        {
            key: 'title',
            label: 'عنوان',
            width: '24%',
            render: (blog: any) => (
                <div className="text-right font-bold text-sm">{blog.title}</div>
            )
        },
        {
            key: 'status',
            label: 'وضعیت',
            width: '12%',
            align: 'center' as const,
            render: (blog: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {blog.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </span>
            )
        },
        {
            key: 'is_featured',
            label: 'ویژه',
            width: '10%',
            align: 'center' as const,
            render: (blog: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${blog.is_featured ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {blog.is_featured ? 'ویژه' : 'عادی'}
                </span>
            )
        },
        {
            key: 'is_public',
            label: 'عمومی',
            width: '10%',
            align: 'center' as const,
            render: (blog: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${blog.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {blog.is_public ? 'عمومی' : 'خصوصی'}
                </span>
            )
        },
        {
            key: 'categories',
            label: 'دسته‌بندی‌ها',
            width: '18%',
            render: (blog: any) => (
                <div className="flex flex-wrap gap-1 justify-start">
                    {blog.categories?.length > 0 ? (
                        blog.categories.map((c: any) => (
                            <span key={c.id} className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 text-[9px] font-bold">
                                {c.name}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-[10px]">بدون دسته</span>
                    )}
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'تاریخ ایجاد',
            width: '14%',
            align: 'center' as const,
            render: (blog: any) => (
                <span className="text-xs font-bold text-slate-700">
                    {toPersianDigits(format(new Date(blog.created_at), 'yyyy/MM/dd'))}
                </span>
            )
        },
        {
            key: 'is_active',
            label: 'فعال',
            width: '8%',
            align: 'center' as const,
            render: (blog: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${blog.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {blog.is_active ? 'فعال' : 'غیرفعال'}
                </span>
            )
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="mr-3 text-gray-600 font-bold">درحال بارگذاری لیست...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <p className="text-red-600 font-bold">خطا در دریافت اطلاعات</p>
                    <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">بستن</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="no-print fixed top-0 left-0 right-0 bg-slate-50 border-b p-4 flex justify-between items-center z-50">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md flex items-center gap-2"
                >
                    🖨️ چاپ گزارش
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-bold"
                >
                    بستن
                </button>
            </div>

            <div className="print-container pt-20 pb-12 px-10 mx-auto xl:max-w-[297mm]">
                <div className="pb-8 mb-8 border-b-2 border-slate-900 flex justify-between items-end">
                    <div className="text-right">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">گزارش جامع لیست مقالات</h1>
                        <p className="text-sm text-slate-400 font-bold italic tracking-widest uppercase">System Export / Content Report</p>
                    </div>
                    <div className="text-left text-xs text-slate-700 font-bold space-y-1">
                        <div>تاریخ چاپ: {toPersianDigits(format(new Date(), 'yyyy/MM/dd'))}</div>
                        <div>زمان: {toPersianDigits(format(new Date(), 'HH:mm'))}</div>
                        <div>تعداد کل: {toPersianDigits(blogs?.length || 0)} مورد</div>
                    </div>
                </div>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-300">
                                {COLUMNS.map(col => (
                                    <th
                                        key={col.key}
                                        style={{ width: col.width }}
                                        className="p-3 text-center text-xs font-black text-slate-700 border-x border-slate-300"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {blogs?.map((blog, index) => (
                                <tr key={blog.id}>
                                    {COLUMNS.map(col => (
                                        <td
                                            key={col.key}
                                            className={`p-3 align-middle border-x border-slate-100 ${col.align === 'center' ? 'text-center' : 'text-right'}`}
                                        >
                                            {col.render(blog, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <div className="uppercase tracking-widest">Official Management System</div>
                    <div>صفحه {toPersianDigits(1)} از {toPersianDigits(1)}</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 1cm; size: A4 landscape; }
                    body { background: white !important; font-family: Tahoma, Arial, sans-serif; }
                    .print-container { width: 100% !important; max-width: none !important; direction: rtl; }
                }
                .print-container { direction: rtl; }
            `}</style>
        </div>
    );
}
