/**
 * Portfolio Detail Print View Component
 * 
 * Professional document-style view for printing a single portfolio item.
 * Features: High-quality headers, large image, technical options grid, clean typography.
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns-jalali';
import { portfolioApi } from '@/api/portfolios/portfolios';
import { Loader2 } from 'lucide-react';
import { mediaService } from '@/components/media/services';
import { useEffect } from 'react';

interface PortfolioDetailPrintViewProps {
    portfolioId: number;
}

const toPersianDigits = (str: string | number): string => {
    return str.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

export function PortfolioDetailPrintView({ portfolioId }: PortfolioDetailPrintViewProps) {
    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: ['portfolio', 'print', portfolioId],
        queryFn: () => portfolioApi.getPortfolioById(portfolioId),
        enabled: !!portfolioId,
    });

    useEffect(() => {
        if (portfolio) {
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [portfolio]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-bold">خطا در دریافت اطلاعات پروژه</p>
                <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded">بستن</button>
            </div>
        );
    }

    const mainImageUrl = portfolio.main_image?.file_url
        ? mediaService.getMediaUrlFromObject({ file_url: portfolio.main_image.file_url } as any)
        : null;

    return (
        <div className="min-h-screen bg-white text-right p-8 md:p-12" dir="rtl">
            <div className="no-print fixed top-0 left-0 right-0 bg-slate-50 border-b p-4 flex justify-between items-center z-50">
                <button
                    onClick={() => window.print()}
                    className="px-8 py-2.5 bg-blue-900 text-white rounded-xl hover:bg-black transition-all font-bold shadow-md flex items-center gap-2"
                >
                    🖨️ چاپ این پروژه
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
                        <h1 className="text-4xl font-black text-slate-900 mb-2">{portfolio.title}</h1>
                        <p className="text-xl text-slate-300 font-black tracking-tight italic uppercase">Engineering Documentation / Portfolio Item</p>
                    </div>
                    <div className="text-[12px] text-slate-800 font-black space-y-1 text-left uppercase">
                        <div>DATE: {toPersianDigits(format(new Date(), 'yyyy/MM/dd'))}</div>
                        <div>ID: {toPersianDigits(portfolio.id)}</div>
                    </div>
                </div>

                {mainImageUrl && (
                    <div className="mb-12 w-full overflow-hidden rounded-4xl border-4 border-slate-50 shadow-2xl relative">
                        <img
                            src={mainImageUrl}
                            alt={portfolio.title}
                            className="w-full h-auto object-cover max-h-[600px]"
                        />
                        <div className="absolute top-8 left-8 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg">PORTFOLIO ITEM</div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900 text-white flex-1 p-8 rounded-4xl shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 text-[10px] text-blue-400 font-bold mb-2 tracking-[0.3em] uppercase">Project Category</div>
                        <div className="relative z-10 text-sm font-black">{portfolio.categories?.map((c: any) => c.name).join('، ') || 'Engineering'}</div>
                        <div className="absolute right-[-10%] bottom-[-10%] text-[10rem] font-black text-white/5 italic select-none">P</div>
                    </div>
                    <div className="bg-slate-50 border-4 border-white flex-1 p-8 rounded-4xl text-right">
                        <div className="text-[10px] text-slate-400 mb-1 font-bold tracking-[0.3em] uppercase">Execution Date</div>
                        <div className="text-lg font-black text-slate-800 italic">{toPersianDigits(format(new Date(portfolio.created_at), 'MMMM yyyy'))}</div>
                    </div>
                    <div className="bg-slate-50 border-4 border-white flex-1 p-8 rounded-4xl text-right">
                        <div className="text-[10px] text-slate-400 mb-1 font-bold tracking-[0.3em] uppercase">Public Visibility</div>
                        <div className="text-sm font-black text-blue-600 uppercase tracking-tighter">{portfolio.is_public ? 'Authorized / Public' : 'Confidential'}</div>
                    </div>
                </div>

                {portfolio.options && portfolio.options.length > 0 && (
                    <div className="mb-12 p-8 bg-slate-50 border border-slate-100 rounded-4xl">
                        <div className="text-[10px] text-slate-400 mb-4 font-black tracking-[0.3em] uppercase border-b border-slate-200 pb-2">Technical Capabilities</div>
                        <div className="grid grid-cols-2 gap-y-4">
                            {portfolio.options.map((o: any) => (
                                <div key={o.id} className="flex items-center gap-2 text-sm font-black text-slate-700">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                    {o.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="prose prose-slate max-w-none text-slate-800 text-xl leading-[2.4] text-justify mb-20 italic font-medium">
                    {portfolio.short_description || portfolio.description || 'No description available for this project.'}
                </div>

                <div className="mt-40 pt-10 border-t-4 border-slate-900 flex justify-between items-center text-[12px] text-slate-400 font-black italic">
                    <div>سند مهندسی و مستندات واحد فنی</div>
                    <div className="text-slate-900 font-black uppercase not-italic tracking-[0.5em] px-10">Management System</div>
                    <div>صفحه {toPersianDigits(1)} از {toPersianDigits(1)}</div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { background: white !important; font-family: Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact !important; }
                    .prose { font-size: 15pt !important; line-height: 2.2 !important; }
                }
            `}</style>
        </div>
    );
}
