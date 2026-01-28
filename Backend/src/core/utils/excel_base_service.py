

from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_date, format_jalali_datetime, format_jalali_short

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False

class ExcelBaseExportService:
    @staticmethod
    def get_workbook_and_formats(sheet_name='Sheet1'):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError("XlsxWriter is not installed")

        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True, 'default_date_format': 'yyyy-mm-dd hh:mm:ss', 'remove_timezone': True})
        workbook.set_properties({'languages': 'fa-IR'})
        worksheet = workbook.add_worksheet(sheet_name)
        worksheet.right_to_left()

        formats = {
            'header': workbook.add_format({'bold': True, 'bg_color': '#2563eb', 'font_color': 'white', 'align': 'right', 'valign': 'vcenter', 'border': 1, 'text_wrap': True, 'font_size': 11}),
            'text': workbook.add_format({'align': 'right', 'valign': 'vcenter', 'border': 1, 'border_color': '#e2e8f0', 'text_wrap': True, 'font_size': 10}),
            'jalali': workbook.add_format({'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#e2e8f0', 'font_color': '#1e40af', 'num_format': '@', 'font_size': 10}),
            'date': workbook.add_format({'num_format': 'yyyy-mm-dd hh:mm:ss', 'align': 'center', 'border': 1, 'border_color': '#e2e8f0'}),
            'bool': workbook.add_format({'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#e2e8f0', 'font_size': 10}),
            'status': workbook.add_format({'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#e2e8f0', 'bold': True, 'font_size': 10}),
            'summary_label': workbook.add_format({'bold': True, 'bg_color': '#f1f5f9', 'align': 'right', 'border': 1, 'font_size': 11}),
            'summary_value': workbook.add_format({'bold': True, 'bg_color': '#f1f5f9', 'align': 'center', 'border': 1, 'font_color': '#2563eb', 'font_size': 11})
        }
        
        return workbook, worksheet, formats, output

    @staticmethod
    def write_headers(worksheet, fields, header_format, default_col_format=None):
        for col, field in enumerate(fields):
            worksheet.write(0, col, field['label'], header_format)
            options = {'reading_order': 2}
            worksheet.set_column(col, col, field['width'], default_col_format, options)

    @staticmethod
    def create_response(output, filename):
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
