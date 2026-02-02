/**
 * Client-Side Excel Export Utility for Real Estate
 * 
 * Handles Excel export for small datasets (< 5000 rows) using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import type { Property } from '@/types/real_estate/realEstate';
import { formatDate } from '@/core/utils/commonFormat';
import { formatPriceToPersian } from '@/core/utils/realEstateFormat';

const MAX_CLIENT_SIDE_ROWS = 5000;

interface ExcelExportData {
    'عنوان': string;
    'نوع ملک': string;
    'وضعیت ملک': string;
    'شهر': string;
    'منطقه': string;
    'قیمت': string;
    'تعداد خواب': string;
    'متراژ بنا': string;
    'تاریخ ایجاد': string;
    'ویژه': string;
    'منتشر شده': string;
    'فعال': string;
}

/**
 * Transform property data to Excel format
 */
function transformPropertyData(properties: Property[]): ExcelExportData[] {
    return properties.map(property => ({
        'عنوان': property.title || '-',
        'نوع ملک': property.property_type?.title || '-',
        'وضعیت ملک': property.state?.title || '-',
        'شهر': property.city_name || '-',
        'منطقه': property.region_name || '-',
        'قیمت': formatPriceToPersian(property.price),
        'تعداد خواب': property.bedrooms?.toString() || '0',
        'متراژ بنا': property.built_area ? `${property.built_area} متر` : '-',
        'تاریخ ایجاد': formatDate(property.created_at),
        'ویژه': property.is_featured ? 'بله' : 'خیر',
        'منتشر شده': property.is_published ? 'بله' : 'خیر',
        'فعال': property.is_active ? 'بله' : 'خیر',
    }));
}

/**
 * Export properties to Excel file (client-side)
 */
export async function exportPropertiesToExcel(
    properties: Property[],
    filename: string = `properties_${Date.now()}`
): Promise<void> {
    if (properties.length > MAX_CLIENT_SIDE_ROWS) {
        throw new Error(
            `تعداد رکوردها (${properties.length}) بیش از حد مجاز (${MAX_CLIENT_SIDE_ROWS}) است. لطفاً از Export سرور استفاده کنید.`
        );
    }

    const excelData = transformPropertyData(properties);
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!views'] = [{ RTL: true }];
    worksheet['!dir'] = 'rtl';

    const columnWidths = [
        { wch: 40 }, // عنوان
        { wch: 15 }, // نوع ملک
        { wch: 15 }, // وضعیت ملک
        { wch: 15 }, // شهر
        { wch: 15 }, // منطقه
        { wch: 20 }, // قیمت
        { wch: 12 }, // تعداد خواب
        { wch: 12 }, // متراژ بنا
        { wch: 20 }, // تاریخ ایجاد
        { wch: 10 }, // ویژه
        { wch: 10 }, // منتشر شده
        { wch: 10 }, // فعال
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'املاک');

    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if (workbook.Workbook.Views.length === 0) workbook.Workbook.Views.push({ RTL: true });
    else workbook.Workbook.Views[0].RTL = true;

    workbook.Props = {
        Title: 'گزارش املاک',
        Subject: 'Export املاک',
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
