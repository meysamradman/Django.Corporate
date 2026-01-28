import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_medium, format_jalali_long, format_jalali_short
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE
from src.portfolio.messages.messages import PDF_LABELS

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib.pagesizes import A4

class PortfolioPDFExportService:
    @staticmethod
    def export_portfolio_pdf(portfolio):
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is not installed.")
            
        buffer = BytesIO()
        font_name = PDFBaseExportService.register_persian_font()
        rtl = PDFBaseExportService.process_rtl
        styles = PDFBaseExportService.get_styles(font_name)
        clr = PDFBaseExportService.get_colors()
        
        if not clr:
            logger.error("PDF config colors missing.")
            raise ValueError("Config failed.")

        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50)
        elements = []
        
        elements.append(Paragraph(rtl(portfolio.title), styles['title']))
        elements.append(HRFlowable(width="100%", thickness=1, color=clr.PRIMARY, spaceAfter=20))
        
        main_img = portfolio.get_main_image()
        rl_img = PDFBaseExportService.get_image(main_img)
        if rl_img:
            elements.append(rl_img)
            elements.append(Spacer(1, 20))

        status_map = {'published': 'منتشر شده', 'draft': 'پیش نویس', 'archived': 'آرشیو'}
        meta_data = [
            [rtl(PDF_LABELS.get('status', 'وضعیت')), rtl(status_map.get(portfolio.status, portfolio.status))],
            [rtl(PDF_LABELS.get('categories', 'دسته‌بندی')), rtl(", ".join([c.name for c in portfolio.categories.all()[:3]]) or "-")],
            [rtl(PDF_LABELS.get('options', 'امکانات')), rtl(", ".join([o.name for o in portfolio.options.all()[:3]]) or "-")],
            [rtl(PDF_LABELS.get('created_at', 'تاریخ ثبت')), rtl(format_jalali_long(portfolio.created_at))],
        ]
        
        meta_table = Table(meta_data, colWidths=[1.5*inch, 4.0*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (-1, -1), clr.LIGHT_BG),
            ('GRID', (0, 0), (-1, -1), 0.5, clr.BORDER),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 25))

        if portfolio.description:
            elements.append(Paragraph(rtl("جزئیات کامل"), styles['section']))
            elements.append(Paragraph(rtl(portfolio.description.replace('\n', '<br/>')), styles['content']))

        footer_func = PDFBaseExportService.get_generic_footer_func(font_name, f"گزارش نمونه‌کار | {format_jalali_medium(datetime.now())}")
        
        try:
            logger.info(f"Building single portfolio PDF ID: {portfolio.id}...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
            logger.info("Portfolio PDF build success.")
        except Exception as e:
            logger.error(f"Portfolio PDF build crash (ID: {portfolio.id}): {str(e)}")
            logger.error(traceback.format_exc())
            raise

        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        from django.utils.encoding import escape_uri_path
        filename = f"پروژه_{portfolio.id}.pdf"
        
        logger.info(f"Generated single portfolio PDF size: {len(pdf_content)} bytes.")

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"
        return response

