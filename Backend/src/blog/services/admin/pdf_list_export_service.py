import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_medium, format_jalali_short
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE
from src.blog.messages.messages import PDF_LABELS, BLOG_ERRORS

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle

class BlogPDFListExportService:
    EXPORT_FIELDS = [
        {'key': 'features', 'label': 'ویژگی‌ها', 'width': 1.0},
        {'key': 'created_at', 'label': 'تاریخ ایجاد', 'width': 1.8},
        {'key': 'categories', 'label': 'دسته‌بندی', 'width': 2.0},
        {'key': 'status', 'label': 'وضعیت', 'width': 1.2},
        {'key': 'title', 'label': 'عنوان', 'width': 3.5},
    ]

    @staticmethod
    def export_blogs_pdf(queryset):
        if not REPORTLAB_AVAILABLE:
            raise ImportError(BLOG_ERRORS["blog_export_failed"])
            
        buffer = BytesIO()
        font_name = PDFBaseExportService.register_persian_font()
        rtl = PDFBaseExportService.process_rtl
        styles = PDFBaseExportService.get_styles(font_name)
        
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=30, leftMargin=30, topMargin=40, bottomMargin=40)
        elements = [Paragraph(rtl(PDF_LABELS.get('blogs_list', 'گزارش جامع مقالات')), styles['table_title'])]
        
        headers = [rtl(f['label']) for f in BlogPDFListExportService.EXPORT_FIELDS]
        table_data = [headers]
        
        for blog in queryset:
            row = []
            for field in BlogPDFListExportService.EXPORT_FIELDS:
                key = field['key']
                val = ""
                if key == 'title': val = blog.title
                elif key == 'status':
                    status_map = {'published': PDF_LABELS.get('published', 'منتشر شده'), 'draft': PDF_LABELS.get('draft', 'پیش نویس'), 'archived': PDF_LABELS.get('archived', 'آرشیو')}
                    val = status_map.get(blog.status, blog.status)
                elif key == 'categories': val = ", ".join([cat.name for cat in blog.categories.all()[:2]])
                elif key == 'created_at': val = format_jalali_medium(blog.created_at)
                elif key == 'features':
                    feats = []
                    if blog.is_featured: feats.append('ویژه')
                    if blog.is_public: feats.append('عمومی')
                    val = " | ".join(feats) if feats else "-"
                row.append(rtl(val or "-"))
            table_data.append(row)

        table = Table(table_data, colWidths=[f['width'] * inch for f in BlogPDFListExportService.EXPORT_FIELDS], repeatRows=1)
        clr = PDFBaseExportService.get_colors()
        if not clr:
            logger.error("Could not obtain PDF colors.")
            raise ValueError(BLOG_ERRORS["blog_export_failed"])

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
            logger.info(f"Starting PDF build for {queryset.count()} blogs...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
            logger.info("PDF build successful.")
        except Exception as e:
            logger.error(f"CRITICAL: PDF build failed: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        from django.utils.encoding import escape_uri_path
        filename = "لیست_وبلاگ.pdf"
        
        logger.info(f"Generated PDF size: {len(pdf_content)} bytes. Returning response.")
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"
        return response

