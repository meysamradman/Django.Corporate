/**
 * Property Print View Component
 * 
 * Professional, document-style view for printing a list of real estate properties.
 * Features: High-quality headers, landscape layout, Persian localization.
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns-jalali';
import { realEstateApi } from '@/api/real-estate';
import { Loader2 } from 'lucide-react';

interface PropertyPrintViewProps {
    propertyIds: number[];
}

const formatPrice = (price: number | null | undefined) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US').format(price);
};

export function PropertyPrintView({ propertyIds }: PropertyPrintViewProps) {
    const { data: properties, isLoading, error } = useQuery({
        queryKey: ['properties', 'print', propertyIds],
        queryFn: () => realEstateApi.getPropertiesByIds(propertyIds),
        enabled: propertyIds.length > 0,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <span className="mr-3 text-slate-500 font-bold tracking-tight">در حال آماده‌سازی گزارش املاک...</span>
            </div>
        );
    }

    if (error || !properties) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-12 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <p className="text-red-500 font-black text-xl mb-2">خطا در دریافت اطلاعات املاک</p>
                    <p className="text-slate-400 text-sm mb-6">احتمالاً ارتباط با سرور قطع شده یا شناسه معتبری یافت نشد.</p>
                    <button onClick={() => window.close()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-black">بستن پنجره</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white" dir="rtl">
            <div className="no-print fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"
                    >
                        🖨️ چاپ این گزارش
                    </button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <div className="text-slate-500 text-sm font-bold bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                        لیست املاک ({properties.length} مورد انتخاب شده)
                    </div>
                </div>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 text-slate-400 hover:text-slate-900 text-sm font-bold transition-colors"
                >
                    بستن
                </button>
            </div>

            <div className="print-container pt-20 pb-16 px-10 mx-auto xl:max-w-[297mm]">
                <div className="pb-8 mb-10 border-b-[3px] border-slate-900 flex justify-between items-end">
                    <div className="text-right">
                        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">گزارش جامع لیست املاک</h1>
                        <p className="text-sm text-slate-400 font-bold italic tracking-[0.2em] uppercase opacity-70">System Export / Real Estate Comprehensive Report</p>
                    </div>
                    <div className="text-left text-xs text-slate-800 font-black space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between gap-8"><span>تاریخ چاپ:</span> <span>{format(new Date(), 'yyyy/MM/dd')}</span></div>
                        <div className="flex justify-between gap-8 border-t border-slate-200/50 pt-1"><span>زمان ثبت:</span> <span>{format(new Date(), 'HH:mm')}</span></div>
                        <div className="flex justify-between gap-8 border-t border-slate-200/50 pt-1"><span>تعداد کل:</span> <span>{properties.length} مورد</span></div>
                    </div>
                </div>

                <div className="border border-slate-300 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full border-collapse text-right table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-300">
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[4%] text-center">#</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[22%]">عنوان ملک</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[12%] text-center">نوع / وضعیت</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[14%] text-center">شهر / منطقه</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[15%] text-left">قیمت</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[10%] text-center">انتشار</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[8%] text-center">ویژه</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[8%] text-center">فعال</th>
                                <th className="p-3 text-[10px] font-black text-slate-700 border-x border-slate-300 w-[7%] text-center">ایجاد</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800">
                            {properties.map((property: any, index: number) => (
                                <tr key={property.id} className="border-b border-slate-200">
                                    <td className="p-3 text-xs font-bold text-slate-500 border-x border-slate-100 text-center italic">{index + 1}</td>
                                    <td className="p-3 border-x border-slate-100">
                                        <div className="text-sm font-black text-slate-900 leading-tight truncate">{property.title}</div>
                                        <div className="text-[8px] text-blue-500 font-bold mt-1 tracking-widest font-mono">ID: {property.id}</div>
                                    </td>
                                    <td className="p-3 border-x border-slate-100 text-center">
                                        <div className="text-[10px] font-black text-slate-700 leading-none">{property.property_type?.title || '-'}</div>
                                        <div className="text-[8px] text-slate-400 font-bold mt-1">{property.state?.title || '-'}</div>
                                    </td>
                                    <td className="p-3 border-x border-slate-100 text-center">
                                        <div className="text-[10px] font-black text-slate-700 leading-none">{property.city_name || '-'}</div>
                                        <div className="text-[8px] text-slate-400 font-bold mt-1">{property.region_name || '-'}</div>
                                    </td>
                                    <td className="p-3 text-left font-black text-slate-900 border-x border-slate-100">
                                        <div className="text-xs leading-none">{formatPrice(property.price || property.sale_price || property.monthly_rent)}</div>
                                        <div className="text-[8px] text-slate-400 font-bold uppercase mt-1 leading-none">{property.currency || 'تومان'}</div>
                                    </td>
                                    <td className="p-3 text-center border-x border-slate-100">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${property.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                            {property.is_published ? 'منتشر' : 'پیش‌نویس'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center border-x border-slate-100">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${property.is_featured ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                            {property.is_featured ? 'ویژه' : 'عادی'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center border-x border-slate-100">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${property.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {property.is_active ? 'فعال' : 'غیرفعال'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center border-x border-slate-100">
                                        <div className="text-[9px] font-bold text-slate-500">{format(new Date(property.created_at), 'MM/dd')}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 pt-6 border-t-2 border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-black">
                    <div className="uppercase tracking-[0.2em] font-bold">Official Real Estate Management Report</div>
                    <div className="text-slate-400 px-10 italic">این گزارش به صورت خودکار از پنل مدیریت استخراج شده است.</div>
                    <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full">سیستم گزارش‌دهی دقیق</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 1cm; size: A4 landscape; }
                    body { background: white !important; font-family: Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact !important; }
                    .print-container { width: 100% !important; max-width: none !important; pt: 0 !important; }
                    table { page-break-inside: auto; border-collapse: collapse !important; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    footer { page-break-after: always; }
                }
                .print-container { direction: rtl; }
            `}</style>
        </div>
    );
}
