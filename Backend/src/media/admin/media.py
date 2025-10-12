from django.contrib import admin
from django.utils.html import format_html
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


# Register each media type separately
@admin.register(ImageMedia)
class ImageMediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'preview', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title',)
    readonly_fields = ('created_at', 'preview')

    fieldsets = (
        (None, {
            'fields': ('file', 'title', 'alt_text', 'is_active')
        }),
        ('Preview', {
            'fields': ('preview',),
        }),
        ('Advanced Options', {
            'classes': ('collapse',),
            'fields': ('created_at',),
        }),
    )

    def preview(self, obj):
        """نمایش پیش‌نمایش مدیا در پنل ادمین"""
        if obj.file:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />', obj.file.url)
        return "-"

class MediaInline(admin.TabularInline):
    """
    اینلاین برای اضافه کردن مدیا به مدل‌های دیگر.
    """
    model = ImageMedia
    extra = 1
    fields = ('file', 'title', 'is_active', 'preview')
    readonly_fields = ('preview',)
    show_change_link = True

    def preview(self, obj):
        """نمایش تصویر یا ویدیو در اینلاین ادمین"""
        if obj.file:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                obj.file.url
            )
        return "-"

    preview.short_description = "Preview"