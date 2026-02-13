/**
 * Export Buttons Component
 * 
 * Provides Excel, PDF, and Print export buttons for blog list
 */

import { Button } from '@/components/elements/Button';
import { Download, FileText, Printer } from 'lucide-react';
import { useExcelExport } from '@/components/blogs/hooks/useExcelExport';
import { usePdfExport } from '@/components/blogs/hooks/usePdfExport';
import { usePrintView } from '@/components/blogs/hooks/usePrintView';
import type { Blog } from '@/types/blog/blog';
import type { BlogExportParams } from '@/types/blog/blogListParams';

interface ExportButtonsProps {
    selectedBlogs: Blog[];
    totalCount: number;
    filters?: BlogExportParams;
    className?: string;
}

export function ExportButtons({
    selectedBlogs,
    totalCount,
    filters,
    className = '',
}: ExportButtonsProps) {
    const { exportExcel, isLoading: isExcelLoading } = useExcelExport();
    const { exportBlogListPdf, isExportingList: isPdfLoading } = usePdfExport();
    const { openPrintWindow } = usePrintView();

    const handleExcelExport = async () => {
        await exportExcel(selectedBlogs, totalCount, filters);
    };

    const handlePdfExport = () => {
        exportBlogListPdf(filters);
    };

    const handlePrint = () => {
        const ids = selectedBlogs.length > 0
            ? selectedBlogs.map(b => b.id)
            : [];

        if (ids.length === 0) {
            return;
        }

        openPrintWindow(ids);
    };

    const hasSelection = selectedBlogs.length > 0;

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button
                onClick={handleExcelExport}
                disabled={isExcelLoading}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <Download className="w-4 h-4" />
                {isExcelLoading ? 'در حال Export...' : 'Excel'}
            </Button>

            <Button
                onClick={handlePdfExport}
                disabled={isPdfLoading}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <FileText className="w-4 h-4" />
                {isPdfLoading ? 'در حال Export...' : 'PDF'}
            </Button>

            <Button
                onClick={handlePrint}
                disabled={!hasSelection}
                variant="outline"
                size="sm"
                className="gap-2"
                title={!hasSelection ? 'لطفاً حداقل یک مورد انتخاب کنید' : 'چاپ موارد انتخاب شده'}
            >
                <Printer className="w-4 h-4" />
                چاپ {hasSelection && `(${selectedBlogs.length})`}
            </Button>
        </div>
    );
}
