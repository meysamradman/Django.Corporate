/**
 * Blog Print Page
 * 
 * Displays print-friendly view of selected blogs
 * Opens in new window for printing
 */

import { useSearchParams } from 'react-router-dom';
import { BlogPrintView } from '@/components/blogs/export/BlogPrintView';
import { BlogDetailPrintView } from '@/components/blogs/export/BlogDetailPrintView';

export default function BlogPrintPage() {
    const [searchParams] = useSearchParams();
    const idsParam = searchParams.get('ids');
    const type = searchParams.get('type');

    // Parse blog IDs from query string
    const blogIds = idsParam
        ? idsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
        : [];

    if (blogIds.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">هیچ موردی برای چاپ انتخاب نشده است</p>
                    <button
                        onClick={() => window.close()}
                        className="text-blue-600 hover:underline"
                    >
                        بستن
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'detail' && blogIds.length > 0) {
        return <BlogDetailPrintView blogId={blogIds[0]} />;
    }

    return <BlogPrintView blogIds={blogIds} />;
}
