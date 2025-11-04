# -*- coding: utf-8 -*-
"""
Portfolio PDF Export Service
Handles PDF export functionality for portfolios with custom font and improved design
"""
from io import BytesIO
from datetime import datetime
from html import escape
import os
import platform
from django.http import HttpResponse
from django.conf import settings

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

from src.portfolio.models.portfolio import Portfolio


class PortfolioPDFExportService:
    """Service for exporting single portfolio to PDF format"""
    
    # Custom colors
    PRIMARY_COLOR = colors.HexColor('#2563eb')  # Blue
    SECONDARY_COLOR = colors.HexColor('#64748b')  # Slate
    SUCCESS_COLOR = colors.HexColor('#10b981')  # Green
    WARNING_COLOR = colors.HexColor('#f59e0b')  # Amber
    DANGER_COLOR = colors.HexColor('#ef4444')  # Red
    LIGHT_BG = colors.HexColor('#f8fafc')  # Slate 50
    MEDIUM_BG = colors.HexColor('#f1f5f9')  # Slate 100
    BORDER_COLOR = colors.HexColor('#e2e8f0')  # Slate 200
    TEXT_PRIMARY = colors.HexColor('#0f172a')  # Slate 900
    TEXT_SECONDARY = colors.HexColor('#475569')  # Slate 600
    
    @staticmethod
    def _register_persian_font():
        """Register Persian font - فقط IRANSansXV یا فونت سیستم"""
        persian_font_name = 'Helvetica'
        
        # فقط IRANSansXV را چک کن
        try:
            from django.conf import settings
            base_dir = getattr(settings, 'BASE_DIR', None)
            
            if base_dir:
                # Convert BASE_DIR to string if it's Path object (environ.Path or pathlib.Path)
                if hasattr(base_dir, '__str__'):
                    base_dir = str(base_dir)
                elif hasattr(base_dir, 'path'):
                    base_dir = str(base_dir.path)
                
                # فقط IRANSansXVF.ttf را چک کن
                font_path = os.path.join(base_dir, 'static', 'fonts', 'IRANSansXVF.ttf')
                print(f"Checking font at: {font_path}")
                
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('IRANSansXV', font_path))
                        print(f"Successfully registered IRANSansXV font from: {font_path}")
                        return 'IRANSansXV'
                    except Exception as e:
                        print(f"Failed to register IRANSansXV font: {e}")
                        import traceback
                        print(traceback.format_exc())
                        pass
                else:
                    print(f"Font file not found at: {font_path}")
        except Exception as e:
            print(f"Error checking IRANSansXV font: {e}")
            pass
        
        # Fallback to system font - فقط Tahoma در Windows
        try:
            system = platform.system()
            if system == 'Windows':
                tahoma_path = r'C:\Windows\Fonts\Tahoma.ttf'
                if os.path.exists(tahoma_path):
                    try:
                        pdfmetrics.registerFont(TTFont('PersianFont', tahoma_path))
                        return 'PersianFont'
                    except Exception as e:
                        print(f"Failed to register Tahoma font: {e}")
                        pass
        except Exception as e:
            print(f"Error checking Tahoma font: {e}")
            pass
        
        # اگر هیچ فونتی پیدا نشد، Helvetica پیش‌فرض استفاده می‌شود
        return persian_font_name
    
    @staticmethod
    def _process_persian_text(text):
        """Process Persian text with arabic_reshaper and bidi if available"""
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        except ImportError:
            return str(text)
    
    @staticmethod
    def _create_persian_styles(persian_font_name):
        """Create custom styles with Persian font (RTL alignment) and improved design"""
        styles = getSampleStyleSheet()
        
        # Title style with gradient-like effect
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=30,
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=32,
            borderPadding=10,
        )
        
        # Section heading style
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading3'],
            fontSize=16,
            textColor=PortfolioPDFExportService.PRIMARY_COLOR,
            spaceAfter=12,
            spaceBefore=20,
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=20,
            borderWidth=0,
            borderPadding=8,
            backColor=PortfolioPDFExportService.LIGHT_BG,
            borderColor=PortfolioPDFExportService.PRIMARY_COLOR,
            leftIndent=0,
            rightIndent=0,
        )
        
        # Normal text style
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=10,
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=16,
        )
        
        # Description style
        desc_style = ParagraphStyle(
            'Description',
            parent=styles['Normal'],
            fontSize=12,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=16,
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=18,
            leftIndent=20,
        )
        
        return {
            'title': title_style,
            'heading': heading_style,
            'normal': normal_style,
            'description': desc_style,
        }
    
    @staticmethod
    def _add_section_header(elements, text, process_persian_text, escape, heading_style):
        """Add a styled section header"""
        heading_text = process_persian_text(text)
        # Add decorative line
        elements.append(HRFlowable(width="100%", thickness=2, color=PortfolioPDFExportService.PRIMARY_COLOR, spaceBefore=10, spaceAfter=8))
        # Add heading with background
        heading_para = Paragraph(
            f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="8">'
            f'<b><font color="{PortfolioPDFExportService.PRIMARY_COLOR}">{escape(heading_text)}</font></b>'
            f'</para>',
            heading_style
        )
        elements.append(heading_para)
        elements.append(Spacer(1, 0.15*inch))
    
    @staticmethod
    def _add_image_to_pdf(image_file, max_width=5*inch, max_height=4*inch):
        """Add image to PDF with size constraints and border"""
        try:
            if not image_file or not hasattr(image_file, 'file'):
                return None
            
            file_path = image_file.file.path if hasattr(image_file.file, 'path') else None
            if not file_path or not os.path.exists(file_path):
                url = image_file.file.url if hasattr(image_file.file, 'url') else None
                if url:
                    return None
                return None
            
            from PIL import Image as PILImage
            img = PILImage.open(file_path)
            img_width, img_height = img.size
            
            # Calculate aspect ratio and resize if needed
            width_ratio = max_width / img_width
            height_ratio = max_height / img_height
            ratio = min(width_ratio, height_ratio, 1.0)
            
            new_width = img_width * ratio
            new_height = img_height * ratio
            
            reportlab_image = Image(file_path, width=new_width, height=new_height, kind='proportional')
            return reportlab_image
        except Exception:
            return None
    
    @staticmethod
    def _add_basic_info_table(elements, portfolio, persian_font_name, process_persian_text, escape, heading_style=None, normal_style=None):
        """Add basic information table to PDF with improved styling"""
        # تمام متن‌های فارسی تایپ شده دستی
        info_data = [
            [str(portfolio.id), 'شناسه:'],
            [portfolio.slug or '-', 'اسلاگ:'],
            [portfolio.get_status_display() if hasattr(portfolio, 'get_status_display') else portfolio.status, 'وضعیت:'],
            ['بله' if portfolio.is_featured else 'خیر', 'ویژه:'],
            ['بله' if portfolio.is_public else 'خیر', 'عمومی:'],
            ['بله' if portfolio.is_active else 'خیر', 'فعال:'],
        ]
        
        if portfolio.created_at:
            info_data.append([portfolio.created_at.strftime("%Y-%m-%d %H:%M:%S"), 'تاریخ ایجاد:'])
        if portfolio.updated_at:
            info_data.append([portfolio.updated_at.strftime("%Y-%m-%d %H:%M:%S"), 'تاریخ بروزرسانی:'])
        
        processed_info_data = [[process_persian_text(cell) for cell in row] for row in info_data]
        escaped_info_data = [[escape(str(cell)) for cell in row] for row in processed_info_data]
        
        info_table = Table(escaped_info_data, colWidths=[4*inch, 2*inch])
        info_table.setStyle(TableStyle([
            # Header row (first row styling)
            ('BACKGROUND', (1, 0), (1, -1), PortfolioPDFExportService.PRIMARY_COLOR),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
            ('FONTNAME', (1, 0), (1, -1), persian_font_name),
            ('FONTSIZE', (1, 0), (1, -1), 11),
            ('FONTNAME', (0, 0), (0, -1), persian_font_name),
            ('FONTSIZE', (0, 0), (0, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), PortfolioPDFExportService.TEXT_PRIMARY),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            # Grid and borders
            ('GRID', (0, 0), (-1, -1), 1, PortfolioPDFExportService.BORDER_COLOR),
            ('LINEBELOW', (0, 0), (-1, 0), 2, PortfolioPDFExportService.PRIMARY_COLOR),
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PortfolioPDFExportService.LIGHT_BG]),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.4*inch))
    
    @staticmethod
    def _add_seo_table(elements, portfolio, persian_font_name, process_persian_text, escape, heading_style):
        """Add SEO information table to PDF with improved styling"""
        # تمام متن‌های فارسی تایپ شده دستی
        seo_fields = []
        if portfolio.meta_title:
            seo_fields.append(['عنوان متا:', portfolio.meta_title])
        if portfolio.meta_description:
            seo_fields.append(['توضیحات متا:', portfolio.meta_description])
        if portfolio.og_title:
            seo_fields.append(['عنوان Open Graph:', portfolio.og_title])
        if portfolio.og_description:
            seo_fields.append(['توضیحات Open Graph:', portfolio.og_description])
        if portfolio.canonical_url:
            seo_fields.append(['آدرس Canonical:', portfolio.canonical_url])
        if portfolio.robots_meta:
            seo_fields.append(['Robots Meta:', portfolio.robots_meta])
        
        if seo_fields:
            PortfolioPDFExportService._add_section_header(
                elements, 'اطلاعات SEO', process_persian_text, escape, heading_style
            )
            
            seo_data_rtl = [[row[1], row[0]] for row in seo_fields]
            processed_seo_data = [[process_persian_text(cell) for cell in row] for row in seo_data_rtl]
            escaped_seo_data = [[escape(str(cell)) for cell in row] for row in processed_seo_data]
            
            seo_table = Table(escaped_seo_data, colWidths=[4*inch, 2*inch])
            seo_table.setStyle(TableStyle([
                ('BACKGROUND', (1, 0), (1, -1), PortfolioPDFExportService.SECONDARY_COLOR),
                ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
                ('FONTNAME', (0, 0), (-1, -1), persian_font_name),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (0, -1), PortfolioPDFExportService.TEXT_PRIMARY),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, PortfolioPDFExportService.BORDER_COLOR),
                ('LINEBELOW', (0, 0), (-1, 0), 2, PortfolioPDFExportService.SECONDARY_COLOR),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PortfolioPDFExportService.LIGHT_BG]),
            ]))
            
            elements.append(seo_table)
            elements.append(Spacer(1, 0.3*inch))
    
    @staticmethod
    def _add_media_sections(elements, portfolio, add_image_func, process_persian_text, escape, heading_style, normal_style):
        """Add all media sections (images, videos, audios, documents) to PDF with improved design"""
        # Main image - متن فارسی تایپ شده دستی
        main_image = portfolio.get_main_image()
        if main_image:
            PortfolioPDFExportService._add_section_header(
                elements, 'تصویر اصلی', process_persian_text, escape, heading_style
            )
            pdf_image = add_image_func(main_image, max_width=5.5*inch, max_height=4.5*inch)
            if pdf_image:
                # Add border around image
                elements.append(pdf_image)
                elements.append(Spacer(1, 0.1*inch))
                if main_image.title:
                    image_title = process_persian_text(main_image.title)
                    elements.append(Paragraph(
                        f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}"><i>{escape(image_title)}</i></font>',
                        normal_style
                    ))
                elements.append(Spacer(1, 0.25*inch))
        
        # OG image - متن فارسی تایپ شده دستی
        if portfolio.og_image:
            PortfolioPDFExportService._add_section_header(
                elements, 'تصویر Open Graph', process_persian_text, escape, heading_style
            )
            pdf_image = add_image_func(portfolio.og_image, max_width=5.5*inch, max_height=4.5*inch)
            if pdf_image:
                elements.append(pdf_image)
                elements.append(Spacer(1, 0.1*inch))
                if portfolio.og_image.title:
                    image_title = process_persian_text(portfolio.og_image.title)
                    elements.append(Paragraph(
                        f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}"><i>{escape(image_title)}</i></font>',
                        normal_style
                    ))
                elements.append(Spacer(1, 0.25*inch))
        
        # Images gallery - محدود به 10 تصویر برای جلوگیری از PDF سنگین
        all_images = portfolio.images.select_related('image').all()
        total_images = all_images.count()
        images = list(all_images.order_by('order', 'created_at')[:10])
        
        if images:
            # متن‌های فارسی تایپ شده دستی
            header_text = 'گالری تصاویر'
            if total_images > 10:
                header_text = f'گالری تصاویر (نمایش 10 از {total_images} تصویر)'
            PortfolioPDFExportService._add_section_header(
                elements, header_text, process_persian_text, escape, heading_style
            )
            for idx, portfolio_image in enumerate(images):
                if portfolio_image.image:
                    pdf_image = add_image_func(portfolio_image.image, max_width=4.5*inch, max_height=3.5*inch)
                    if pdf_image:
                        elements.append(pdf_image)
                        elements.append(Spacer(1, 0.08*inch))
                        image_title = portfolio_image.image.title or f"تصویر {portfolio_image.order + 1}"
                        processed_title = process_persian_text(image_title)
                        elements.append(Paragraph(
                            f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}">{escape(processed_title)}</font>',
                            normal_style
                        ))
                        if idx < len(images) - 1:
                            elements.append(HRFlowable(width="80%", thickness=1, color=PortfolioPDFExportService.BORDER_COLOR, spaceBefore=0.15*inch, spaceAfter=0.15*inch))
            
            if total_images > 10:
                note_text = process_persian_text(f'نکته: برای مشاهده تمام {total_images} تصویر، به پنل مدیریت مراجعه کنید.')
                elements.append(Paragraph(
                    f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}"><i>{escape(note_text)}</i></font>',
                    normal_style
                ))
            elements.append(Spacer(1, 0.3*inch))
        
        # Videos - متن فارسی تایپ شده دستی
        videos = portfolio.videos.select_related('video', 'video__cover_image').all().order_by('order', 'created_at')
        if videos.exists():
            PortfolioPDFExportService._add_section_header(
                elements, 'ویدیوها', process_persian_text, escape, heading_style
            )
            for idx, portfolio_video in enumerate(videos):
                video_title = portfolio_video.video.title or f"ویدیو {portfolio_video.order + 1}"
                processed_title = process_persian_text(video_title)
                elements.append(Paragraph(
                    f'<font color="{PortfolioPDFExportService.PRIMARY_COLOR}"><b>▸</b></font> '
                    f'<font color="{PortfolioPDFExportService.TEXT_PRIMARY}">{escape(processed_title)}</font>',
                    normal_style
                ))
                
                if portfolio_video.video.cover_image:
                    pdf_image = add_image_func(portfolio_video.video.cover_image, max_width=4*inch, max_height=3*inch)
                    if pdf_image:
                        elements.append(Spacer(1, 0.08*inch))
                        elements.append(pdf_image)
                if idx < len(videos) - 1:
                    elements.append(Spacer(1, 0.2*inch))
            elements.append(Spacer(1, 0.3*inch))
        
        # Audios - متن فارسی تایپ شده دستی
        audios = portfolio.audios.select_related('audio', 'audio__cover_image').all().order_by('order', 'created_at')
        if audios.exists():
            PortfolioPDFExportService._add_section_header(
                elements, 'فایل‌های صوتی', process_persian_text, escape, heading_style
            )
            for idx, portfolio_audio in enumerate(audios):
                audio_title = portfolio_audio.audio.title or f"فایل صوتی {portfolio_audio.order + 1}"
                processed_title = process_persian_text(audio_title)
                elements.append(Paragraph(
                    f'<font color="{PortfolioPDFExportService.SUCCESS_COLOR}"><b>♪</b></font> '
                    f'<font color="{PortfolioPDFExportService.TEXT_PRIMARY}">{escape(processed_title)}</font>',
                    normal_style
                ))
                
                if portfolio_audio.audio.cover_image:
                    pdf_image = add_image_func(portfolio_audio.audio.cover_image, max_width=4*inch, max_height=3*inch)
                    if pdf_image:
                        elements.append(Spacer(1, 0.08*inch))
                        elements.append(pdf_image)
                if idx < len(audios) - 1:
                    elements.append(Spacer(1, 0.2*inch))
            elements.append(Spacer(1, 0.3*inch))
        
        # Documents - متن فارسی تایپ شده دستی
        documents = portfolio.documents.select_related('document', 'document__cover_image').all().order_by('order', 'created_at')
        if documents.exists():
            PortfolioPDFExportService._add_section_header(
                elements, 'اسناد', process_persian_text, escape, heading_style
            )
            for idx, portfolio_doc in enumerate(documents):
                doc_title = portfolio_doc.title or portfolio_doc.document.title or f"سند {portfolio_doc.order + 1}"
                processed_title = process_persian_text(doc_title)
                elements.append(Paragraph(
                    f'<font color="{PortfolioPDFExportService.WARNING_COLOR}"><b>📄</b></font> '
                    f'<font color="{PortfolioPDFExportService.TEXT_PRIMARY}">{escape(processed_title)}</font>',
                    normal_style
                ))
                
                if portfolio_doc.document.cover_image:
                    pdf_image = add_image_func(portfolio_doc.document.cover_image, max_width=4*inch, max_height=3*inch)
                    if pdf_image:
                        elements.append(Spacer(1, 0.08*inch))
                        elements.append(pdf_image)
                if idx < len(documents) - 1:
                    elements.append(Spacer(1, 0.2*inch))
            elements.append(Spacer(1, 0.3*inch))
    
    @staticmethod
    def export_portfolio_pdf(portfolio):
        """
        Export single portfolio to PDF with improved design
        
        Args:
            portfolio: Portfolio instance with prefetch_related
            
        Returns:
            HttpResponse with PDF file
            
        Raises:
            ImportError: If reportlab package is not installed
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError("PDF export requires reportlab package. Please install it.")
        
        try:
            # Create PDF buffer
            buffer = BytesIO()
            
            # Register Persian font
            persian_font_name = PortfolioPDFExportService._register_persian_font()
            print(f"Using font: {persian_font_name}")
            
            # Process Persian text function
            process_persian_text = PortfolioPDFExportService._process_persian_text
            
            # Define header and footer functions
            def add_header_footer(canv, doc):
                """Add header and footer to each page"""
                try:
                    canv.saveState()
                    # Header with title
                    canv.setFont(persian_font_name, 10)
                    canv.setFillColor(PortfolioPDFExportService.TEXT_PRIMARY)
                    if portfolio:
                        title_text = process_persian_text(portfolio.title)
                        canv.drawRightString(A4[0] - 60, A4[1] - 40, title_text)
                    canv.setFillColor(PortfolioPDFExportService.TEXT_SECONDARY)
                    canv.setFont(persian_font_name, 8)
                    date_text = process_persian_text(datetime.now().strftime("%Y/%m/%d %H:%M"))
                    canv.drawString(60, A4[1] - 40, date_text)
                    
                    # Header line
                    canv.setStrokeColor(PortfolioPDFExportService.BORDER_COLOR)
                    canv.setLineWidth(1)
                    canv.line(60, A4[1] - 50, A4[0] - 60, A4[1] - 50)
                    
                    # Footer with page number
                    canv.setFillColor(PortfolioPDFExportService.TEXT_SECONDARY)
                    canv.setFont(persian_font_name, 8)
                    page_num = process_persian_text(f"صفحه {doc.page}")
                    canv.drawRightString(A4[0] - 60, 40, page_num)
                    
                    # Footer line
                    canv.setStrokeColor(PortfolioPDFExportService.BORDER_COLOR)
                    canv.setLineWidth(1)
                    canv.line(60, 50, A4[0] - 60, 50)
                    
                    canv.restoreState()
                except Exception as e:
                    # اگر مشکلی در header/footer پیش آمد، فقط restore کن
                    try:
                        canv.restoreState()
                    except:
                        pass
            
            # Create document with custom margins and header/footer
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=60,
                leftMargin=60,
                topMargin=80,
                bottomMargin=60,
                onFirstPage=add_header_footer,
                onLaterPages=add_header_footer
            )
            
            # Container for PDF elements
            elements = []
            styles = getSampleStyleSheet()
            
            # Create custom styles
            pdf_styles = PortfolioPDFExportService._create_persian_styles(persian_font_name)
            
            # Add title with improved styling
            processed_title = process_persian_text(portfolio.title)
            title_para = Paragraph(
                f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="12">'
                f'<font color="{PortfolioPDFExportService.PRIMARY_COLOR}"><b>{escape(processed_title)}</b></font>'
                f'</para>',
                pdf_styles['title']
            )
            elements.append(title_para)
            # Add colored line below title
            elements.append(HRFlowable(width="100%", thickness=4, color=PortfolioPDFExportService.PRIMARY_COLOR, spaceBefore=0, spaceAfter=0.4*inch))
            
            # Add basic information section
            PortfolioPDFExportService._add_section_header(
                elements, 'اطلاعات پایه', process_persian_text, escape, pdf_styles['heading']
            )
            PortfolioPDFExportService._add_basic_info_table(
                elements, portfolio, persian_font_name, process_persian_text, escape
            )
            
            # Add short description - متن فارسی تایپ شده دستی
            if portfolio.short_description:
                PortfolioPDFExportService._add_section_header(
                    elements, 'توضیحات کوتاه', process_persian_text, escape, pdf_styles['heading']
                )
                processed_short_desc = process_persian_text(portfolio.short_description)
                desc_para = Paragraph(
                    f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="10" borderWidth="1">'
                    f'{escape(processed_short_desc)}'
                    f'</para>',
                    pdf_styles['description']
                )
                elements.append(desc_para)
                elements.append(Spacer(1, 0.3*inch))
            
            # Add full description - متن فارسی تایپ شده دستی
            if portfolio.description:
                PortfolioPDFExportService._add_section_header(
                    elements, 'توضیحات کامل', process_persian_text, escape, pdf_styles['heading']
                )
                processed_desc = process_persian_text(portfolio.description)
                escaped_desc = escape(processed_desc).replace('\n', '<br/>')
                desc_para = Paragraph(
                    f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="10" borderWidth="1">'
                    f'{escaped_desc}'
                    f'</para>',
                    pdf_styles['description']
                )
                elements.append(desc_para)
                elements.append(Spacer(1, 0.3*inch))
            
            # Add categories - متن فارسی تایپ شده دستی
            categories = portfolio.categories.all()
            if categories:
                PortfolioPDFExportService._add_section_header(
                    elements, 'دسته‌بندی‌ها', process_persian_text, escape, pdf_styles['heading']
                )
                category_names = ", ".join([cat.name for cat in categories])
                processed_categories = process_persian_text(category_names)
                cat_para = Paragraph(
                    f'<para backColor="{PortfolioPDFExportService.SUCCESS_COLOR}" borderPadding="8" borderWidth="0" borderColor="{PortfolioPDFExportService.SUCCESS_COLOR}">'
                    f'<font color="white"><b>{escape(processed_categories)}</b></font>'
                    f'</para>',
                    pdf_styles['normal']
                )
                elements.append(cat_para)
                elements.append(Spacer(1, 0.3*inch))
            
            # Add tags - متن فارسی تایپ شده دستی
            tags = portfolio.tags.all()
            if tags:
                PortfolioPDFExportService._add_section_header(
                    elements, 'تگ‌ها', process_persian_text, escape, pdf_styles['heading']
                )
                tag_names = ", ".join([tag.name for tag in tags])
                processed_tags = process_persian_text(tag_names)
                tag_para = Paragraph(
                    f'<para backColor="{PortfolioPDFExportService.SECONDARY_COLOR}" borderPadding="8" borderWidth="0" borderColor="{PortfolioPDFExportService.SECONDARY_COLOR}">'
                    f'<font color="white"><b>{escape(processed_tags)}</b></font>'
                    f'</para>',
                    pdf_styles['normal']
                )
                elements.append(tag_para)
                elements.append(Spacer(1, 0.3*inch))
            
            # Add options - متن فارسی تایپ شده دستی
            options = portfolio.options.all()
            if options:
                PortfolioPDFExportService._add_section_header(
                    elements, 'گزینه‌ها', process_persian_text, escape, pdf_styles['heading']
                )
                options_list = []
                for opt in options:
                    if opt.description:
                        opt_text = f"{opt.name} ({opt.description})"
                        options_list.append(process_persian_text(opt_text))
                    else:
                        options_list.append(process_persian_text(opt.name))
                options_text = ", ".join(options_list)
                opt_para = Paragraph(
                    f'<para backColor="{PortfolioPDFExportService.WARNING_COLOR}" borderPadding="8" borderWidth="0" borderColor="{PortfolioPDFExportService.WARNING_COLOR}">'
                    f'<font color="white"><b>{escape(options_text)}</b></font>'
                    f'</para>',
                    pdf_styles['normal']
                )
                elements.append(opt_para)
                elements.append(Spacer(1, 0.3*inch))
            
            # Add SEO information
            PortfolioPDFExportService._add_seo_table(
                elements, portfolio, persian_font_name, process_persian_text, escape, pdf_styles['heading']
            )
            
            # Add media sections
            add_image_func = PortfolioPDFExportService._add_image_to_pdf
            PortfolioPDFExportService._add_media_sections(
                elements, portfolio, add_image_func, process_persian_text, escape, 
                pdf_styles['heading'], pdf_styles['normal']
            )
            
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            
            # Create HTTP response
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            timestamp = datetime.now().strftime("%Y%m%d")
            response['Content-Disposition'] = f'attachment; filename="portfolio_{portfolio.id}_{timestamp}.pdf"'
            
            return response
        except Exception as e:
            import traceback
            error_message = str(e)
            error_traceback = traceback.format_exc()
            print(f"PDF Export Error: {error_message}")
            print(f"Traceback: {error_traceback}")
            raise Exception(f"PDF export failed: {error_message}")
    
