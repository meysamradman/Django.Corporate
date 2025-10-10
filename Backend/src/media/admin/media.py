from django.contrib import admin
from django.utils.html import format_html
from src.media.models.media import Media


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'media_type', 'title', 'preview', 'cover_image_preview', 'is_active', 'created_at')
    list_filter = ('media_type', 'is_active', 'created_at')
    search_fields = ('title', 'file')
    readonly_fields = ('created_at', 'preview', 'cover_image_preview')

    fieldsets = (
        (None, {
            'fields': ('media_type', 'file', 'title', 'alt_text', 'is_active', 'cover_image')
        }),
        ('Preview', {
            'fields': ('preview', 'cover_image_preview'),
        }),
        ('Advanced Options', {
            'classes': ('collapse',),
            'fields': ('created_at',),
        }),
    )

    def preview(self, obj):
        """نمایش پیش‌نمایش مدیا در پنل ادمین"""
        if obj.file:
            if obj.media_type == "image":
                return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />', obj.file.url)
            elif obj.media_type == "video":
                return format_html('<video width="50" height="50" controls><source src="{}" type="video/mp4"></video>', obj.file.url)
        return "-"

    def cover_image_preview(self, obj):
        """نمایش کاور مدیا در ادمین"""
        if obj.cover_image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />', obj.cover_image.url)
        return "-"

    cover_image_preview.short_description = "Cover Image Preview"

class MediaInline(admin.TabularInline):
    """
    اینلاین برای اضافه کردن مدیا به مدل‌های دیگر.
    """
    model = Media
    extra = 1
    fields = ('media_type', 'file', 'title', 'is_active', 'preview')
    readonly_fields = ('preview',)
    show_change_link = True

    def preview(self, obj):
        """نمایش تصویر یا ویدیو در اینلاین ادمین"""
        if obj.file:
            if obj.media_type == "image":
                return format_html(
                    '<img src="{}" width="50" height="50" style="object-fit: cover; border-radius: 5px;" />',
                    obj.file.url
                )
            elif obj.media_type == "video":
                return format_html(
                    '<video width="50" height="50" controls>'
                    '<source src="{}" type="video/mp4">'
                    '</video>',
                    obj.file.url
                )
        return "-"

    preview.short_description = "Preview"

