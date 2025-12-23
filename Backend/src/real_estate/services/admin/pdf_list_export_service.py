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
    colors = None
    A4 = None
    landscape = None
    getSampleStyleSheet = None
    ParagraphStyle = None
    inch = None
    SimpleDocTemplate = None
    Paragraph = None
    Table = None
    TableStyle = None
    pdfmetrics = None
    TTFont = None

from src.real_estate.messages.messages import PROPERTY_ERRORS, PDF_LABELS


class PropertyPDFListExportService:
    
    if REPORTLAB_AVAILABLE and colors:
        PRIMARY_COLOR = colors.HexColor('#2563eb')
        LIGHT_BG = colors.HexColor('#f8fafc')
        BORDER_COLOR = colors.HexColor('#e2e8f0')
        TEXT_PRIMARY = colors.HexColor('#0f172a')
        TEXT_SECONDARY = colors.HexColor('#475569')
        WHITE_COLOR = colors.white
    else:
        PRIMARY_COLOR = None
        LIGHT_BG = None
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
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading3'],
            fontSize=16,
            textColor=PropertyPDFListExportService.PRIMARY_COLOR,
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
            textColor=PropertyPDFListExportService.TEXT_PRIMARY,
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
    def export_properties_pdf(queryset):
        if not REPORTLAB_AVAILABLE:
            raise ImportError(PROPERTY_ERRORS.get("property_export_failed", "Export failed"))
        
        try:
            buffer = BytesIO()
            
            persian_font_name = PropertyPDFListExportService._register_persian_font()
            process_persian_text = PropertyPDFListExportService._process_persian_text
            
            def add_header_footer(canv, doc):
                canv.saveState()
                canv.setFont(persian_font_name, 9)
                canv.setFillColor(PropertyPDFListExportService.TEXT_SECONDARY)
                page_text = process_persian_text(PDF_LABELS['page'].format(page=doc.page))
                canv.setFont(persian_font_name, 10)
                canv.drawString(40, 580, page_text)
                canv.restoreState()
            
            page_size = landscape(A4)
            doc = SimpleDocTemplate(buffer, pagesize=page_size, rightMargin=20, leftMargin=20, topMargin=30, bottomMargin=30)
            elements = []
            
            pdf_styles = PropertyPDFListExportService._create_persian_styles(persian_font_name)
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
                process_persian_text(PDF_LABELS['active']),
                process_persian_text(PDF_LABELS['verified']),
                process_persian_text(PDF_LABELS['public']),
                process_persian_text(PDF_LABELS['featured']),
                process_persian_text(PDF_LABELS['published']),
                process_persian_text(PDF_LABELS['features']),
                process_persian_text(PDF_LABELS['tags']),
                process_persian_text(PDF_LABELS['labels']),
                process_persian_text(PDF_LABELS['city']),
                process_persian_text(PDF_LABELS['state']),
                process_persian_text(PDF_LABELS['property_type']),
                process_persian_text(PDF_LABELS['created_at']),
                process_persian_text(PDF_LABELS['id']),
                process_persian_text(PDF_LABELS['title'])
            ]
            
            escaped_headers = [escape(str(header)) for header in table_headers]
            
            table_data = [escaped_headers]
            
            for property_obj in queryset:
                labels = [label.title for label in property_obj.labels.all()]
                tags = [tag.title for tag in property_obj.tags.all()]
                features = [feature.title for feature in property_obj.features.all()]
                
                title_text = property_obj.title or ""
                
                row = [
                    PDF_LABELS['yes'] if property_obj.is_active else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if property_obj.is_verified else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if property_obj.is_public else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if property_obj.is_featured else PDF_LABELS['no'],
                    PDF_LABELS['yes'] if property_obj.is_published else PDF_LABELS['no'],
                    features,
                    tags,
                    labels,
                    property_obj.city.name if property_obj.city else "",
                    property_obj.state.title if property_obj.state else "",
                    property_obj.property_type.title if property_obj.property_type else "",
                    convert_to_persian_date(property_obj.created_at) if property_obj.created_at else "",
                    str(property_obj.id),
                    title_text
                ]
                
                table_data.append(row)
            
            available_width = 11.29 * inch
            col_widths = [
                0.5*inch,
                0.5*inch,
                0.5*inch,
                0.5*inch,
                0.5*inch,
                1.0*inch,
                1.0*inch,
                1.0*inch,
                0.8*inch,
                0.8*inch,
                0.8*inch,
                1.2*inch,
                0.5*inch,
                1.5*inch,
            ]
            
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            table_style = TableStyle([
                ('FONTNAME', (0, 0), (-1, 0), persian_font_name),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('TEXTCOLOR', (0, 0), (-1, 0), PropertyPDFListExportService.TEXT_PRIMARY),
                ('BOLD', (0, 0), (-1, 0), True),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, 0), 'RIGHT'),
                
                ('FONTNAME', (0, 1), (-1, -1), persian_font_name),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('TEXTCOLOR', (0, 1), (-1, -1), PropertyPDFListExportService.TEXT_PRIMARY),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                
                ('ALIGN', (0, 1), (-1, -1), 'RIGHT'),
                
                ('LINEBELOW', (0, 0), (-1, 0), 1, PropertyPDFListExportService.BORDER_COLOR),
                ('LINEBELOW', (0, 1), (-1, -1), 0.5, PropertyPDFListExportService.BORDER_COLOR),
                
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [PropertyPDFListExportService.WHITE_COLOR, PropertyPDFListExportService.LIGHT_BG]),
                
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ])
            
            for row_idx in range(1, len(table_data)):
                row = table_data[row_idx]
                
                for col_idx in [0, 1, 2, 3, 4]:
                    if col_idx < len(row):
                        cell_text = escape(process_persian_text(str(row[col_idx])))
                        cell_para = Paragraph(
                            f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                            f'{cell_text}'
                            f'</font></para>',
                            normal_style
                        )
                        row[col_idx] = cell_para
                
                for col_idx in [5, 6, 7]:
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
                                f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                                f'{bullet_text}'
                                f'</font></para>',
                                normal_style
                            )
                            row[col_idx] = list_para
                        else:
                            cell_text = escape(process_persian_text(str(items)))
                            row[col_idx] = cell_text
                
                for col_idx in [8, 9, 10]:
                    if col_idx < len(row):
                        cell_text = escape(process_persian_text(str(row[col_idx])))
                        cell_para = Paragraph(
                            f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                            f'{cell_text}'
                            f'</font></para>',
                            normal_style
                        )
                        row[col_idx] = cell_para
                
                if len(row) > 11:
                    date_text = escape(process_persian_text(str(row[11])))
                    date_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                        f'{date_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[11] = date_para
                
                if len(row) > 12:
                    id_text = escape(process_persian_text(str(row[12])))
                    id_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                        f'{id_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[12] = id_para
                
                if len(row) > 13:
                    title_text = escape(process_persian_text(str(row[13])))
                    title_para = Paragraph(
                        f'<para align="right"><font name="{persian_font_name}" size="10" color="{PropertyPDFListExportService.TEXT_PRIMARY}">'
                        f'{title_text}'
                        f'</font></para>',
                        normal_style
                    )
                    row[13] = title_para
            
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
            response['Content-Disposition'] = f'attachment; filename="properties_list_{timestamp}.pdf"'
            
            return response
        except Exception as e:
            raise Exception(PROPERTY_ERRORS.get("property_export_failed", "Export failed"))

