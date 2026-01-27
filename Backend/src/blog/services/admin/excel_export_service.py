from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.blog.messages.messages import BLOG_ERRORS

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False

try:
    import jdatetime
    JDATETIME_AVAILABLE = True
except ImportError:
    JDATETIME_AVAILABLE = False


class BlogExcelExportService:
    """
    Optimized Excel export service for Blog.
    Features professional formatting and dynamic field mapping.
    """
    
    EXPORT_FIELDS = [
        {'key': 'title', 'label': 'Title', 'width': 35},
        {'key': 'short_description', 'label': 'Short Description', 'width': 45},
        {'key': 'status', 'label': 'Status', 'width': 15},
        {'key': 'is_featured', 'label': 'Featured', 'width': 12},
        {'key': 'is_public', 'label': 'Public', 'width': 12},
        {'key': 'is_active', 'label': 'Active', 'width': 12},
        {'key': 'created_at', 'label': 'Created At', 'width': 22},
        {'key': 'categories', 'label': 'Categories', 'width': 30},
        {'key': 'tags', 'label': 'Tags', 'width': 30},
    ]

    @staticmethod
    def export_blogs(queryset):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(BLOG_ERRORS["blog_export_failed"])
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True, 
            'default_date_format': 'yyyy-mm-dd hh:mm:ss',
            'remove_timezone': True,
        })
        worksheet = workbook.add_worksheet('Blogs')
        
        # Formats
        header_format = workbook.add_format({
            'bold': True, 'bg_color': '#2563eb', 'font_color': 'white',
            'align': 'center', 'valign': 'vcenter', 'border': 1
        })
        data_format = workbook.add_format({
            'align': 'right', 'valign': 'vcenter', 'border': 1, 'border_color': '#e2e8f0'
        })
        date_format = workbook.add_format({
            'num_format': 'yyyy-mm-dd hh:mm:ss', 'align': 'right', 'border': 1, 'border_color': '#e2e8f0'
        })

        # Write Headers
        for col, field in enumerate(BlogExcelExportService.EXPORT_FIELDS):
            worksheet.write(0, col, field['label'], header_format)
            worksheet.set_column(col, col, field['width'])

        try:
            # Write Data
            for row, blog in enumerate(queryset, start=1):
                for col, field in enumerate(BlogExcelExportService.EXPORT_FIELDS):
                    key = field['key']
                    val = ""
                    
                    if key == 'categories':
                        val = ", ".join([c.name for c in blog.categories.all()])
                    elif key == 'tags':
                        val = ", ".join([t.name for t in blog.tags.all()])
                    elif key in ['is_featured', 'is_public', 'is_active']:
                        val = "Yes" if getattr(blog, key) else "No"
                    elif key == 'status':
                        status_map = {'published': 'منتشر شده', 'draft': 'پیش نویس', 'archived': 'آرشیو'}
                        val = status_map.get(blog.status, blog.status)
                    else:
                        val = getattr(blog, key, "")

                    if isinstance(val, datetime):
                        if JDATETIME_AVAILABLE:
                            jd = jdatetime.datetime.fromgregorian(datetime=val)
                            worksheet.write(row, col, jd.strftime("%Y/%m/%d %H:%M"), data_format)
                        else:
                            worksheet.write_datetime(row, col, val, date_format)
                    else:
                        worksheet.write(row, col, val, data_format)
            
            worksheet.freeze_panes(1, 0)
        finally:
            workbook.close()
        
        # Response
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"blog_export_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
