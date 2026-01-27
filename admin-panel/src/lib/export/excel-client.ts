/**
 * Client-Side Excel Export Utility
 * 
 * Handles Excel export for small datasets (< 5000 rows) using SheetJS (xlsx)
 * For large datasets, use backend API instead
 */

import * as XLSX from 'xlsx';
import type { Blog } from '@/types/blog/blog';
import { formatDate } from '@/core/utils/format';

const MAX_CLIENT_SIDE_ROWS = 5000;

interface ExcelExportData {
    'عنوان': string;
    'وضعیت': string;
    'دسته‌بندی': string;
    'تگ‌ها': string;
    'تاریخ ایجاد': string;
    'ویژه': string;
    'عمومی': string;
    'فعال': string;
}

/**
 * Transform blog data to Excel format
 */
function transformBlogData(blogs: Blog[]): ExcelExportData[] {
    return blogs.map(blog => ({
        'عنوان': blog.title || '-',
        'وضعیت': getStatusLabel(blog.status),
        'دسته‌بندی': blog.categories?.map(c => c.name).join(', ') || '-',
        'تگ‌ها': blog.tags?.map(t => t.name).join(', ') || '-',
        'تاریخ ایجاد': formatDate(blog.created_at),
        'ویژه': blog.is_featured ? 'بله' : 'خیر',
        'عمومی': blog.is_public ? 'بله' : 'خیر',
        'فعال': blog.is_active ? 'بله' : 'خیر',
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
 * Export blogs to Excel file (client-side)
 * 
 * @param blogs - Array of blog objects
 * @param filename - Output filename (without extension)
 * @throws Error if data exceeds MAX_CLIENT_SIDE_ROWS
 */
export async function exportBlogsToExcel(
    blogs: Blog[],
    filename: string = `blogs_${Date.now()}`
): Promise<void> {
    if (blogs.length > MAX_CLIENT_SIDE_ROWS) {
        throw new Error(
            `تعداد رکوردها (${blogs.length}) بیش از حد مجاز (${MAX_CLIENT_SIDE_ROWS}) است. لطفاً از Export سرور استفاده کنید.`
        );
    }

    // Transform data
    const excelData = transformBlogData(blogs);

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!views'] = [{ RTL: true }];
    worksheet['!dir'] = 'rtl';

    // Set column widths
    const columnWidths = [
        { wch: 40 }, // عنوان
        { wch: 15 }, // وضعیت
        { wch: 30 }, // دسته‌بندی
        { wch: 30 }, // تگ‌ها
        { wch: 20 }, // تاریخ ایجاد
        { wch: 10 }, // ویژه
        { wch: 10 }, // عمومی
        { wch: 10 }, // فعال
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'وبلاگ‌ها');

    // Global RTL property for Workbook
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if (workbook.Workbook.Views.length === 0) workbook.Workbook.Views.push({ RTL: true });
    else workbook.Workbook.Views[0].RTL = true;

    // Add metadata
    workbook.Props = {
        Title: 'گزارش وبلاگ‌ها',
        Subject: 'Export وبلاگ‌ها',
        Author: 'پنل مدیریت',
        CreatedDate: new Date(),
    };

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`, {
        bookType: 'xlsx',
        type: 'binary',
    });
}

/**
 * Check if dataset should use client-side export
 */
export function shouldUseClientSideExport(rowCount: number): boolean {
    return rowCount <= MAX_CLIENT_SIDE_ROWS;
}
