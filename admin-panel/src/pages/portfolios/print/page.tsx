/**
 * Portfolio Print Page
 */

import { useSearchParams } from 'react-router-dom';
import { PortfolioPrintView } from '@/components/portfolios/export/PortfolioPrintView';
import { PortfolioDetailPrintView } from '@/components/portfolios/export/PortfolioDetailPrintView';

export default function PortfolioPrintPage() {
    const [searchParams] = useSearchParams();
    const idsParam = searchParams.get('ids');
    const type = searchParams.get('type');

    const portfolioIds = idsParam
        ? idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        : [];

    if (portfolioIds.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">هیچ پروژه‌ای برای چاپ انتخاب نشده است</p>
                    <button onClick={() => window.close()} className="text-blue-600 hover:underline">بستن</button>
                </div>
            </div>
        );
    }

    if (type === 'detail' && portfolioIds.length > 0) {
        return <PortfolioDetailPrintView portfolioId={portfolioIds[0]} />;
    }

    return <PortfolioPrintView portfolioIds={portfolioIds} />;
}
