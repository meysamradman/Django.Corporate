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

from src.core.utils.date_utils import format_jalali_date

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

from src.blog.messages.messages import BLOG_ERRORS, PDF_LABELS


class BlogPDFExportService:
    """
    Professional PDF export service for single Blog details.
    Supports high-quality RTL (Persian), media embedding, and modern UI.
    """
    
    PRIMARY_COLOR = colors.HexColor('#2563eb') if REPORTLAB_AVAILABLE else None
    SECONDARY_COLOR = colors.HexColor('#64748b') if REPORTLAB_AVAILABLE else None
    SUCCESS_COLOR = colors.HexColor('#10b981') if REPORTLAB_AVAILABLE else None
    LIGHT_BG = colors.HexColor('#f8fafc') if REPORTLAB_AVAILABLE else None
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
    def export_blog_pdf(blog):
        if not REPORTLAB_AVAILABLE: raise ImportError("ReportLab not found.")
        
        buffer = BytesIO()
        font_name = BlogPDFExportService._register_persian_font()
        rtl = BlogPDFExportService._process_rtl
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
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'BlogTitle', parent=styles['Heading1'], fontName=font_name, 
            fontSize=24, alignment=2, textColor=BlogPDFExportService.PRIMARY_COLOR
        )
        section_style = ParagraphStyle(
            'SectionHeader', parent=styles['Heading3'], fontName=font_name,
            fontSize=14, alignment=2, textColor=BlogPDFExportService.SECONDARY_COLOR,
            spaceBefore=15, spaceAfter=10
        )
        content_style = ParagraphStyle(
            'BodyContent', parent=styles['Normal'], fontName=font_name,
            fontSize=11, leading=18, alignment=2, textColor=BlogPDFExportService.TEXT_PRIMARY
        )

        # Header: Title & Info
        elements.append(Paragraph(rtl(blog.title), title_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=BlogPDFExportService.BORDER_COLOR, spaceAfter=20))
        
        # Main Image
        main_img = blog.get_main_image()
        if main_img:
            reportlab_img = BlogPDFExportService._get_image(main_img)
            if reportlab_img:
                elements.append(reportlab_img)
                elements.append(Spacer(1, 15))

        # Metadata Table
        meta_data = [
            [rtl(PDF_LABELS.get('categories', 'دسته بندی')), rtl(", ".join([c.name for c in blog.categories.all()]))],
            [rtl(PDF_LABELS.get('created_at', 'تاریخ')), rtl(format_jalali_date(blog.created_at))],
            [rtl(PDF_LABELS.get('status', 'وضعیت')), rtl(status_map.get(blog.status, blog.status))]
        ]
        meta_table = Table(meta_data, colWidths=[1.5*inch, 3.5*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('TEXTCOLOR', (0, 0), (0, -1), BlogPDFExportService.PRIMARY_COLOR),
            ('GRID', (0, 0), (-1, -1), 0.2, BlogPDFExportService.BORDER_COLOR),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        # Description
        if blog.short_description:
            elements.append(Paragraph(rtl(PDF_LABELS.get('short_description', 'خلاصه')), section_style))
            elements.append(Paragraph(rtl(blog.short_description), content_style))
            elements.append(Spacer(1, 15))

        if blog.description:
            elements.append(Paragraph(rtl(PDF_LABELS.get('full_description', 'شرح کامل')), section_style))
            # Handle basic HTML-like tags if needed or just clean text
            desc_text = blog.description.replace("\n", "<br/>")
            elements.append(Paragraph(rtl(desc_text), content_style))

        # Media Gallery (Small grid or list)
        other_images = blog.images.exclude(is_main=True)[:5]
        if other_images.exists():
            elements.append(Paragraph(rtl(PDF_LABELS.get('gallery', 'گالری تصاویر')), section_style))
            img_row = []
            for entry in other_images:
                r_img = BlogPDFExportService._get_image(entry.image, max_w=1.5, max_h=1.5)
                if r_img: img_row.append(r_img)
            
            if img_row:
                gallery_table = Table([img_row], colWidths=[1.8*inch]*len(img_row))
                gallery_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
                elements.append(gallery_table)

        # Build
        def add_header_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont(font_name, 9)
            canvas.setFillColor(BlogPDFExportService.TEXT_SECONDARY)
            footer_text = rtl(f"وب‌سایت شرکتی - صفحه {doc.page}")
            canvas.drawCentredString(doc.pagesize[0]/2, 30, footer_text)
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"blog_detail_{blog.id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
