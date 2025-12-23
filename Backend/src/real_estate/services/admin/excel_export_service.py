from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.real_estate.messages.messages import PROPERTY_ERRORS

try:
    import xlsxwriter
    XLSXWRITER_AVAILABLE = True
except ImportError:
    XLSXWRITER_AVAILABLE = False


class PropertyExcelExportService:
    
    @staticmethod
    def export_properties(queryset):
        if not XLSXWRITER_AVAILABLE:
            raise ImportError(PROPERTY_ERRORS.get("property_export_failed", "Export failed"))
        
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {
            'in_memory': True, 
            'default_date_format': 'yyyy-mm-dd hh:mm:ss',
            'remove_timezone': True
        })
        worksheet = workbook.add_worksheet('Properties')
        
        headers = [
            'ID',
            'Title',
            'Short Description',
            'Property Type',
            'State',
            'City',
            'Province',
            'Price',
            'Sale Price',
            'Currency',
            'Bedrooms',
            'Bathrooms',
            'Built Area',
            'Land Area',
            'Published',
            'Featured',
            'Public',
            'Verified',
            'Active',
            'Agent',
            'Agency',
            'Created At',
            'Updated At',
            'Labels',
            'Tags',
            'Features'
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
        
        for row_num, property_obj in enumerate(queryset, start=1):
            worksheet.write(row_num, 0, property_obj.id, data_format)
            worksheet.write(row_num, 1, property_obj.title, data_format)
            worksheet.write(row_num, 2, property_obj.short_description or "", data_format)
            worksheet.write(row_num, 3, property_obj.property_type.title if property_obj.property_type else "", data_format)
            worksheet.write(row_num, 4, property_obj.state.title if property_obj.state else "", data_format)
            worksheet.write(row_num, 5, property_obj.city.name if property_obj.city else "", data_format)
            worksheet.write(row_num, 6, property_obj.province.name if property_obj.province else "", data_format)
            worksheet.write(row_num, 7, property_obj.price or "", data_format)
            worksheet.write(row_num, 8, property_obj.sale_price or "", data_format)
            worksheet.write(row_num, 9, property_obj.currency or "", data_format)
            worksheet.write(row_num, 10, property_obj.bedrooms or "", data_format)
            worksheet.write(row_num, 11, property_obj.bathrooms or "", data_format)
            worksheet.write(row_num, 12, property_obj.built_area or "", data_format)
            worksheet.write(row_num, 13, property_obj.land_area or "", data_format)
            worksheet.write(row_num, 14, "Yes" if property_obj.is_published else "No", data_format)
            worksheet.write(row_num, 15, "Yes" if property_obj.is_featured else "No", data_format)
            worksheet.write(row_num, 16, "Yes" if property_obj.is_public else "No", data_format)
            worksheet.write(row_num, 17, "Yes" if property_obj.is_verified else "No", data_format)
            worksheet.write(row_num, 18, "Yes" if property_obj.is_active else "No", data_format)
            worksheet.write(row_num, 19, property_obj.agent.full_name if property_obj.agent else "", data_format)
            worksheet.write(row_num, 20, property_obj.agency.name if property_obj.agency else "", data_format)
            
            if property_obj.created_at:
                worksheet.write_datetime(row_num, 21, property_obj.created_at, data_format)
            else:
                worksheet.write(row_num, 21, "", data_format)
                
            if property_obj.updated_at:
                worksheet.write_datetime(row_num, 22, property_obj.updated_at, data_format)
            else:
                worksheet.write(row_num, 22, "", data_format)
            
            labels = ", ".join([label.title for label in property_obj.labels.all()])
            worksheet.write(row_num, 23, labels, data_format)
            
            tags = ", ".join([tag.title for tag in property_obj.tags.all()])
            worksheet.write(row_num, 24, tags, data_format)
            
            features = ", ".join([feature.title for feature in property_obj.features.all()])
            worksheet.write(row_num, 25, features, data_format)
        
        worksheet.set_column(0, 0, 8)
        worksheet.set_column(1, 1, 30)
        worksheet.set_column(2, 2, 40)
        worksheet.set_column(3, 6, 15)
        worksheet.set_column(7, 9, 15)
        worksheet.set_column(10, 13, 12)
        worksheet.set_column(14, 18, 10)
        worksheet.set_column(19, 20, 20)
        worksheet.set_column(21, 22, 20)
        worksheet.set_column(23, 25, 30)
        
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

