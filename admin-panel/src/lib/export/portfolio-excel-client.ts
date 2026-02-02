/**
 * Client-Side Excel Export Utility for Portfolio
 * 
 * Handles Excel export for small datasets (< 5000 rows) using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import type { Portfolio } from '@/types/portfolio/portfolio';
import { formatDate } from '@/core/utils/commonFormat';

const MAX_CLIENT_SIDE_ROWS = 5000;

interface ExcelExportData {
    'عنوان': string;
    'وضعیت': string;
    'دسته‌بندی': string;
    'تگ‌ها': string;
    'امکانات': string;
    'تاریخ ایجاد': string;
    'ویژه': string;
    'عمومی': string;
    'فعال': string;
}

/**
 * Transform portfolio data to Excel format
 */
function transformPortfolioData(portfolios: Portfolio[]): ExcelExportData[] {
    return portfolios.map(portfolio => ({
        'عنوان': portfolio.title || '-',
        'وضعیت': getStatusLabel(portfolio.status),
        'دسته‌بندی': portfolio.categories?.map(c => c.name).join(', ') || '-',
        'تگ‌ها': portfolio.tags?.map(t => t.name).join(', ') || '-',
        'امکانات': portfolio.options?.map(o => o.name).join(', ') || '-',
        'تاریخ ایجاد': formatDate(portfolio.created_at),
        'ویژه': portfolio.is_featured ? 'بله' : 'خیر',
        'عمومی': portfolio.is_public ? 'بله' : 'خیر',
        'فعال': portfolio.is_active ? 'بله' : 'خیر',
    }));
}

/**
 * Get Persian status label
 */
function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        published: '✅ منتشر شده',
        draft: '📝 پیش‌نویس',
        archived: '📦 آرشیو',
    };
    return labels[status] || status;
}

/**
 * Export portfolios to Excel file (client-side)
 */
export async function exportPortfoliosToExcel(
    portfolios: Portfolio[],
    filename: string = `portfolios_${Date.now()}`
): Promise<void> {
    if (portfolios.length > MAX_CLIENT_SIDE_ROWS) {
        throw new Error(
            `تعداد رکوردها (${portfolios.length}) بیش از حد مجاز (${MAX_CLIENT_SIDE_ROWS}) است. لطفاً از Export سرور استفاده کنید.`
        );
    }

    const excelData = transformPortfolioData(portfolios);
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!views'] = [{ RTL: true }];
    worksheet['!dir'] = 'rtl';

    const columnWidths = [
        { wch: 40 }, // عنوان
        { wch: 15 }, // وضعیت
        { wch: 30 }, // دسته‌بندی
        { wch: 30 }, // تگ‌ها
        { wch: 30 }, // امکانات
        { wch: 20 }, // تاریخ ایجاد
        { wch: 10 }, // ویژه
        { wch: 10 }, // عمومی
        { wch: 10 }, // فعال
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نمونه‌کارها');

    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if (workbook.Workbook.Views.length === 0) workbook.Workbook.Views.push({ RTL: true });
    else workbook.Workbook.Views[0].RTL = true;

    workbook.Props = {
        Title: 'گزارش نمونه‌کارها',
        Subject: 'Export نمونه‌کارها',
        Author: 'پنل مدیریت',
        CreatedDate: new Date(),
    };

    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Check if dataset should use client-side export
 */
export function shouldUseClientSideExport(rowCount: number): boolean {
    return rowCount <= MAX_CLIENT_SIDE_ROWS;
}
