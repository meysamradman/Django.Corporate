/**
 * Property Print Page
 * Orchestrates common print views for Real Estate List and Detailed reports.
 */

import { useSearchParams } from 'react-router-dom';
import { PropertyPrintView } from '@/components/real-estate/export/PropertyPrintView';
import { PropertyDetailPrintView } from '@/components/real-estate/export/PropertyDetailPrintView';

export default function PropertyPrintPage() {
    const [searchParams] = useSearchParams();
    const idsParam = searchParams.get('ids');
    const type = searchParams.get('type');

    // Parse property IDs from query string
    const propertyIds = idsParam
        ? idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        : [];

    if (propertyIds.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4 font-bold">هیچ ملکی برای چاپ انتخاب نشده است</p>
                    <button onClick={() => window.close()} className="text-blue-600 hover:underline font-black">بستن</button>
                </div>
            </div>
        );
    }

    // Determine which view to render
    if (type === 'detail' && propertyIds.length > 0) {
        return <PropertyDetailPrintView propertyId={propertyIds[0]} />;
    }

    return <PropertyPrintView propertyIds={propertyIds} />;
}
