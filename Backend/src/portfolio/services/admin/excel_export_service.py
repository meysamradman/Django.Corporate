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
    
    @staticmethod
    def export_portfolios(queryset):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(PORTFOLIO_ERRORS["portfolio_export_failed"])
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True, 
            'default_date_format': 'yyyy-mm-dd hh:mm:ss',
            'remove_timezone': True
        })
        worksheet = workbook.add_worksheet('Portfolios')
        
        headers = [
            'ID',
            'Title',
            'Short Description',
            'Status',
            'Featured',
            'Public',
            'Active',
            'Created At',
            'Updated At',
            'Categories',
            'Tags',
            'Options'
        ]
        
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
        
        for row_num, portfolio in enumerate(queryset, start=1):
            worksheet.write(row_num, 0, portfolio.id, data_format)
            worksheet.write(row_num, 1, portfolio.title, data_format)
            worksheet.write(row_num, 2, portfolio.short_description or "", data_format)
            worksheet.write(row_num, 3, portfolio.get_status_display() if hasattr(portfolio, 'get_status_display') else portfolio.status, data_format)
            
            worksheet.write(row_num, 4, "Yes" if portfolio.is_featured else "No", data_format)
            worksheet.write(row_num, 5, "Yes" if portfolio.is_public else "No", data_format)
            worksheet.write(row_num, 6, "Yes" if portfolio.is_active else "No", data_format)
            
            if portfolio.created_at:
                worksheet.write_datetime(row_num, 7, portfolio.created_at, data_format)
            else:
                worksheet.write(row_num, 7, "", data_format)
                
            if portfolio.updated_at:
                worksheet.write_datetime(row_num, 8, portfolio.updated_at, data_format)
            else:
                worksheet.write(row_num, 8, "", data_format)
            
            categories = ", ".join([cat.name for cat in portfolio.categories.all()])
            worksheet.write(row_num, 9, categories, data_format)
            
            tags = ", ".join([tag.name for tag in portfolio.tags.all()])
            worksheet.write(row_num, 10, tags, data_format)
            
            options_list = []
            for opt in portfolio.options.all():
                if opt.description:
                    options_list.append(f"{opt.name} ({opt.description})")
                else:
                    options_list.append(opt.name)
            options = ", ".join(options_list)
            worksheet.write(row_num, 11, options, data_format)
        
        worksheet.set_column(0, 0, 8)
        worksheet.set_column(1, 1, 30)
        worksheet.set_column(2, 2, 40)
        worksheet.set_column(3, 3, 15)
        worksheet.set_column(4, 6, 12)
        worksheet.set_column(7, 8, 20)
        worksheet.set_column(9, 11, 30)
        
        worksheet.freeze_panes(1, 0)
        
        workbook.close()
        output.seek(0)
        
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        timestamp = datetime.now().strftime("%Y%m%d")
        response['Content-Disposition'] = f'attachment; filename="portfolios_{timestamp}.xlsx"'
        
        return response
