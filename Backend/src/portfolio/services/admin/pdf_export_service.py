from io import BytesIO
from datetime import datetime
from html import escape
import os
import platform
from django.http import HttpResponse
from django.conf import settings

try:
    import jdatetime
    JDATETIME_AVAILABLE = True
except ImportError:
    JDATETIME_AVAILABLE = False

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    ARABIC_RESHAPER_AVAILABLE = True
except ImportError:
    ARABIC_RESHAPER_AVAILABLE = False

try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from src.portfolio.messages.messages import PORTFOLIO_ERRORS, PDF_LABELS


class PortfolioPDFExportService:
    """
    Professional PDF export service for single Portfolio details.
    Supports high-quality RTL (Persian), media embedding, and modern UI.
    """
    
    PRIMARY_COLOR = colors.HexColor('#2563eb') if REPORTLAB_AVAILABLE else None
    SECONDARY_COLOR = colors.HexColor('#64748b') if REPORTLAB_AVAILABLE else None
    BORDER_COLOR = colors.HexColor('#e2e8f0') if REPORTLAB_AVAILABLE else None
    TEXT_PRIMARY = colors.HexColor('#0f172a') if REPORTLAB_AVAILABLE else None
    TEXT_SECONDARY = colors.HexColor('#475569') if REPORTLAB_AVAILABLE else None

    @staticmethod
    def _register_persian_font():
        persian_font_name = 'Helvetica'
        if not REPORTLAB_AVAILABLE: return persian_font_name
        try:
            base_dir = str(settings.BASE_DIR)
            font_paths = [
                os.path.join(base_dir, 'static', 'fonts', 'IRANSansXVF.ttf'),
                os.path.join(base_dir, 'static', 'fonts', 'Vazir.ttf'),
            ]
            for path in font_paths:
                if os.path.exists(path):
                    pdfmetrics.registerFont(TTFont('PersianFont', path))
                    return 'PersianFont'
        except Exception: pass
        if platform.system() == 'Windows':
            path = r'C:\Windows\Fonts\Tahoma.ttf'
            if os.path.exists(path):
                try:
                    pdfmetrics.registerFont(TTFont('SystemPersian', path))
                    return 'SystemPersian'
                except Exception: pass
        return persian_font_name

    @staticmethod
    def _process_rtl(text):
        if not text: return ""
        if ARABIC_RESHAPER_AVAILABLE:
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        return str(text)

    @staticmethod
    def _get_image(media_obj, max_w=5.0, max_h=4.0):
        if not PIL_AVAILABLE or not media_obj or not hasattr(media_obj, 'file'):
            return None
        try:
            path = media_obj.file.path
            if not os.path.exists(path): return None
            img = PILImage.open(path)
            w, h = img.size
            ratio = min(max_w * inch / w, max_h * inch / h, 1.0)
            return Image(path, width=w*ratio, height=h*ratio)
        except Exception: return None

    @staticmethod
    def export_portfolio_pdf(portfolio):
        if not REPORTLAB_AVAILABLE: raise ImportError("ReportLab not found.")
        
        buffer = BytesIO()
        font_name = PortfolioPDFExportService._register_persian_font()
        rtl = PortfolioPDFExportService._process_rtl
        status_map = {
            'published': PDF_LABELS.get('published', 'منتشر شده'),
            'draft': PDF_LABELS.get('draft', 'پیش نویس'),
            'archived': PDF_LABELS.get('archived', 'آرشیو')
        }
        
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50
        )
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'PortfolioTitle', parent=styles['Heading1'], fontName=font_name, 
            fontSize=24, alignment=2, textColor=PortfolioPDFExportService.PRIMARY_COLOR
        )
        section_style = ParagraphStyle(
            'SectionHeader', parent=styles['Heading3'], fontName=font_name,
            fontSize=14, alignment=2, textColor=PortfolioPDFExportService.SECONDARY_COLOR,
            spaceBefore=15, spaceAfter=10
        )
        content_style = ParagraphStyle(
            'BodyContent', parent=styles['Normal'], fontName=font_name,
            fontSize=11, leading=18, alignment=2, textColor=PortfolioPDFExportService.TEXT_PRIMARY
        )

        # Header
        elements.append(Paragraph(rtl(portfolio.title), title_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=PortfolioPDFExportService.BORDER_COLOR, spaceAfter=20))
        
        # Main Image
        main_img = portfolio.get_main_image()
        if main_img:
            reportlab_img = PortfolioPDFExportService._get_image(main_img)
            if reportlab_img:
                elements.append(reportlab_img)
                elements.append(Spacer(1, 15))

        # Metadata Table
        def get_jalali_date(dt):
            if not dt: return "-"
            if JDATETIME_AVAILABLE:
                return jdatetime.datetime.fromgregorian(datetime=dt).strftime("%Y/%m/%d")
            return dt.strftime("%Y/%m/%d")

        meta_data = [
            [rtl(PDF_LABELS.get('categories', 'دسته بندی')), rtl(", ".join([c.name for c in portfolio.categories.all()]))],
            [rtl(PDF_LABELS.get('options', 'امکانات')), rtl(", ".join([o.name for o in portfolio.options.all()]))],
            [rtl(PDF_LABELS.get('created_at', 'تاریخ')), rtl(get_jalali_date(portfolio.created_at))],
            [rtl(PDF_LABELS.get('status', 'وضعیت')), rtl(status_map.get(portfolio.status, portfolio.status))]
        ]
        meta_table = Table(meta_data, colWidths=[1.5*inch, 3.5*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('TEXTCOLOR', (0, 0), (0, -1), PortfolioPDFExportService.PRIMARY_COLOR),
            ('GRID', (0, 0), (-1, -1), 0.2, PortfolioPDFExportService.BORDER_COLOR),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        # Description
        if portfolio.short_description:
            elements.append(Paragraph(rtl(PDF_LABELS.get('short_description', 'خلاصه')), section_style))
            elements.append(Paragraph(rtl(portfolio.short_description), content_style))
            elements.append(Spacer(1, 15))

        if portfolio.description:
            elements.append(Paragraph(rtl(PDF_LABELS.get('full_description', 'مشخصات کامل')), section_style))
            desc_text = portfolio.description.replace("\n", "<br/>")
            elements.append(Paragraph(rtl(desc_text), content_style))

        # Build
        def add_header_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont(font_name, 9)
            canvas.setFillColor(PortfolioPDFExportService.TEXT_SECONDARY)
            footer_text = rtl(f"پروژه‌های شرکت - صفحه {doc.page}")
            canvas.drawCentredString(doc.pagesize[0]/2, 30, footer_text)
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"portfolio_detail_{portfolio.id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
