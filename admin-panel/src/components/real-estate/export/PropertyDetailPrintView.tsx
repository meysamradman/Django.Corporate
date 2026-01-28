/**
 * Property Detail Print View Component
 * 
 * Professional, document-style view for printing a single property record.
 * Features: High-quality headers, large image, technical options grid, clean typography.
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns-jalali';
import { realEstateApi } from '@/api/real-estate';
import { Loader2 } from 'lucide-react';
import { mediaService } from '@/components/media/services';
import { useEffect } from 'react';

interface PropertyDetailPrintViewProps {
    propertyId: number;
}

const toPersianDigits = (str: string | number): string => {
    return str.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'نامشخص / توافقی';
    return toPersianDigits(new Intl.NumberFormat('fa-IR').format(price));
};

export function PropertyDetailPrintView({ propertyId }: PropertyDetailPrintViewProps) {
    const { data: property, isLoading, error } = useQuery({
        queryKey: ['property', 'print', propertyId],
        queryFn: () => realEstateApi.getPropertyById(propertyId),
        enabled: !!propertyId,
    });

    useEffect(() => {
        if (property) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [property]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-bold">خطا در دریافت اطلاعات ملک</p>
                <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded">بستن</button>
            </div>
        );
    }

    const mainImageUrl = property.main_image?.file_url
        ? mediaService.getMediaUrlFromObject({ file_url: property.main_image.file_url } as any)
        : null;

    return (
        <div className="min-h-screen bg-white text-right p-8 md:p-12" dir="rtl">
            <div className="no-print fixed top-0 left-0 right-0 bg-slate-50 border-b p-4 flex justify-between items-center z-50">
                <button
                    onClick={() => window.print()}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-black transition-all font-bold shadow-md flex items-center gap-2"
                >
                    🖨️ چاپ این سند
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-bold"
                >
                    بستن
                </button>
            </div>

            <div className="max-w-[210mm] mx-auto pt-16">
                <div className="border-b-8 border-slate-900 pb-8 mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">{property.title}</h1>
                        <p className="text-xl text-slate-400 font-black tracking-tight uppercase italic">Property Official Documentation / Real Estate Export</p>
                    </div>
                    <div className="text-[12px] text-slate-800 font-black space-y-1 text-left uppercase">
                        <div>DATE: {toPersianDigits(format(new Date(), 'yyyy/MM/dd'))}</div>
                        <div>ID: {toPersianDigits(property.id)}</div>
                    </div>
                </div>

                {mainImageUrl && (
                    <div className="mb-12 w-full overflow-hidden rounded-4xl border-4 border-slate-50 shadow-2xl relative">
                        <img
                            src={mainImageUrl}
                            alt={property.title}
                            className="w-full h-auto object-cover max-h-[600px]"
                        />
                        <div className="absolute top-8 left-8 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg">OFFICIAL LISTING</div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900 text-white flex-1 p-8 rounded-4xl shadow-2xl relative overflow-hidden text-center">
                        <div className="relative z-10 text-[10px] text-blue-400 font-bold mb-2 tracking-[0.3em] uppercase">Property Type</div>
                        <div className="relative z-10 text-xl font-black">{property.property_type?.title}</div>
                        <div className="absolute right-[-10%] bottom-[-10%] text-[10rem] font-black text-white/5 italic select-none">RE</div>
                    </div>
                    <div className="bg-slate-50 border-4 border-white flex-1 p-8 rounded-4xl text-center">
                        <div className="text-[10px] text-slate-400 font-bold mb-2 tracking-[0.3em] uppercase">Status</div>
                        <div className="text-xl font-black text-blue-600 italic tracking-tighter uppercase">{property.state?.title || 'Active'}</div>
                    </div>
                    <div className="bg-slate-50 border-4 border-white flex-1 p-8 rounded-4xl text-center text-red-600">
                        <div className="text-[10px] text-slate-400 mb-2 tracking-[0.3em] uppercase font-black">Price / Total</div>
                        <div className="text-xl font-black">{formatPrice(property.price || property.sale_price)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-10 bg-slate-50 p-6 rounded-4xl border border-slate-100">
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">شهر</div>
                        <div className="text-xs font-black text-slate-800">{property.city_name || '-'}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">منطقه</div>
                        <div className="text-xs font-black text-slate-800">{property.region_name || '-'}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">متراژ</div>
                        <div className="text-xs font-black text-slate-800">{toPersianDigits(property.built_area || property.land_area || 0)} متر مربع</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">تعداد خواب</div>
                        <div className="text-xs font-black text-slate-800">{toPersianDigits(property.bedrooms || 0)} خوابه</div>
                    </div>
                </div>

                {property.short_description && (
                    <div className="mb-12 p-8 bg-blue-50/30 rounded-4xl border-r-8 border-blue-600 italic text-blue-900 text-lg leading-relaxed font-bold">
                        {property.short_description}
                    </div>
                )}

                <div className="mb-12 p-8 bg-slate-50 border border-slate-100 rounded-4xl">
                    <div className="text-[10px] text-slate-400 mb-4 font-black tracking-[0.3em] uppercase border-b border-slate-200 pb-2">Technical Features / امکانات فنی</div>
                    <div className="grid grid-cols-3 gap-y-4">
                        {property.features?.map((f: any) => (
                            <div key={f.id} className="flex items-center gap-2 text-xs font-black text-slate-700">
                                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                {f.name || f.title}
                            </div>
                        ))}
                        {(!property.features || property.features.length === 0) && <div className="text-xs text-slate-400">اطلاعات تکمیلی ثبت نشده است.</div>}
                    </div>
                </div>

                <div
                    className="prose prose-slate max-w-none text-slate-800 text-lg leading-[2.4] text-justify mb-20 italic font-medium"
                    dangerouslySetInnerHTML={{ __html: property.description || property.short_description }}
                />

                <div className="mt-40 pt-10 border-t-4 border-slate-900 flex justify-between items-center text-[12px] text-slate-400 font-black italic">
                    <div>سند رسمی استخراج شده از درگاه مدیریت املاک</div>
                    <div className="text-slate-900 font-black uppercase not-italic tracking-[0.5em] px-10">Real Estate Management System</div>
                    <div>صفحه {toPersianDigits(1)} از {toPersianDigits(1)}</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { background: white !important; font-family: Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact !important; }
                    .prose { font-size: 14pt !important; line-height: 2.2 !important; }
                }
            `}</style>
        </div>
    );
}
