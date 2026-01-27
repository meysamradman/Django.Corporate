import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from django.utils.encoding import escape_uri_path
from src.core.utils.date_utils import format_jalali_medium
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE
from src.real_estate.messages.messages import PROPERTY_ERRORS, PDF_LABELS

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.pagesizes import A4, landscape

class PropertyPDFListExportService:
    EXPORT_FIELDS = [
        {'key': 'index', 'label': '#', 'width': 0.4},
        {'key': 'title', 'label': 'عنوان ملک', 'width': 2.5},
        {'key': 'id', 'label': 'شناسه', 'width': 0.7},
        {'key': 'created_at', 'label': 'تاریخ ایجاد', 'width': 1.5},
        {'key': 'property_type', 'label': 'نوع ملک', 'width': 1.0},
        {'key': 'state', 'label': 'وضعیت', 'width': 1.0},
        {'key': 'city', 'label': 'شهر', 'width': 1.2},
        {'key': 'is_published', 'label': 'منتشر شده', 'width': 0.8},
        {'key': 'is_featured', 'label': 'ویژه', 'width': 0.6},
        {'key': 'is_active', 'label': 'فعال', 'width': 0.6},
    ]

    @staticmethod
    def export_properties_pdf(queryset):
        """
        Export a high-resolution PDF list of properties matching filters.
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError(PROPERTY_ERRORS.get("property_export_failed", "Export failed - ReportLab not found"))
            
        buffer = BytesIO()
        font_name = PDFBaseExportService.register_persian_font()
        rtl = PDFBaseExportService.process_rtl
        clr = PDFBaseExportService.get_colors()
        styles = PDFBaseExportService.get_styles(font_name)
        
        # Setup modern document
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=landscape(A4), 
            rightMargin=20, 
            leftMargin=20, 
            topMargin=30, 
            bottomMargin=30
        )
        elements = []
        
        # Title
        elements.append(Paragraph(rtl("گزارش لیست املاک"), styles['table_title']))
        elements.append(Spacer(1, 10))
        
        # Table data construction
        headers = [rtl(f['label']) for f in PropertyPDFListExportService.EXPORT_FIELDS]
        table_data = [headers]
        
        for idx, prop in enumerate(queryset, start=1):
            row = []
            try:
                for field in PropertyPDFListExportService.EXPORT_FIELDS:
                    key = field['key']
                    val = "-"
                    
                    if key == 'index': val = str(idx)
                    elif key == 'id': val = str(prop.id)
                    elif key == 'title': 
                        t = prop.title or ""
                        val = t[:40] + "..." if len(t) > 40 else t
                    elif key == 'property_type': val = prop.property_type.title if prop.property_type else "-"
                    elif key == 'state': val = prop.state.title if prop.state else "-"
                    elif key == 'city': 
                        if prop.city:
                            val = getattr(prop.city, 'name', getattr(prop.city, 'title', "-"))
                    elif key == 'created_at': val = format_jalali_medium(prop.created_at)
                    elif key in ['is_active', 'is_published', 'is_featured']:
                        is_val = getattr(prop, key, False)
                        val = "بله" if is_val else "خیر"
                    
                    row.append(rtl(val))
                table_data.append(row)
            except Exception as e:
                logger.error(f"Error processing item for PDF: {str(e)}")
                continue
            
        if len(table_data) <= 1:
            table_data.append([rtl("موردی یافت نشد")] + [""] * (len(headers) - 1))

        # Column sizing
        col_widths = [f['width'] * inch for f in PropertyPDFListExportService.EXPORT_FIELDS]
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        # Premium Styling
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, 0), clr.PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, clr.BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, clr.LIGHT_BG]),
        ]))
        
        elements.append(table)
        
        # Meta Footer
        count_text = f"تعداد: {len(table_data)-1}"
        footer_text = f"گزارش املاک شرکت | {count_text} | {format_jalali_medium(datetime.now())}"
        footer_func = PDFBaseExportService.get_generic_footer_func(font_name, footer_text)
        
        try:
            logger.info(f"Building PDF for {len(table_data)-1} properties...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
        except Exception as e:
            logger.error(f"Property PDF build failed: {str(e)}")
            logger.error(traceback.format_exc())
            raise ValueError(PROPERTY_ERRORS.get("property_export_failed", "PDF generation error"))
            
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        filename = f"properties_list_{datetime.now().strftime('%Y%m%d')}.pdf"
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"
        
        return response
