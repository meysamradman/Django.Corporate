from django.http import HttpResponse
from django.utils import timezone
from src.core.utils.date_utils import format_jalali_date
from src.blog.messages.messages import PDF_LABELS

class BlogPrintListExportService:
    """
    Service to generate a print-friendly HTML view for Blog listings.
    """

    @staticmethod
    def _get_css():
        return """
        <style>
            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
            
            :root {
                --primary-color: #2563eb;
                --text-primary: #0f172a;
                --text-secondary: #475569;
                --border-color: #e2e8f0;
                --bg-light: #f8fafc;
            }
            
            body {
                font-family: 'Vazirmatn', sans-serif;
                direction: rtl;
                margin: 0;
                padding: 20px;
                color: var(--text-primary);
                font-size: 12pt;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 20px;
            }
            
            .header h1 {
                margin: 0;
                color: var(--primary-color);
                font-size: 18pt;
            }
            
            .meta-info {
                margin-top: 10px;
                font-size: 10pt;
                color: var(--text-secondary);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 10pt;
            }
            
            th, td {
                border: 1px solid var(--border-color);
                padding: 12px 8px;
                text-align: right;
            }
            
            th {
                background-color: var(--bg-light);
                font-weight: bold;
                color: var(--text-primary);
            }
            
            tr:nth-child(even) {
                background-color: #fafafa;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                background: #f1f5f9;
            }
            
            @media print {
                body {
                    padding: 0;
                }
                
                .no-print {
                    display: none;
                }
                
                th {
                    background-color: #f0f0f0 !important;
                    -webkit-print-color-adjust: exact;
                }
                
                tr {
                    page-break-inside: avoid;
                }
                
                a {
                    text-decoration: none;
                    color: inherit;
                }
            }
        </style>
        """

    @staticmethod
    def export_blogs_print(queryset):
        html_content = [
            "<!DOCTYPE html>",
            "<html lang='fa' dir='rtl'>",
            "<head>",
            "<meta charset='UTF-8'>",
            "<title>List of Blogs</title>",
            BlogPrintListExportService._get_css(),
            "</head>",
            "<body>",
            
            # Print Button
            "<div class='no-print' style='text-align: left; margin-bottom: 20px;'>",
            "<button onclick='window.print()' style='padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: inherit;'>",
            "چاپ صفحه",
            "</button>",
            "</div>",
            
            "<div class='header'>",
            f"<h1>{PDF_LABELS.get('blogs_list', 'لیست مقالات')}</h1>",
            f"<div class='meta-info'>تاریخ گزارش: {format_jalali_date(timezone.now())}</div>",
            "</div>",
            
            "<table>",
            "<thead>",
            "<tr>",
            f"<th>{PDF_LABELS.get('title', 'عنوان')}</th>",
            f"<th>{PDF_LABELS.get('status', 'وضعیت')}</th>",
            f"<th>{PDF_LABELS.get('categories', 'دسته‌بندی‌ها')}</th>",
            f"<th>{PDF_LABELS.get('tags', 'تگ‌ها')}</th>",
            f"<th>{PDF_LABELS.get('created_at', 'تاریخ ایجاد')}</th>",
            f"<th>{PDF_LABELS.get('featured', 'ویژه')}</th>",
            "</tr>",
            "</thead>",
            "<tbody>"
        ]
        
        for blog in queryset:
            status_map = {
                'published': 'منتشر شده',
                'draft': 'پیش‌نویس',
                'archived': 'آرشیو'
            }
            status_text = status_map.get(blog.status, blog.status)
            
            categories = ", ".join([c.name for c in blog.categories.all()[:3]])
            tags = ", ".join([t.name for t in blog.tags.all()[:3]])
            created_at = format_jalali_date(blog.created_at)
            is_featured = "بله" if blog.is_featured else "خیر"
            
            html_content.append(f"""
            <tr>
                <td><strong>{blog.title}</strong></td>
                <td><span class="status-badge">{status_text}</span></td>
                <td>{categories or '-'}</td>
                <td>{tags or '-'}</td>
                <td style="direction: ltr; text-align: right;">{created_at}</td>
                <td>{is_featured}</td>
            </tr>
            """)
            
        html_content.extend([
            "</tbody>",
            "</table>",
            
            "<div class='meta-info' style='text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;'>",
            f"تعداد کل رکوردها: {queryset.count()}",
            "</div>",
            
            "</body>",
            "</html>"
        ])
        
        return HttpResponse("".join(html_content), content_type="text/html; charset=utf-8")
