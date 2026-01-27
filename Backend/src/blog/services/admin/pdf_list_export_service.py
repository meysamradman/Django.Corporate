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
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from src.blog.messages.messages import BLOG_ERRORS, PDF_LABELS


class BlogPDFListExportService:
    """
    Optimized PDF export service for Blog listings.
    Supports RTL (Persian), dynamic fields, and professional styling.
    """
    
    PRIMARY_COLOR = colors.HexColor('#2563eb') if REPORTLAB_AVAILABLE else None
    SECONDARY_COLOR = colors.HexColor('#64748b') if REPORTLAB_AVAILABLE else None
    LIGHT_BG = colors.HexColor('#f8fafc') if REPORTLAB_AVAILABLE else None
    BORDER_COLOR = colors.HexColor('#e2e8f0') if REPORTLAB_AVAILABLE else None
    TEXT_PRIMARY = colors.HexColor('#0f172a') if REPORTLAB_AVAILABLE else None
    TEXT_SECONDARY = colors.HexColor('#475569') if REPORTLAB_AVAILABLE else None
    WHITE_COLOR = colors.white if REPORTLAB_AVAILABLE else None

    # Define fields to export (Order matters: right to left in RTL rendering logic)
    # Human-readable format: Title, Status, Categories, Tags, Created At
    # Visual order for RTL (left-to-right rendering): Flags, Date, Tags, Categories, Status, Title
    EXPORT_FIELDS = [
        {'key': 'features', 'label': 'flags', 'width': 1.2},
        {'key': 'created_at', 'label': 'created_at', 'width': 1.5},
        {'key': 'tags', 'label': 'tags', 'width': 1.8},
        {'key': 'categories', 'label': 'categories', 'width': 1.8},
        {'key': 'status', 'label': 'status', 'width': 1.0},
        {'key': 'title', 'label': 'title', 'width': 3.0},
    ]
    
    @staticmethod
    def _register_persian_font():
        """Registers a Persian font if available, fallback to Helvetica."""
        persian_font_name = 'Helvetica'
        if not REPORTLAB_AVAILABLE:
            return persian_font_name
            
        try:
            base_dir = str(settings.BASE_DIR)
            font_paths = [
                os.path.join(base_dir, 'static', 'fonts', 'IRANSansXVF.ttf'),
                os.path.join(base_dir, 'static', 'fonts', 'Vazir.ttf'),
            ]
            
            for font_path in font_paths:
                if os.path.exists(font_path):
                    pdfmetrics.registerFont(TTFont('PersianFont', font_path))
                    return 'PersianFont'
        except Exception:
            pass
            
        # OS check for system fonts as backup
        if platform.system() == 'Windows':
            tahoma_path = r'C:\Windows\Fonts\Tahoma.ttf'
            if os.path.exists(tahoma_path):
                try:
                    pdfmetrics.registerFont(TTFont('SystemPersian', tahoma_path))
                    return 'SystemPersian'
                except Exception: pass
                
        return persian_font_name

    @staticmethod
    def _process_rtl(text):
        """Applies Arabic reshaping and Bidi algorithm for Persian text."""
        if not text: return ""
        if ARABIC_RESHAPER_AVAILABLE:
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        return str(text)

    @staticmethod
    def _convert_date(dt):
        """Converts datetime to Persian string if possible."""
        if not dt: return ""
        try:
            if JDATETIME_AVAILABLE:
                jd = jdatetime.datetime.fromgregorian(datetime=dt)
                return jd.strftime("%Y/%m/%d")
            return dt.strftime("%Y/%m/%d")
        except Exception:
            return str(dt)

    @staticmethod
    def export_blogs_pdf(queryset):
        if not REPORTLAB_AVAILABLE:
            raise ImportError("ReportLab is not installed.")
            
        buffer = BytesIO()
        font_name = BlogPDFListExportService._register_persian_font()
        rtl = BlogPDFListExportService._process_rtl
        
        # Document Setup
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=landscape(A4),
            rightMargin=30, leftMargin=30, topMargin=40, bottomMargin=40
        )
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'HeaderTitle', parent=styles['Normal'], fontName=font_name, 
            fontSize=22, alignment=2, textColor=BlogPDFListExportService.PRIMARY_COLOR,
            spaceAfter=25
        )
        
        # Title
        elements.append(Paragraph(rtl(PDF_LABELS.get('blogs_list', 'لیست مقالات')), title_style))
        
        # Headers
        headers = [rtl(PDF_LABELS.get(f['label'], f['label'])) for f in BlogPDFListExportService.EXPORT_FIELDS]
        table_data = [headers]
        
        # Data Rows
        for blog in queryset:
            row = []
            for field in BlogPDFListExportService.EXPORT_FIELDS:
                key = field['key']
                val = ""
                
                if key == 'title':
                    val = blog.title
                elif key == 'status':
                    status_map = {'published': PDF_LABELS.get('published', 'منتشر شده'), 'draft': PDF_LABELS.get('draft', 'پیش نویس'), 'archived': PDF_LABELS.get('archived', 'آرشیو')}
                    val = status_map.get(blog.status, blog.status)
                elif key == 'categories':
                    val = ", ".join([cat.name for cat in blog.categories.all()[:2]])
                elif key == 'tags':
                    val = ", ".join([tag.name for tag in blog.tags.all()[:2]])
                elif key == 'created_at':
                    val = BlogPDFListExportService._convert_date(blog.created_at)
                elif key == 'features':
                    feats = []
                    if blog.is_featured: feats.append(PDF_LABELS.get('yes', 'بله'))
                    val = " | ".join(feats) if feats else "-"
                
                row.append(rtl(val))
            table_data.append(row)

        # Table Layout
        col_widths = [f['width'] * inch for f in BlogPDFListExportService.EXPORT_FIELDS]
        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        table.setStyle(TableStyle([
            # Header Style
            ('BACKGROUND', (0, 0), (-1, 0), BlogPDFListExportService.PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 1), font_name),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            
            # Body Style
            ('FONTNAME', (0, 1), (-1, -1), font_name),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, BlogPDFListExportService.BORDER_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BlogPDFListExportService.LIGHT_BG]),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 10),
        ]))
        
        elements.append(table)
        
        # Build PDF
        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont(font_name, 9)
            canvas.setFillColor(BlogPDFListExportService.TEXT_SECONDARY)
            page_num = rtl(f"صفحه {doc.page}")
            canvas.drawCentredString(doc.pagesize[0]/2, 20, page_num)
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        
        # Response
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        filename = f"blog_list_{datetime.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

