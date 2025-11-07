from django.contrib import admin
from src.page.models import AboutPage, TermsPage


@admin.register(AboutPage)
class AboutPageAdmin(admin.ModelAdmin):
    """Admin interface for About Page model"""
    
    list_display = [
        'title',
        'is_active',
        'created_at',
        'updated_at',
    ]
    
    list_filter = [
        'is_active',
        'created_at',
        'updated_at',
    ]
    
    search_fields = [
        'title',
        'content',
    ]
    
    readonly_fields = [
        'id',
        'public_id',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('title', 'content', 'short_description')
        }),
        ('SEO - Meta Tags', {
            'fields': ('meta_title', 'meta_description', 'robots_meta', 'canonical_url')
        }),
        ('SEO - Open Graph', {
            'fields': ('og_title', 'og_description', 'og_image')
        }),
        ('SEO - Advanced', {
            'fields': ('structured_data', 'hreflang_data'),
            'classes': ('collapse',)
        }),
        ('رسانه', {
            'fields': ('featured_image',)
        }),
        ('تنظیمات', {
            'fields': ('is_active',)
        }),
        ('اطلاعات سیستم', {
            'fields': ('id', 'public_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    list_editable = ['is_active']


@admin.register(TermsPage)
class TermsPageAdmin(admin.ModelAdmin):
    """Admin interface for Terms Page model"""
    
    list_display = [
        'title',
        'is_active',
        'created_at',
        'updated_at',
    ]
    
    list_filter = [
        'is_active',
        'created_at',
        'updated_at',
    ]
    
    search_fields = [
        'title',
        'content',
    ]
    
    readonly_fields = [
        'id',
        'public_id',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('اطلاعات پایه', {
            'fields': ('title', 'content', 'short_description')
        }),
        ('SEO - Meta Tags', {
            'fields': ('meta_title', 'meta_description', 'robots_meta', 'canonical_url')
        }),
        ('SEO - Open Graph', {
            'fields': ('og_title', 'og_description', 'og_image')
        }),
        ('SEO - Advanced', {
            'fields': ('structured_data', 'hreflang_data'),
            'classes': ('collapse',)
        }),
        ('رسانه', {
            'fields': ('featured_image',)
        }),
        ('تنظیمات', {
            'fields': ('is_active',)
        }),
        ('اطلاعات سیستم', {
            'fields': ('id', 'public_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
    list_editable = ['is_active']

