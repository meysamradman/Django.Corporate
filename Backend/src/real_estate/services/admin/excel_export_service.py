import logging
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from django.utils import timezone
from src.real_estate.messages.messages import PROPERTY_ERRORS
from src.core.utils.date_utils import format_jalali_medium

logger = logging.getLogger(__name__)

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False

class PropertyExcelExportService:
    
    @staticmethod
    def export_properties(queryset):
        
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(PROPERTY_ERRORS["property_export_failed"])
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('Properties List')
        
        header_fmt = workbook.add_format({
            'bold': True,
            'bg_color': '#2563eb',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'font_name': 'Tahoma',
            'font_size': 11
        })
        
        data_fmt = workbook.add_format({
            'align': 'right',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#e2e8f0',
            'font_name': 'Tahoma',
            'font_size': 10
        })
        
        worksheet.right_to_left()
        
        headers = [
            'شناسه', 'عنوان', 'نوع ملک', 'وضعیت', 'شهر', 
            'قیمت', 'خواب', 'متراژ', 'فعال', 'منتشر شده', 
            'ویژه', 'مشاور', 'آژانس', 'تاریخ ایجاد'
        ]
        
        for col, title in enumerate(headers):
            worksheet.write(0, col, title, header_fmt)
            
        for row, prop in enumerate(queryset, start=1):
            worksheet.write(row, 0, prop.id, data_fmt)
            worksheet.write(row, 1, prop.title or "-", data_fmt)
            worksheet.write(row, 2, prop.property_type.title if prop.property_type else "-", data_fmt)
            worksheet.write(row, 3, prop.state.title if prop.state else "-", data_fmt)
            worksheet.write(row, 4, prop.city.name if prop.city else "-", data_fmt)
            
            price = prop.price or prop.sale_price or 0
            formatted_price = f"{price:,}" if price > 0 else "-"
            worksheet.write(row, 5, formatted_price, data_fmt)
            
            worksheet.write(row, 6, prop.bedrooms or 0, data_fmt)
            worksheet.write(row, 7, f"{prop.built_area} متر" if prop.built_area else "-", data_fmt)
            worksheet.write(row, 8, "بله" if prop.is_active else "خیر", data_fmt)
            worksheet.write(row, 9, "بله" if prop.is_published else "خیر", data_fmt)
            worksheet.write(row, 10, "بله" if prop.is_featured else "خیر", data_fmt)
            worksheet.write(row, 11, prop.agent.full_name if prop.agent else "-", data_fmt)
            worksheet.write(row, 12, prop.agency.name if prop.agency else "-", data_fmt)
            worksheet.write(row, 13, format_jalali_medium(prop.created_at), data_fmt)
            
        worksheet.set_column(0, 0, 8)   # ID
        worksheet.set_column(1, 1, 40)  # Title
        worksheet.set_column(2, 4, 15)  # Type, State, City
        worksheet.set_column(5, 5, 20)  # Price
        worksheet.set_column(6, 7, 10)  # Beds, Area
        worksheet.set_column(8, 10, 10) # Booleans
        worksheet.set_column(11, 12, 20) # Agent, Agency
        worksheet.set_column(13, 13, 20) # Date
        
        worksheet.freeze_panes(1, 0)
        workbook.close()
        
        output.seek(0)
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        timestamp = datetime.now().strftime("%Y%m%d")
        response['Content-Disposition'] = f'attachment; filename="properties_{timestamp}.xlsx"'
        
        return response
