import logging
import traceback
from io import BytesIO
from datetime import datetime
from django.http import HttpResponse
from src.core.utils.date_utils import format_jalali_medium, format_jalali_long
from src.core.utils.pdf_base_service import PDFBaseExportService, REPORTLAB_AVAILABLE
from src.real_estate.messages.messages import PDF_LABELS

logger = logging.getLogger(__name__)

if REPORTLAB_AVAILABLE:
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.platypus.flowables import HRFlowable
    from reportlab.lib.pagesizes import A4

class PropertyPDFExportService:
    @staticmethod
    def export_property_pdf(property_instance):
        """
        Export a single property to a professional PDF document.
        """
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

        # Page dimension setup
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4, 
            rightMargin=40, 
            leftMargin=40, 
            topMargin=50, 
            bottomMargin=50
        )
        elements = []
        
        # 1. Title Section
        elements.append(Paragraph(rtl(property_instance.title), styles['title']))
        elements.append(HRFlowable(width="100%", thickness=1, color=clr.PRIMARY, spaceAfter=20))
        
        # 2. Main Image
        main_img = property_instance.get_main_image()
        rl_img = PDFBaseExportService.get_image(main_img)
        if rl_img:
            elements.append(rl_img)
            elements.append(Spacer(1, 20))

        # 3. Status and Numerical Data
        status_map = {
            'active': 'فعال', 
            'pending': 'در حال معامله', 
            'sold': 'فروخته شده', 
            'rented': 'اجاره داده شده', 
            'archived': 'بایگانی شده'
        }
        
        # Price Formatting
        price = property_instance.price or property_instance.sale_price or property_instance.monthly_rent
        formatted_price = f"{price:,} {property_instance.currency or 'تومان'}" if price else "-"

        # Metadata Table (Detailed view)
        meta_data = [
            [rtl(PDF_LABELS.get('status', 'وضعیت')), rtl(status_map.get(property_instance.status, property_instance.status))],
            [rtl(PDF_LABELS.get('property_type', 'نوع ملک')), rtl(property_instance.property_type.title if property_instance.property_type else "-")],
            [rtl(PDF_LABELS.get('state', 'وضعیت ملک')), rtl(property_instance.state.title if property_instance.state else "-")],
            [rtl(PDF_LABELS.get('city', 'شهر')), rtl(property_instance.city.name if property_instance.city else "-")],
            [rtl(PDF_LABELS.get('price', 'قیمت')), rtl(formatted_price)],
            [rtl(PDF_LABELS.get('built_area', 'متراژ')), rtl(f"{property_instance.built_area} متر" if property_instance.built_area else "-")],
            [rtl(PDF_LABELS.get('bedrooms', 'خواب')), rtl(str(property_instance.bedrooms) if property_instance.bedrooms is not None else "-")],
            [rtl(PDF_LABELS.get('bathrooms', 'حمام')), rtl(str(property_instance.bathrooms) if property_instance.bathrooms is not None else "-")],
            [rtl(PDF_LABELS.get('created_at', 'تاریخ ثبت')), rtl(format_jalali_long(property_instance.created_at))],
        ]
        
        meta_table = Table(meta_data, colWidths=[1.5*inch, 4.0*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('BACKGROUND', (0, 0), (0, -1), clr.LIGHT_BG),
            ('GRID', (0, 0), (-1, -1), 0.5, clr.BORDER),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 25))

        # 4. Features Selection
        features_list = property_instance.features.all()
        if features_list.exists():
            elements.append(Paragraph(rtl(PDF_LABELS.get('features', 'ویژگی‌ها')), styles['section']))
            features_text = ", ".join([f.title for f in features_list])
            elements.append(Paragraph(rtl(features_text), styles['content']))
            elements.append(Spacer(1, 15))

        # 5. Tags Selection
        tags_list = property_instance.tags.all()
        if tags_list.exists():
            elements.append(Paragraph(rtl(PDF_LABELS.get('tags', 'کلیدواژه‌ها')), styles['section']))
            tags_text = ", ".join([t.title for t in tags_list])
            elements.append(Paragraph(rtl(tags_text), styles['content']))
            elements.append(Spacer(1, 15))

        # 6. Description
        if property_instance.description:
            elements.append(Paragraph(rtl("توضیحات تکمیلی"), styles['section']))
            elements.append(Paragraph(rtl(property_instance.description.replace('\n', '<br/>')), styles['content']))

        # Footer branding
        footer_func = PDFBaseExportService.get_generic_footer_func(
            font_name, 
            f"گزارش ملک | {format_jalali_medium(datetime.now())}"
        )
        
        try:
            logger.info(f"Building single property PDF ID: {property_instance.id}...")
            doc.build(elements, onFirstPage=footer_func, onLaterPages=footer_func)
            logger.info("Property PDF build success.")
        except Exception as e:
            logger.error(f"Property PDF build crash (ID: {property_instance.id}): {str(e)}")
            logger.error(traceback.format_exc())
            raise

        buffer.seek(0)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        from django.utils.encoding import escape_uri_path
        filename = f"ملک_{property_instance.id}.pdf"
        
        logger.info(f"Generated single property PDF size: {len(pdf_content)} bytes.")

        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f"attachment; filename*=utf-8''{escape_uri_path(filename)}"

        return response
