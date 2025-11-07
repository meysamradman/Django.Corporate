from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone

from src.form.models import ContactFormField


@admin.register(ContactFormField)
class ContactFormFieldAdmin(admin.ModelAdmin):
    """Admin interface for ContactFormField"""
    
    list_display = [
        'id',
        'field_key',
        'label',
        'field_type_badge',
        'required_badge',
        'platforms_display',
        'order',
        'is_active',
        'created_at',
    ]
    
    list_filter = [
        'field_type',
        'required',
        'is_active',
        'created_at',
    ]
    
    search_fields = [
        'field_key',
        'label',
        'placeholder',
    ]
    
    readonly_fields = [
        'id',
        'public_id',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('field_key', 'field_type', 'label', 'placeholder', 'required')
        }),
        ('تنظیمات پلتفرم', {
            'fields': ('platforms', 'order', 'is_active')
        }),
        ('گزینه‌ها (برای فیلدهای انتخابی)', {
            'fields': ('options',),
            'classes': ('collapse',)
        }),
        ('قوانین اعتبارسنجی', {
            'fields': ('validation_rules',),
            'classes': ('collapse',)
        }),
        ('اطلاعات سیستم', {
            'fields': ('id', 'public_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['order', 'field_key']
    list_editable = ['order', 'is_active']
    
    def field_type_badge(self, obj):
        """نمایش نوع فیلد با رنگ"""
        colors = {
            'text': '#007bff',
            'email': '#28a745',
            'phone': '#17a2b8',
            'textarea': '#ffc107',
            'select': '#6f42c1',
            'checkbox': '#e83e8c',
            'radio': '#fd7e14',
            'number': '#20c997',
            'date': '#6610f2',
            'url': '#dc3545',
        }
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;border-radius:4px;font-size:11px;">{}</span>',
            colors.get(obj.field_type, '#6c757d'),
            obj.get_field_type_display()
        )
    field_type_badge.short_description = 'نوع'
    
    def required_badge(self, obj):
        """نمایش الزامی بودن"""
        if obj.required:
            return format_html(
                '<span style="background:#dc3545;color:white;padding:2px 8px;border-radius:3px;font-size:10px;">الزامی</span>'
            )
        return format_html(
            '<span style="background:#6c757d;color:white;padding:2px 8px;border-radius:3px;font-size:10px;">اختیاری</span>'
        )
    required_badge.short_description = 'الزامی'
    
    def platforms_display(self, obj):
        """نمایش پلتفرم‌ها"""
        platforms = obj.platforms or []
        badges = []
        if 'website' in platforms:
            badges.append('<span style="background:#007bff;color:white;padding:2px 8px;border-radius:3px;font-size:10px;">🌐 وب</span>')
        if 'mobile_app' in platforms:
            badges.append('<span style="background:#28a745;color:white;padding:2px 8px;border-radius:3px;font-size:10px;">📱 اپ</span>')
        return format_html(' '.join(badges) if badges else '-')
    platforms_display.short_description = 'پلتفرم‌ها'


