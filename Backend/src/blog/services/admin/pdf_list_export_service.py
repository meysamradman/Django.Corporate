# -*- coding: utf-8 -*-
"""
Blog PDF List Export Service
Handles PDF export functionality for blog list (table format, similar to Excel)
"""
from io import BytesIO
from datetime import datetime
from html import escape
import os
import platform
from django.http import HttpResponse
from django.conf import settings

# Try to import jdatetime for Persian date conversion
try:
    import jdatetime
    JDATETIME_AVAILABLE = True
except ImportError:
    JDATETIME_AVAILABLE = False

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

from src.blog.messages.messages import BLOG_ERRORS


class BlogPDFListExportService:
    
    PRIMARY_COLOR = colors.HexColor('#2563eb')  # Blue
    LIGHT_BG = colors.HexColor('#f8fafc')  # Slate 50
    BORDER_COLOR = colors.HexColor('#e2e8f0')  # Slate 200
    TEXT_PRIMARY = colors.HexColor('#0f172a')  # Slate 900
    TEXT_SECONDARY = colors.HexColor('#475569')  # Slate 600
    
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
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            reshaped = arabic_reshaper.reshape(str(text))
            return get_display(reshaped)
        except ImportError:
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
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=20,
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=BlogPDFListExportService.TEXT_PRIMARY,
            spaceAfter=10,
            alignment=2,  # RIGHT alignment for RTL
            fontName=persian_font_name,
            leading=14,
            wordWrap='LTR',  # Enable word wrapping
        )
        
        return {
            'heading': heading_style,
            'normal': normal_style,
        }
    
    @staticmethod
    def export_blogs_pdf(queryset):
        """
        Export blog list to PDF (table format, similar to Excel)
        
        Args:
            queryset: Blog queryset with prefetch_related
            
        Returns:
            HttpResponse with PDF file containing blog list table
        """
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
                # Landscape page size: 11.69 x 8.27 inches
                # Process Persian text for page number - larger font
                page_text = process_persian_text(f"صفحه {doc.page}")
                canv.setFont(persian_font_name, 10)  # Larger font for page number
                canv.drawString(40, 580, page_text)
                canv.restoreState()
            
            # Use landscape orientation for better table fit
            page_size = landscape(A4)
            doc = SimpleDocTemplate(buffer, pagesize=page_size, rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=30)
            elements = []
            
            pdf_styles = BlogPDFListExportService._create_persian_styles(persian_font_name)
            heading_style = pdf_styles['heading']
            normal_style = pdf_styles['normal']
            
            # No header - skip title and date
            
            # Helper function to convert date to Persian
            def convert_to_persian_date(dt):
                if not dt:
                    return ""
                try:
                    if JDATETIME_AVAILABLE:
                        jd = jdatetime.datetime.fromgregorian(datetime=dt)
                        # Format: YYYY/MM/DD HH:MM:SS
                        return jd.strftime("%Y/%m/%d %H:%M:%S")
                    else:
                        # Fallback: simple conversion
                        year = dt.year - 621
                        month = dt.month
                        day = dt.day
                        return f"{year:04d}/{month:02d}/{day:02d} {dt.hour:02d}:{dt.minute:02d}:{dt.second:02d}"
                except Exception:
                    return dt.strftime("%Y-%m-%d %H:%M:%S")
            
            # Table headers - RTL order: حذف تاریخ بروزرسانی
            table_headers = [
                process_persian_text('وضعیت'),  # اول در RTL (سمت راست)
                process_persian_text('تاریخ ایجاد'),  # فقط تاریخ ایجاد
                process_persian_text('تگ‌ها'),
                process_persian_text('دسته‌بندی‌ها'),
                process_persian_text('فعال'),
                process_persian_text('عمومی'),
                process_persian_text('ویژه'),
                process_persian_text('ID'),
                process_persian_text('عنوان')  # آخر در RTL (سمت چپ)
            ]
            
            # Escape headers and convert to strings
            escaped_headers = [escape(str(header)) for header in table_headers]
            
            # Table data rows
            table_data = [escaped_headers]
            
            for blog in queryset:
                # Get list items
                categories = [cat.name for cat in blog.categories.all()]
                tags = [tag.name for tag in blog.tags.all()]
                
                # Title - will be converted to Paragraph for right alignment
                title_text = blog.title or ""
                
                # Status - convert to Persian
                status_display = blog.get_status_display() if hasattr(blog, 'get_status_display') else str(blog.status)
                if status_display == 'Published':
                    status_display = 'منتشر شده'
                elif status_display == 'Draft':
                    status_display = 'پیش‌نویس'
                elif status_display == 'Archived':
                    status_display = 'بایگانی شده'
                
                # RTL order: حذف تاریخ بروزرسانی
                row = [
                    status_display,  # اول در RTL (سمت راست)
                    convert_to_persian_date(blog.created_at) if blog.created_at else "",  # تاریخ فارسی
                    tags,  # Will be converted to bullet list
                    categories,  # Will be converted to bullet list
                    "بله" if blog.is_active else "خیر",
                    "بله" if blog.is_public else "خیر",
                    "بله" if blog.is_featured else "خیر",
                    str(blog.id),
                    title_text  # آخر در RTL (سمت چپ)
                ]
                
                table_data.append(row)
            
            # Calculate available width (landscape A4: 11.69" - margins: 0.4" = 11.29")
            available_width = 11.29 * inch
            # Optimized column widths for landscape - RTL order (از راست به چپ) - حذف تاریخ بروزرسانی
            # وضعیت, تاریخ ایجاد, لیست‌ها, بله/خیر, ID, عنوان
            col_widths = [
                0.8*inch,   # وضعیت (0) - راست
                1.2*inch,   # تاریخ ایجاد (1) - بزرگتر برای تاریخ فارسی
                1.3*inch,   # گزینه‌ها (2)
                1.3*inch,   # تگ‌ها (3)
                1.3*inch,   # دسته‌بندی‌ها (4)
                0.5*inch,   # فعال (5)
                0.5*inch,   # عمومی (6)
                0.5*inch,   # ویژه (7)
                0.5*inch,   # ID (8)
                2.0*inch,   # عنوان (9) - چپ - بزرگتر برای wrap
            ]
            # Total: ~10.9 inch
            
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Apply table style - clean style like the reference image
            table_style = TableStyle([
                # Header row - simple, no background color - larger and bolder
                ('FONTNAME', (0, 0), (-1, 0), persian_font_name),
                ('FONTSIZE', (0, 0), (-1, 0), 11),  # Larger font
                ('TEXTCOLOR', (0, 0), (-1, 0), BlogPDFListExportService.TEXT_PRIMARY),
                ('BOLD', (0, 0), (-1, 0), True),  # Already bold
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                # Header alignment - همه راست‌چین (RTL)
                ('ALIGN', (0, 0), (-1, 0), 'RIGHT'),  # همه header ها راست‌چین
                
                # Data rows - general styling - larger font
                ('FONTNAME', (0, 1), (-1, -1), persian_font_name),
                ('FONTSIZE', (0, 1), (-1, -1), 10),  # Larger font (was 8)
                ('TEXTCOLOR', (0, 1), (-1, -1), BlogPDFListExportService.TEXT_PRIMARY),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                
                # Column-specific alignments - همه راست‌چین (RTL)
                ('ALIGN', (0, 1), (-1, -1), 'RIGHT'),  # همه داده‌ها راست‌چین
                
                # Borders - only horizontal lines between rows, no vertical lines
                ('LINEBELOW', (0, 0), (-1, 0), 1, BlogPDFListExportService.BORDER_COLOR),  # Header bottom border
                ('LINEBELOW', (0, 1), (-1, -1), 0.5, BlogPDFListExportService.BORDER_COLOR),  # Row separators
                
                # Alternating row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BlogPDFListExportService.LIGHT_BG]),
                
                # Padding - reduced for better fit
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ])
            
            # Convert cells to proper format: Title to Paragraph (right-aligned), Lists to bullet list Paragraphs
            for row_idx in range(1, len(table_data)):  # Skip header
                row = table_data[row_idx]
                
                # RTL order: وضعیت (0), تاریخ ایجاد (1), لیست‌ها (2,3,4), بله/خیر (5,6,7), ID (8), عنوان (9)
                
                # Convert status (col 0) to Paragraph with right alignment and word wrap
                if len(row) > 0:
                    status_text = escape(process_persian_text(str(row[0])))
                    status_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{status_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[0] = status_para
                
                # Convert date (col 1) to Paragraph with right alignment
                if len(row) > 1:
                    date_text = escape(process_persian_text(str(row[1])))
                    date_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{date_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[1] = date_para
                
                # Convert list columns (2, 3, 4) to bullet list Paragraphs - گزینه‌ها, تگ‌ها, دسته‌بندی‌ها
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
                            # Fallback for non-list values
                            cell_text = escape(process_persian_text(str(items)))
                            row[col_idx] = cell_text
                
                # Convert بله/خیر columns (5, 6, 7) - فعال, عمومی, ویژه - به Paragraph برای wrap
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
                
                # Convert ID (col 8) to Paragraph
                if len(row) > 8:
                    id_text = escape(process_persian_text(str(row[8])))
                    id_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{id_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[8] = id_para
                
                # Convert title (col 9 - last) to Paragraph with right alignment and word wrap
                if len(row) > 9:
                    title_text = escape(process_persian_text(str(row[9])))
                    title_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{BlogPDFListExportService.TEXT_PRIMARY}">'
                        f'{title_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[9] = title_para
            
            # Create table with processed data
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            table.setStyle(table_style)
            elements.append(table)
            
            # Build PDF
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
            import traceback
            raise Exception(BLOG_ERRORS["blog_export_failed"])

