# -*- coding: utf-8 -*-
"""
Blog Excel Export Service
"""
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.blog.messages.messages import BLOG_ERRORS

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False


class BlogExcelExportService:
    """Service for exporting blogs to Excel format using xlsxwriter"""
    
    @staticmethod
    def export_blogs(queryset):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(BLOG_ERRORS["blog_export_failed"])
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True, 
            'default_date_format': 'yyyy-mm-dd hh:mm:ss',
            'remove_timezone': True  # Remove timezone from datetime objects for Excel compatibility
        })
        worksheet = workbook.add_worksheet('Blogs')
        
        # Headers - تایپ شده دستی
        headers = [
            'ID',
            'عنوان',
            'توضیحات کوتاه',
            'وضعیت',
            'ویژه',
            'عمومی',
            'فعال',
            'تاریخ ایجاد',
            'تاریخ بروزرسانی',
            'دسته‌بندی‌ها',
            'تگ‌ها',
        ]
        
        # Header format
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#366092',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#1e3a5f',
        })
        
        for col_num, header in enumerate(headers):
            worksheet.write(0, col_num, header, header_format)
        
        data_format = workbook.add_format({
            'align': 'right',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#d0d7de',
        })
        
        # Write data
        for row_num, blog in enumerate(queryset, start=1):
            worksheet.write(row_num, 0, blog.id, data_format)
            worksheet.write(row_num, 1, blog.title, data_format)
            worksheet.write(row_num, 2, blog.short_description or "", data_format)
            worksheet.write(row_num, 3, blog.get_status_display() if hasattr(blog, 'get_status_display') else blog.status, data_format)
            
            # بله/خیر - تایپ شده دستی
            worksheet.write(row_num, 4, "بله" if blog.is_featured else "خیر", data_format)
            worksheet.write(row_num, 5, "بله" if blog.is_public else "خیر", data_format)
            worksheet.write(row_num, 6, "بله" if blog.is_active else "خیر", data_format)
            
            # Dates
            if blog.created_at:
                worksheet.write_datetime(row_num, 7, blog.created_at, data_format)
            else:
                worksheet.write(row_num, 7, "", data_format)
                
            if blog.updated_at:
                worksheet.write_datetime(row_num, 8, blog.updated_at, data_format)
            else:
                worksheet.write(row_num, 8, "", data_format)
            
            # Relations
            categories = ", ".join([cat.name for cat in blog.categories.all()])
            worksheet.write(row_num, 9, categories, data_format)
            
            tags = ", ".join([tag.name for tag in blog.tags.all()])
            worksheet.write(row_num, 10, tags, data_format)
        
        # Column widths
        worksheet.set_column(0, 0, 8)
        worksheet.set_column(1, 1, 30)
        worksheet.set_column(2, 2, 40)
        worksheet.set_column(3, 3, 15)
        worksheet.set_column(4, 6, 12)
        worksheet.set_column(7, 8, 20)
        worksheet.set_column(9, 10, 30)
        
        worksheet.freeze_panes(1, 0)
        
        workbook.close()
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        timestamp = datetime.now().strftime("%Y%m%d")
        response['Content-Disposition'] = f'attachment; filename="blogs_{timestamp}.xlsx"'
        
        # CORS headers will be added by view's _add_cors_headers method
        return response
