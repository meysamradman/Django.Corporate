from datetime import datetime
from src.portfolio.messages.messages import PORTFOLIO_ERRORS
from src.core.utils.date_utils import format_jalali_date, format_jalali_datetime, format_jalali_short
from src.core.utils.excel_base_service import ExcelBaseExportService

class PortfolioExcelExportService:
    """
    Optimized Excel export service for Portfolio with sortable Persian dates.
    """
    
    EXPORT_FIELDS = [
        {'key': 'title', 'label': 'عنوان', 'width': 40, 'type': 'text'},
        {'key': 'short_description', 'label': 'خلاصه', 'width': 50, 'type': 'text'},
        {'key': 'status', 'label': 'وضعیت', 'width': 15, 'type': 'status'},
        {'key': 'categories', 'label': 'دسته‌بندی‌ها', 'width': 30, 'type': 'array'},
        {'key': 'tags', 'label': 'تگ‌ها', 'width': 30, 'type': 'array'},
        {'key': 'options', 'label': 'ویژگی‌ها', 'width': 30, 'type': 'array'},
        {'key': 'created_at', 'label': 'تاریخ ایجاد (شمسی)', 'width': 25, 'type': 'jalali_datetime'},
        {'key': 'updated_at', 'label': 'تاریخ بروزرسانی', 'width': 25, 'type': 'jalali_datetime'},
        {'key': 'is_featured', 'label': 'ویژه', 'width': 12, 'type': 'boolean'},
        {'key': 'is_public', 'label': 'عمومی', 'width': 12, 'type': 'boolean'},
        {'key': 'is_active', 'label': 'فعال', 'width': 12, 'type': 'boolean'},
    ]

    @staticmethod
    def export_portfolios(queryset):
        workbook, worksheet, formats, output = ExcelBaseExportService.get_workbook_and_formats('نمونه‌کارها')
        ExcelBaseExportService.write_headers(worksheet, PortfolioExcelExportService.EXPORT_FIELDS, formats['header'], formats['text'])
        
        date_field_count = sum(1 for f in PortfolioExcelExportService.EXPORT_FIELDS if f['type'] in ['jalali_datetime', 'jalali_date'])
        hidden_col_start = len(PortfolioExcelExportService.EXPORT_FIELDS)
        if date_field_count > 0:
            worksheet.set_column(hidden_col_start, hidden_col_start + date_field_count - 1, None, None, {'hidden': True})
        
        row = 0
        try:
            for row, portfolio in enumerate(queryset, start=1):
                hidden_col_index = 0
                for col, field in enumerate(PortfolioExcelExportService.EXPORT_FIELDS):
                    key, field_type = field['key'], field.get('type', 'text')
                    if field_type == 'jalali_datetime':
                        dt = getattr(portfolio, key, None)
                        if dt and isinstance(dt, datetime):
                            worksheet.write(row, col, format_jalali_datetime(dt, '%Y/%m/%d %H:%M'), formats['jalali'])
                            worksheet.write_datetime(row, hidden_col_start + hidden_col_index, dt, formats['date'])
                            hidden_col_index += 1
                        else: worksheet.write(row, col, "-", formats['text'])
                    elif field_type == 'boolean':
                        worksheet.write(row, col, "✓ بله" if getattr(portfolio, key, False) else "✗ خیر", formats['bool'])
                    elif field_type == 'status':
                        status_map = {'published': '✅ منتشر شده', 'draft': '📝 پیش‌نویس', 'archived': '📦 آرشیو'}
                        worksheet.write(row, col, status_map.get(getattr(portfolio, key, ""), getattr(portfolio, key, "")), formats['status'])
                    elif field_type == 'array':
                        val = ", ".join([obj.name for obj in getattr(portfolio, key).all()])
                        worksheet.write(row, col, val or "-", formats['text'])
                    else:
                        worksheet.write(row, col, getattr(portfolio, key, "") or "-", formats['text'])
            
            worksheet.freeze_panes(1, 0)
            worksheet.autofilter(0, 0, row, len(PortfolioExcelExportService.EXPORT_FIELDS) - 1)
            worksheet.write(row + 2, 0, 'تعداد کل رکوردها:', formats['summary_label'])
            worksheet.write(row + 2, 1, row, formats['summary_value'])
        finally:
            workbook.close()
        
        filename = f"گزارش_نمونه‌کار_{format_jalali_short(datetime.now())}.xlsx"
        return ExcelBaseExportService.create_response(output, filename)

