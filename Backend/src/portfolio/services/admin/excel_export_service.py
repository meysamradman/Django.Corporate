from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.portfolio.messages.messages import PORTFOLIO_ERRORS

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False


class PortfolioExcelExportService:
    """
    Optimized Excel export service for Portfolio.
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
        {'key': 'options', 'label': 'Options', 'width': 30},
    ]

    @staticmethod
    def export_portfolios(queryset):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(PORTFOLIO_ERRORS["portfolio_export_failed"])
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True, 
            'default_date_format': 'yyyy-mm-dd hh:mm:ss',
            'remove_timezone': True,
        })
        worksheet = workbook.add_worksheet('Portfolios')
        
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
        for col, field in enumerate(PortfolioExcelExportService.EXPORT_FIELDS):
            worksheet.write(0, col, field['label'], header_format)
            worksheet.set_column(col, col, field['width'])

        # Write Data
        for row, portfolio in enumerate(queryset, start=1):
            for col, field in enumerate(PortfolioExcelExportService.EXPORT_FIELDS):
                key = field['key']
                
                if key == 'categories':
                    val = ", ".join([c.name for c in portfolio.categories.all()])
                elif key == 'tags':
                    val = ", ".join([t.name for t in portfolio.tags.all()])
                elif key == 'options':
                    val = ", ".join([o.name for o in portfolio.options.all()])
                elif key in ['is_featured', 'is_public', 'is_active']:
                    val = "Yes" if getattr(portfolio, key) else "No"
                elif key == 'status':
                    val = portfolio.get_status_display() if hasattr(portfolio, 'get_status_display') else portfolio.status
                else:
                    val = getattr(portfolio, key, "")

                if isinstance(val, datetime):
                    worksheet.write_datetime(row, col, val, date_format)
                else:
                    worksheet.write(row, col, val, data_format)
        
        try:
            worksheet.freeze_panes(1, 0)
            workbook.close()
        except Exception:
            raise Exception(PORTFOLIO_ERRORS["portfolio_export_failed"])
        
        # Response
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f"portfolio_export_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
