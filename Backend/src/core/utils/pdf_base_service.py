"""
Professional PDF Base Service for export functionalities.
Consolidates font registration, RTL processing, caching, and styling.
"""

import os
import logging
import traceback
from io import BytesIO
from functools import lru_cache
from html import escape
from datetime import datetime
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse

logger = logging.getLogger(__name__)

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
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class PDFBaseExportService:
    # Font paths
    FONT_PATHS = [
        ('iransansx', 'static/fonts/IRANSansXVF.ttf'),
        ('vazir', 'static/fonts/Vazir.ttf'),
        ('vazirmatn', 'static/fonts/Vazirmatn-RD-FD-Regular.ttf'),
        ('tahoma', r'C:\Windows\Fonts\Tahoma.ttf'),
        ('dejavusans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
    ]

    @classmethod
    def get_colors(cls):
        if not REPORTLAB_AVAILABLE:
            return None
        class PDFColors:
            PRIMARY = colors.HexColor('#2563eb')
            SECONDARY = colors.HexColor('#64748b')
            SUCCESS = colors.HexColor('#10b981')
            LIGHT_BG = colors.HexColor('#f8fafc')
            BORDER = colors.HexColor('#e2e8f0')
            TEXT_PRIMARY = colors.HexColor('#0f172a')
            TEXT_SECONDARY = colors.HexColor('#475569')
        return PDFColors

    @staticmethod
    @lru_cache(maxsize=1)
    def register_persian_font():
        if not REPORTLAB_AVAILABLE:
            logger.warning("ReportLab not available, skipping font registration.")
            return 'Helvetica'
        
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.fonts import addMapping
        
        base_dir = str(settings.BASE_DIR)
        logger.info(f"Checking Persian font registration. BASE_DIR: {base_dir}")
        
        # Primary font to return
        primary_font = 'iransansx'
        
        for font_name, font_path in PDFBaseExportService.FONT_PATHS:
            full_paths = []
            if os.path.isabs(font_path):
                full_paths.append(font_path)
            else:
                full_paths.append(os.path.join(base_dir, font_path))
                # Workspace root fallback
                full_paths.append(os.path.join(os.path.dirname(base_dir), font_path))
                # Backend subdir fallback
                full_paths.append(os.path.join(base_dir, 'Backend', font_path))
            
            for path in full_paths:
                if os.path.exists(path):
                    try:
                        # Register the specific font
                        pdfmetrics.registerFont(TTFont(font_name, path))
                        
                        # Fix for "Can't map determine family/bold/italic"
                        # Explicitly map all variants to the same font file
                        from reportlab.pdfbase.pdfmetrics import registerFontFamily
                        registerFontFamily(font_name, normal=font_name, bold=font_name, italic=font_name, boldItalic=font_name)
                        
                        addMapping(font_name, 0, 0, font_name) # Normal
                        addMapping(font_name, 1, 0, font_name) # Bold
                        addMapping(font_name, 0, 1, font_name) # Italic
                        addMapping(font_name, 1, 1, font_name) # Bold Italic
                        
                        logger.info(f"Successfully registered and mapped font: {font_name} from {path}")
                        if font_name == primary_font:
                             return primary_font
                        break 
                    except Exception as e:
                        logger.error(f"Failed to register font {font_name} at {path}: {str(e)}")
                        continue
        
        # Final check if primary was registered in this process
        registered = pdfmetrics.getRegisteredFontNames()
        if primary_font in registered:
            return primary_font
        
        for f, _ in PDFBaseExportService.FONT_PATHS:
            if f in registered:
                return f

        logger.warning("No Persian fonts could be registered, falling back to Helvetica")
        return 'Helvetica'

    @staticmethod
    @lru_cache(maxsize=1024)
    def process_rtl(text):
        if not text:
            return ""
        
        # 1. Remove emojis and complex Unicode that crash ReportLab
        text = "".join(c for c in str(text) if ord(c) < 0x10000)
        
        # 2. Reshape and Bidi for Persian support
        if ARABIC_RESHAPER_AVAILABLE:
            try:
                reshaped = arabic_reshaper.reshape(text)
                text = get_display(reshaped)
            except Exception:
                pass
        
        # 3. Escape XML special characters AFTER reshaping to avoid messing with sequences
        text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return text

    @staticmethod
    def get_image(media_obj, max_w=5.0, max_h=4.0):
        if not REPORTLAB_AVAILABLE or not media_obj:
            return None
        try:
            from PIL import Image as PILImage
            path = None
            if hasattr(media_obj, 'file') and hasattr(media_obj.file, 'path'):
                path = media_obj.file.path
            elif hasattr(media_obj, 'path'):
                path = media_obj.path
            elif isinstance(media_obj, str):
                path = media_obj
                
            if not path or not os.path.exists(path):
                return None
                
            img = PILImage.open(path)
            w, h = img.size
            ratio = min(max_w * inch / w, max_h * inch / h, 1.0)
            img_obj = RLImage(path, width=w*ratio, height=h*ratio)
            img_obj.hAlign = 'RIGHT'
            return img_obj
        except Exception:
            return None

    @staticmethod
    def get_styles(font_name):
        if not REPORTLAB_AVAILABLE:
            return None
        
        clr = PDFBaseExportService.get_colors()
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        styles = getSampleStyleSheet()
        custom_styles = {
            'title': ParagraphStyle('PDFTitle', parent=styles['Heading1'], fontName=font_name, fontSize=24, alignment=2, textColor=clr.PRIMARY, spaceAfter=20),
            'section': ParagraphStyle('PDFSection', parent=styles['Heading3'], fontName=font_name, fontSize=14, alignment=2, textColor=clr.PRIMARY, spaceBefore=15, spaceAfter=10),
            'content': ParagraphStyle('PDFContent', parent=styles['Normal'], fontName=font_name, fontSize=11, leading=20, alignment=2, textColor=clr.TEXT_PRIMARY),
            'table_title': ParagraphStyle('TableTitle', parent=styles['Normal'], fontName=font_name, fontSize=20, alignment=2, textColor=clr.PRIMARY, spaceAfter=20)
        }
        return custom_styles

    @staticmethod
    def get_generic_footer_func(font_name, meta_text=""):
        rtl = PDFBaseExportService.process_rtl
        clr = PDFBaseExportService.get_colors()
        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont(font_name, 9)
            canvas.setFillColor(clr.TEXT_SECONDARY)
            page_num = canvas.getPageNumber()
            footer_text = rtl(f"{meta_text} | صفحه {page_num}")
            canvas.drawCentredString(doc.pagesize[0]/2, 30 if doc.pagesize[1] > doc.pagesize[0] else 20, footer_text)
            canvas.restoreState()
        return add_footer
