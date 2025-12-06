from io import BytesIO
from datetime import datetime
from html import escape
import os
import platform
from django.http import HttpResponse
from django.conf import settings

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
    colors = None
    inch = None
    A4 = None
    getSampleStyleSheet = None
    ParagraphStyle = None
    SimpleDocTemplate = None
    Paragraph = None
    Spacer = None
    Table = None
    TableStyle = None
    Image = None
    HRFlowable = None
    pdfmetrics = None
    TTFont = None

from src.portfolio.messages.messages import PORTFOLIO_ERRORS, PDF_LABELS


class PortfolioPDFExportService:
    
    if REPORTLAB_AVAILABLE and colors:
        PRIMARY_COLOR = colors.HexColor('#2563eb')
        SECONDARY_COLOR = colors.HexColor('#64748b')
        SUCCESS_COLOR = colors.HexColor('#10b981')
        WARNING_COLOR = colors.HexColor('#f59e0b')
        DANGER_COLOR = colors.HexColor('#ef4444')
        LIGHT_BG = colors.HexColor('#f8fafc')
        MEDIUM_BG = colors.HexColor('#f1f5f9')
        BORDER_COLOR = colors.HexColor('#e2e8f0')
        TEXT_PRIMARY = colors.HexColor('#0f172a')
        TEXT_SECONDARY = colors.HexColor('#475569')
        WHITE_COLOR = colors.white
    else:
        PRIMARY_COLOR = None
        SECONDARY_COLOR = None
        SUCCESS_COLOR = None
        WARNING_COLOR = None
        DANGER_COLOR = None
        LIGHT_BG = None
        MEDIUM_BG = None
        BORDER_COLOR = None
        TEXT_PRIMARY = None
        TEXT_SECONDARY = None
        WHITE_COLOR = None
    
    @staticmethod
    def _register_persian_font():
        persian_font_name = 'Helvetica'
        
        try:
            base_dir = getattr(settings, 'BASE_DIR', None)
            
            if base_dir:
                if hasattr(base_dir, '__str__'):
                    base_dir = str(base_dir)
                elif hasattr(base_dir, 'path'):
                    base_dir = str(base_dir.path)
                
                font_path = os.path.join(base_dir, 'static', 'fonts', 'IRANSansXVF.ttf')
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('IRANSansXV', font_path))
                        return 'IRANSansXV'
                    except Exception:
                        pass
        except Exception:
            pass
        
        try:
            system = platform.system()
            if system == 'Windows':
                tahoma_path = r'C:\Windows\Fonts\Tahoma.ttf'
                if os.path.exists(tahoma_path):
                    try:
                        pdfmetrics.registerFont(TTFont('PersianFont', tahoma_path))
                        return 'PersianFont'
                    except Exception:
                        pass
        except Exception:
            pass
        
        return persian_font_name
    
    @staticmethod
    def _process_persian_text(text):
        if ARABIC_RESHAPER_AVAILABLE:
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        return str(text)
    
    @staticmethod
    def _create_persian_styles(persian_font_name):
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=30,
            alignment=2,
            fontName=persian_font_name,
            leading=32,
            borderPadding=10,
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading3'],
            fontSize=16,
            textColor=PortfolioPDFExportService.PRIMARY_COLOR,
            spaceAfter=12,
            spaceBefore=20,
            alignment=2,
            fontName=persian_font_name,
            leading=20,
            borderWidth=0,
            borderPadding=8,
            backColor=PortfolioPDFExportService.LIGHT_BG,
            borderColor=PortfolioPDFExportService.PRIMARY_COLOR,
            leftIndent=0,
            rightIndent=0,
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=10,
            alignment=2,
            fontName=persian_font_name,
            leading=16,
        )
        
        desc_style = ParagraphStyle(
            'Description',
            parent=styles['Normal'],
            fontSize=12,
            textColor=PortfolioPDFExportService.TEXT_PRIMARY,
            spaceAfter=16,
            alignment=2,
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
        heading_text = process_persian_text(text)
        elements.append(HRFlowable(width="100%", thickness=2, color=PortfolioPDFExportService.PRIMARY_COLOR, spaceBefore=10, spaceAfter=8))
        heading_para = Paragraph(
            f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="8">'
            f'<b><font color="{PortfolioPDFExportService.PRIMARY_COLOR}">{escape(heading_text)}</font></b>'
            f'</para>',
            heading_style
        )
        elements.append(heading_para)
        elements.append(Spacer(1, 0.15*inch))
    
    @staticmethod
    def _add_image_to_pdf(image_file, max_width=None, max_height=None):
        if max_width is None:
            max_width = 5*inch if inch else 360
        if max_height is None:
            max_height = 4*inch if inch else 288
        try:
            if not image_file or not hasattr(image_file, 'file'):
                return None
            
            file_path = image_file.file.path if hasattr(image_file.file, 'path') else None
            if not file_path or not os.path.exists(file_path):
                url = image_file.file.url if hasattr(image_file.file, 'url') else None
                if url:
                    return None
                return None
            
            if not PIL_AVAILABLE:
                return None
            
            img = PILImage.open(file_path)
            img_width, img_height = img.size
            
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
        info_data = [
            [str(portfolio.id), PDF_LABELS['id']],
            [portfolio.slug or '-', PDF_LABELS['slug']],
            [portfolio.get_status_display() if hasattr(portfolio, 'get_status_display') else portfolio.status, PDF_LABELS['status']],
            [PDF_LABELS['yes'] if portfolio.is_featured else PDF_LABELS['no'], PDF_LABELS['featured']],
            [PDF_LABELS['yes'] if portfolio.is_public else PDF_LABELS['no'], PDF_LABELS['public']],
            [PDF_LABELS['yes'] if portfolio.is_active else PDF_LABELS['no'], PDF_LABELS['active']],
        ]
        
        if portfolio.created_at:
            info_data.append([portfolio.created_at.strftime("%Y-%m-%d %H:%M:%S"), PDF_LABELS['created_at']])
        if portfolio.updated_at:
            info_data.append([portfolio.updated_at.strftime("%Y-%m-%d %H:%M:%S"), PDF_LABELS['updated_at']])
        
        processed_info_data = [[process_persian_text(cell) for cell in row] for row in info_data]
        escaped_info_data = [[escape(str(cell)) for cell in row] for row in processed_info_data]
        
        info_table = Table(escaped_info_data, colWidths=[4*inch, 2*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (1, 0), (1, -1), PortfolioPDFExportService.PRIMARY_COLOR),
            ('TEXTCOLOR', (1, 0), (1, -1), PortfolioPDFExportService.WHITE_COLOR),
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
            ('GRID', (0, 0), (-1, -1), 1, PortfolioPDFExportService.BORDER_COLOR),
            ('LINEBELOW', (0, 0), (-1, 0), 2, PortfolioPDFExportService.PRIMARY_COLOR),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [PortfolioPDFExportService.WHITE_COLOR, PortfolioPDFExportService.LIGHT_BG]),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 0.4*inch))
    
    @staticmethod
    def _add_seo_table(elements, portfolio, persian_font_name, process_persian_text, escape, heading_style):
        seo_fields = []
        if portfolio.meta_title:
            seo_fields.append([PDF_LABELS['meta_title'], portfolio.meta_title])
        if portfolio.meta_description:
            seo_fields.append([PDF_LABELS['meta_description'], portfolio.meta_description])
        if portfolio.og_title:
            seo_fields.append([PDF_LABELS['og_title'], portfolio.og_title])
        if portfolio.og_description:
            seo_fields.append([PDF_LABELS['og_description'], portfolio.og_description])
        if portfolio.canonical_url:
            seo_fields.append([PDF_LABELS['canonical_url'], portfolio.canonical_url])
        if portfolio.robots_meta:
            seo_fields.append(['Robots Meta:', portfolio.robots_meta])
        
        if seo_fields:
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['seo_info'], process_persian_text, escape, heading_style
            )
            
            seo_data_rtl = [[row[1], row[0]] for row in seo_fields]
            processed_seo_data = [[process_persian_text(cell) for cell in row] for row in seo_data_rtl]
            escaped_seo_data = [[escape(str(cell)) for cell in row] for row in processed_seo_data]
            
            seo_table = Table(escaped_seo_data, colWidths=[4*inch, 2*inch])
            seo_table.setStyle(TableStyle([
                ('BACKGROUND', (1, 0), (1, -1), PortfolioPDFExportService.SECONDARY_COLOR),
                ('TEXTCOLOR', (1, 0), (1, -1), PortfolioPDFExportService.WHITE_COLOR),
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
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [PortfolioPDFExportService.WHITE_COLOR, PortfolioPDFExportService.LIGHT_BG]),
            ]))
            
            elements.append(seo_table)
            elements.append(Spacer(1, 0.3*inch))
    
    @staticmethod
    def _add_media_sections(elements, portfolio, add_image_func, process_persian_text, escape, heading_style, normal_style):
        main_image = portfolio.get_main_image()
        if main_image:
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['main_image'], process_persian_text, escape, heading_style
            )
            pdf_image = add_image_func(main_image, max_width=5.5*inch, max_height=4.5*inch)
            if pdf_image:
                elements.append(pdf_image)
                elements.append(Spacer(1, 0.1*inch))
                if main_image.title:
                    image_title = process_persian_text(main_image.title)
                    elements.append(Paragraph(
                        f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}"><i>{escape(image_title)}</i></font>',
                        normal_style
                    ))
                elements.append(Spacer(1, 0.25*inch))
        
        if portfolio.og_image:
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['og_image'], process_persian_text, escape, heading_style
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
        
        all_images = portfolio.images.select_related('image').all()
        total_images = all_images.count()
        images = list(all_images.order_by('order', 'created_at')[:10])
        
        if images:
            header_text = PDF_LABELS['gallery']
            if total_images > 10:
                header_text = PDF_LABELS['gallery_with_count'].format(count=total_images)
            PortfolioPDFExportService._add_section_header(
                elements, header_text, process_persian_text, escape, heading_style
            )
            for idx, portfolio_image in enumerate(images):
                if portfolio_image.image:
                    pdf_image = add_image_func(portfolio_image.image, max_width=4.5*inch, max_height=3.5*inch)
                    if pdf_image:
                        elements.append(pdf_image)
                        elements.append(Spacer(1, 0.08*inch))
                        image_title = portfolio_image.image.title or PDF_LABELS['image'].format(order=portfolio_image.order + 1)
                        processed_title = process_persian_text(image_title)
                        elements.append(Paragraph(
                            f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}">{escape(processed_title)}</font>',
                            normal_style
                        ))
                        if idx < len(images) - 1:
                            elements.append(HRFlowable(width="80%", thickness=1, color=PortfolioPDFExportService.BORDER_COLOR, spaceBefore=0.15*inch, spaceAfter=0.15*inch))
            
            if total_images > 10:
                note_text = process_persian_text(PDF_LABELS['gallery_note'].format(count=total_images))
                elements.append(Paragraph(
                    f'<font color="{PortfolioPDFExportService.TEXT_SECONDARY}"><i>{escape(note_text)}</i></font>',
                    normal_style
                ))
            elements.append(Spacer(1, 0.3*inch))
        
        videos = portfolio.videos.select_related('video', 'video__cover_image').all().order_by('order', 'created_at')
        if videos.exists():
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['videos'], process_persian_text, escape, heading_style
            )
            for idx, portfolio_video in enumerate(videos):
                video_title = portfolio_video.video.title or PDF_LABELS['video'].format(order=portfolio_video.order + 1)
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
        
        audios = portfolio.audios.select_related('audio', 'audio__cover_image').all().order_by('order', 'created_at')
        if audios.exists():
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['audios'], process_persian_text, escape, heading_style
            )
            for idx, portfolio_audio in enumerate(audios):
                audio_title = portfolio_audio.audio.title or PDF_LABELS['audio'].format(order=portfolio_audio.order + 1)
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
        
        documents = portfolio.documents.select_related('document', 'document__cover_image').all().order_by('order', 'created_at')
        if documents.exists():
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['documents'], process_persian_text, escape, heading_style
            )
            for idx, portfolio_doc in enumerate(documents):
                doc_title = portfolio_doc.title or portfolio_doc.document.title or PDF_LABELS['document'].format(order=portfolio_doc.order + 1)
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
        if not REPORTLAB_AVAILABLE:
            raise ImportError(PORTFOLIO_ERRORS["portfolio_export_failed"])
        
        try:
            buffer = BytesIO()
            
            persian_font_name = PortfolioPDFExportService._register_persian_font()
            
            process_persian_text = PortfolioPDFExportService._process_persian_text
            
            def add_header_footer(canv, doc):
                try:
                    canv.saveState()
                    canv.setFont(persian_font_name, 10)
                    canv.setFillColor(PortfolioPDFExportService.TEXT_PRIMARY)
                    if portfolio:
                        title_text = process_persian_text(portfolio.title)
                        canv.drawRightString(A4[0] - 60, A4[1] - 40, title_text)
                    canv.setFillColor(PortfolioPDFExportService.TEXT_SECONDARY)
                    canv.setFont(persian_font_name, 8)
                    date_text = process_persian_text(datetime.now().strftime("%Y/%m/%d %H:%M"))
                    canv.drawString(60, A4[1] - 40, date_text)
                    
                    canv.setStrokeColor(PortfolioPDFExportService.BORDER_COLOR)
                    canv.setLineWidth(1)
                    canv.line(60, A4[1] - 50, A4[0] - 60, A4[1] - 50)
                    
                    canv.setFillColor(PortfolioPDFExportService.TEXT_SECONDARY)
                    canv.setFont(persian_font_name, 8)
                    page_num = process_persian_text(PDF_LABELS['page'].format(page=doc.page))
                    canv.drawRightString(A4[0] - 60, 40, page_num)
                    
                    canv.setStrokeColor(PortfolioPDFExportService.BORDER_COLOR)
                    canv.setLineWidth(1)
                    canv.line(60, 50, A4[0] - 60, 50)
                    
                    canv.restoreState()
                except Exception as e:
                    try:
                        canv.restoreState()
                    except:
                        pass
            
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
            
            elements = []
            styles = getSampleStyleSheet()
            
            pdf_styles = PortfolioPDFExportService._create_persian_styles(persian_font_name)
            
            processed_title = process_persian_text(portfolio.title)
            title_para = Paragraph(
                f'<para backColor="{PortfolioPDFExportService.LIGHT_BG}" borderPadding="12">'
                f'<font color="{PortfolioPDFExportService.PRIMARY_COLOR}"><b>{escape(processed_title)}</b></font>'
                f'</para>',
                pdf_styles['title']
            )
            elements.append(title_para)
            elements.append(HRFlowable(width="100%", thickness=4, color=PortfolioPDFExportService.PRIMARY_COLOR, spaceBefore=0, spaceAfter=0.4*inch))
            
            PortfolioPDFExportService._add_section_header(
                elements, PDF_LABELS['basic_info'], process_persian_text, escape, pdf_styles['heading']
            )
            PortfolioPDFExportService._add_basic_info_table(
                elements, portfolio, persian_font_name, process_persian_text, escape
            )
            
            if portfolio.short_description:
                PortfolioPDFExportService._add_section_header(
                    elements, PDF_LABELS['short_description'], process_persian_text, escape, pdf_styles['heading']
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
            
            if portfolio.description:
                PortfolioPDFExportService._add_section_header(
                    elements, PDF_LABELS['full_description'], process_persian_text, escape, pdf_styles['heading']
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
            
            categories = portfolio.categories.all()
            if categories:
                PortfolioPDFExportService._add_section_header(
                    elements, PDF_LABELS['categories'], process_persian_text, escape, pdf_styles['heading']
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
            
            tags = portfolio.tags.all()
            if tags:
                PortfolioPDFExportService._add_section_header(
                    elements, PDF_LABELS['tags'], process_persian_text, escape, pdf_styles['heading']
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
            
            options = portfolio.options.all()
            if options:
                PortfolioPDFExportService._add_section_header(
                    elements, PDF_LABELS['options'], process_persian_text, escape, pdf_styles['heading']
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
            
            PortfolioPDFExportService._add_seo_table(
                elements, portfolio, persian_font_name, process_persian_text, escape, pdf_styles['heading']
            )
            
            add_image_func = PortfolioPDFExportService._add_image_to_pdf
            PortfolioPDFExportService._add_media_sections(
                elements, portfolio, add_image_func, process_persian_text, escape, 
                pdf_styles['heading'], pdf_styles['normal']
            )
            
            doc.build(elements)
            buffer.seek(0)
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            timestamp = datetime.now().strftime("%Y%m%d")
            response['Content-Disposition'] = f'attachment; filename="portfolio_{portfolio.id}_{timestamp}.pdf"'
            
            return response
        except Exception as e:
            raise Exception(PORTFOLIO_ERRORS["portfolio_export_failed"])
    
