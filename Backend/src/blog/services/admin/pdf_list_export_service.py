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
    
    PRIMARY_COLOR = colors.HexColor('#2563eb')
    LIGHT_BG = colors.HexColor('#f8fafc')
    BORDER_COLOR = colors.HexColor('#e2e8f0')
    TEXT_PRIMARY = colors.HexColor('#0f172a')
    TEXT_SECONDARY = colors.HexColor('#475569')
    
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
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading3'],
            fontSize=16,
            textColor=BlogPDFListExportService.PRIMARY_COLOR,
            spaceAfter=12,
            spaceBefore=20,
            alignment=2,
            fontName=persian_font_name,
            leading=20,
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=BlogPDFListExportService.TEXT_PRIMARY,
            spaceAfter=10,
            alignment=2,
            fontName=persian_font_name,
            leading=14,
            wordWrap='LTR',
        )
        
        return {
            'heading': heading_style,
            'normal': normal_style,
        }
    
    @staticmethod
    def export_blogs_pdf(queryset):
        if not REPORTLAB_AVAILABLE:
            raise ImportError(BLOG_ERRORS["blog_export_failed"])
        
        try:
            buffer = BytesIO()
            
            persian_font_name = BlogPDFListExportService._register_persian_font()
            process_persian_text = BlogPDFListExportService._process_persian_text
            
            def add_header_footer(canv, doc):
                canv.saveState()
                canv.setFont(persian_font_name, 9)
                canv.setFillColor(BlogPDFListExportService.TEXT_SECONDARY)
                page_text = process_persian_text(PDF_LABELS['page'].format(page=doc.page))
                canv.setFont(persian_font_name, 10)
                canv.drawString(40, 580, page_text)
                canv.restoreState()
            
            page_size = landscape(A4)
            doc = SimpleDocTemplate(buffer, pagesize=page_size, rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=30)
            elements = []
            
            pdf_styles = BlogPDFListExportService._create_persian_styles(persian_font_name)
            heading_style = pdf_styles['heading']
            normal_style = pdf_styles['normal']
            
            def convert_to_persian_date(dt):
                if not dt:
                    return ""
                try:
                    if JDATETIME_AVAILABLE:
                        jd = jdatetime.datetime.fromgregorian(datetime=dt)
                        return jd.strftime("%Y/%m/%d %H:%M:%S")
                    else:
                        year = dt.year - 621
                        month = dt.month
                        day = dt.day
                        return f"{year:04d}/{month:02d}/{day:02d} {dt.hour:02d}:{dt.minute:02d}:{dt.second:02d}"
                except Exception:
                    return dt.strftime("%Y-%m-%d %H:%M:%S")
            
            table_headers = [
                process_persian_text(PDF_LABELS['status']),
                process_persian_text(PDF_LABELS['created_at']),
                process_persian_text('Tags'),
                process_persian_text('Categories'),
                process_persian_text(PDF_LABELS['active']),
                process_persian_text(PDF_LABELS['public']),
                process_persian_text(PDF_LABELS['featured']),
                process_persian_text(PDF_LABELS['id']),
                process_persian_text('Title')
            ]
            
            escaped_headers = [escape(str(header)) for header in table_headers]
            
            table_data = [escaped_headers]
            
            for blog in queryset:
                categories = [cat.name for cat in blog.categories.all()]
                tags = [tag.name for tag in blog.tags.all()]
                
                title_text = blog.title or ""
                
                status_display = blog.get_status_display() if hasattr(blog, 'get_status_display') else str(blog.status)
                if status_display == 'Published':
                    status_display = PDF_LABELS['published']
                elif status_display == 'Draft':
                    status_display = PDF_LABELS['draft']
                elif status_display == 'Archived':
                    status_display = PDF_LABELS['archived']
                
                row = [
                    status_display,
                    convert_to_persian_date(blog.created_at) if blog.created_at else "",
                    tags,
                    categories,
                    PDF_LABELS['yes'] if blog.is_active else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if blog.is_public else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if blog.is_featured else PDF_LABELS['no'],
                    str(blog.id),
                    title_text
                ]
                
                table_data.append(row)
            
            available_width = 11.29 * inch
            col_widths = [
                0.8*inch,
                1.2*inch,
                1.3*inch,
                1.3*inch,
                1.3*inch,
                0.5*inch,
                0.5*inch,
                0.5*inch,
                0.5*inch,
                2.0*inch,
            ]
            
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            table_style = TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), persian_font_name),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('TEXTCOLOR', (0, 0), (-1, 0), BlogPDFListExportService.TEXT_PRIMARY),
                ('BOLD', (0, 0), (-1, 0), True),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, 0), 'RIGHT'),
                
                ('FONTNAME', (0, 1), (-1, -1), persian_font_name),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('TEXTCOLOR', (0, 1), (-1, -1), BlogPDFListExportService.TEXT_PRIMARY),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                
                ('ALIGN', (0, 1), (-1, -1), 'RIGHT'),
                
                ('LINEBELOW', (0, 0), (-1, 0), 1, BlogPDFListExportService.BORDER_COLOR),
                ('LINEBELOW', (0, 1), (-1, -1), 0.5, BlogPDFListExportService.BORDER_COLOR),
                
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BlogPDFListExportService.LIGHT_BG]),
                
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ])
            
            for row_idx in range(1, len(table_data)):
                row = table_data[row_idx]
                
                if len(row) > 0:
                    status_text = escape(process_persian_text(str(row[0])))
                    status_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{status_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[0] = status_para
                if len(row) > 1:
                    date_text = escape(process_persian_text(str(row[1])))
                    date_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{date_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[1] = date_para
                
                for col_idx in [2, 3, 4]:
                    if col_idx < len(row):
                        items = row[col_idx]
                        if isinstance(items, list):
                            if not items:
                                bullet_text = escape(process_persian_text("-"))
                            else:
                                bullet_items = []
                                for item in items:
                                    item_text = escape(process_persian_text(str(item)))
                                    bullet_items.append(f'• {item_text}')
                                bullet_text = '<br/>'.join(bullet_items)
                            
                            list_para = Paragraph(
                                f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                                f'{bullet_text}'
                                f'</font></para>',
                                normal_style
                            )
                            row[col_idx] = list_para
                        else:
                            cell_text = escape(process_persian_text(str(items)))
                            row[col_idx] = cell_text
                
                for col_idx in [5, 6, 7]:
                    if col_idx < len(row):
                        cell_text = escape(process_persian_text(str(row[col_idx])))
                        cell_para = Paragraph(
                            f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                            f'{cell_text}'
                            f'</font></para>',
                            normal_style
                        )
                        row[col_idx] = cell_para
                
                if len(row) > 8:
                    id_text = escape(process_persian_text(str(row[8])))
                    id_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{id_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[8] = id_para
                
                if len(row) > 9:
                    title_text = escape(process_persian_text(str(row[9])))
                    title_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{title_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[9] = title_para
            
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            table.setStyle(table_style)
            elements.append(table)
            
            doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
            buffer.seek(0)
            
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/pdf'
            )
            timestamp = datetime.now().strftime("%Y%m%d")
            response['Content-Disposition'] = f'attachment; filename="blogs_list_{timestamp}.pdf"'
            
            return response
        except Exception as e:
            raise Exception(BLOG_ERRORS["blog_export_failed"])

