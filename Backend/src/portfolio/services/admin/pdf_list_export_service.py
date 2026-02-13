import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_medium, format_jalali_short
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle

class PortfolioPDFListExportService:
    EXPORT_FIELDS = [
        {'key': 'created_at', 'label': 'تاریخ ایجاد', 'width': 1.6},
        {'key': 'options', 'label': 'امکانات', 'width': 2.2},
        {'key': 'categories', 'label': 'دسته‌بندی', 'width': 2.0},
        {'key': 'status', 'label': 'وضعیت', 'width': 1.2},
        {'key': 'title', 'label': 'عنوان پروژه', 'width': 3.5},
        {'key': 'index', 'label': '#', 'width': 0.4},
    ]

    @staticmethod
    def export_portfolios_pdf(queryset):
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is not installed.")
            
        buffer = BytesIO()
        font_name = PDFBaseExportService.register_persian_font()
        rtl = PDFBaseExportService.process_rtl
        styles = PDFBaseExportService.get_styles(font_name)
        
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=30, leftMargin=30, topMargin=40, bottomMargin=40)
        elements = [Paragraph(rtl("گزارش لیست پروژه‌ها و نمونه‌کارها"), styles['table_title'])]
        
        headers = [rtl(f['label']) for f in PortfolioPDFListExportService.EXPORT_FIELDS]
        table_data = [headers]
        
        for idx, portfolio in enumerate(queryset, start=1):
            row = []
            for field in PortfolioPDFListExportService.EXPORT_FIELDS:
                key = field['key']
                val = ""
                if key == 'index': val = str(idx)
                elif key == 'title': val = portfolio.title
                elif key == 'status':
                    status_map = {'published': 'منتشر شده', 'draft': 'پیش نویس', 'archived': 'آرشیو'}
                    val = status_map.get(portfolio.status, portfolio.status)
                elif key == 'categories': val = ", ".join([c.name for c in portfolio.categories.all()[:2]]) or "-"
                elif key == 'options': val = ", ".join([o.name for o in portfolio.options.all()[:2]]) or "-"
                elif key == 'created_at': val = format_jalali_medium(portfolio.created_at)
                row.append(rtl(val))
            table_data.append(row)

        table = Table(table_data, colWidths=[f['width'] * inch for f in PortfolioPDFListExportService.EXPORT_FIELDS], repeatRows=1)
        clr = PDFBaseExportService.get_colors()
        if not clr:
            logger.error("Could not obtain PDF colors.")
            raise ValueError("PDF color configuration failed.")

        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), clr.PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, clr.BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, clr.LIGHT_BG]),
        ]))
        elements.append(table)
        
        footer_func = PDFBaseExportService.get_generic_footer_func(font_name, f"تعداد: {queryset.count()} | {format_jalali_short(datetime.now())}")
        
        try:
            logger.info(f"Starting Portfolio list PDF build for {queryset.count()} items...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
            logger.info("Portfolio list PDF build successful.")
        except Exception as e:
            logger.error(f"Portfolio list PDF build failed: {str(e)}")
            logger.error(traceback.format_exc())
            raise
            
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        from django.utils.encoding import escape_uri_path
        filename = "لیست_نمونه‌کار.pdf"
        
        logger.info(f"Generated Portfolio PDF size: {len(pdf_content)} bytes.")

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"
        return response

