import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_long, format_jalali_medium, format_jalali_short
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE
from src.blog.messages.messages import BLOG_ERRORS, PDF_LABELS

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib.pagesizes import A4

class BlogPDFExportService:
    @staticmethod
    def export_blog_pdf(blog):
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab not found.")
        
        buffer = BytesIO()
        font_name = PDFBaseExportService.register_persian_font()
        rtl = PDFBaseExportService.process_rtl
        styles = PDFBaseExportService.get_styles(font_name)
        clr = PDFBaseExportService.get_colors()
        
        if not clr:
            logger.error("PDF configuration colors missing.")
            raise ValueError("Configuration failed.")

        status_map = {
            'published': PDF_LABELS.get('published', 'منتشر شده'), 
            'draft': PDF_LABELS.get('draft', 'پیش نویس'), 
            'archived': PDF_LABELS.get('archived', 'آرشیو')
        }
        
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50, title=rtl(blog.title))
        elements = []
        
        elements.append(Paragraph(rtl(blog.title), styles['title']))
        elements.append(HRFlowable(width="100%", thickness=2, color=clr.PRIMARY, spaceAfter=20))
        
        meta_data = [
            [rtl(PDF_LABELS.get('categories', 'دسته‌بندی:')), rtl(", ".join([c.name for c in blog.categories.all()[:3]]) or '-')],
            [rtl(PDF_LABELS.get('created_at', 'تاریخ ایجاد:')), rtl(format_jalali_long(blog.created_at))],
            [rtl(PDF_LABELS.get('updated_at', 'آخرین بروزرسانی:')), rtl(format_jalali_medium(blog.updated_at))],
            [rtl(PDF_LABELS.get('status', 'وضعیت:')), rtl(status_map.get(blog.status, blog.status))],
        ]
        
        meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, clr.BORDER),
            ('BACKGROUND', (0, 0), (0, -1), clr.LIGHT_BG),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        if blog.description:
            elements.append(Paragraph(rtl(PDF_LABELS.get('full_description', 'شرح کامل:')), styles['section']))
            elements.append(Paragraph(rtl(blog.description.replace("\n", "<br/>")), styles['content']))

        meta_text = f"تاریخ تولید: {format_jalali_short(datetime.now())}"
        footer_func = PDFBaseExportService.get_generic_footer_func(font_name, meta_text)
        
        try:
            logger.info(f"Building single blog PDF ID: {blog.id}...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
            logger.info("Blog PDF build success.")
        except Exception as e:
            logger.error(f"Blog PDF build crash (ID: {blog.id}): {str(e)}")
            logger.error(traceback.format_exc())
            raise

        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        from django.utils.encoding import escape_uri_path
        filename = f"مقاله_{blog.id}.pdf"

        logger.info(f"Generated single blog PDF size: {len(pdf_content)} bytes.")
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"
        return response

